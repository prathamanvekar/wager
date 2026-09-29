"""
Automated Integration and Invariant Test Suite for Wager Cross-Channel System.
Verifies CJEP v1 protocol validation, bitemporal AS-OF queries,
late identity binding, orphan buffer retention, and knowledge gap metrics.
"""

import unittest
from services.api.protocol import EventEnvelope, EventSource, EventIdentifiers, EventSubject, JourneyContext
from services.api.store import BitemporalStore


class TestWagerBitemporalSystem(unittest.TestCase):
    def setUp(self):
        # Create a fresh isolated store for testing
        self.store = BitemporalStore()

    def test_canonical_envelope_validation(self):
        """Invariant: Raw events are validated against CJEP v1 schema and stored immutably."""
        env = EventEnvelope(
            protocol_version="1.0",
            event_id="evt_test_01",
            event_type="web.session.started",
            source=EventSource(channel="web", application="customer-web", instance_id="ses_1"),
            valid_time="2026-09-28T10:00:00Z",
            ingest_time="2026-09-28T10:00:01Z",
            identifiers=EventIdentifiers(session_id="ses_1", device_id="dev_1", ip_hash="ip_1"),
            subject=EventSubject(customer_id=None, identity_state="orphan"),
            payload={"test": True},
        )
        res = self.store.ingest_event(env)
        self.assertEqual(res.status, "buffered_orphan")
        self.assertEqual(res.identity_state, "orphan")
        self.assertIn("evt_test_01", self.store.events)

    def test_flagship_late_identity_binding_and_retractions(self):
        """
        Flagship F1 Scenario:
        1. Mon 10:00 logged-out dispute -> buffered as orphan.
        2. Mon 10:47 customer logs in on same device -> claims orphan, creates v2 attribution, emits changelog retraction.
        """
        # Step 1: Mon 10:00 Dispute
        dispute_env = EventEnvelope(
            protocol_version="1.0",
            event_id="evt_mon_1000_dispute",
            event_type="support.dispute.created",
            source=EventSource(channel="web", application="customer-web", instance_id="ses_1"),
            valid_time="2026-09-28T10:00:00Z",
            ingest_time="2026-09-28T10:00:00Z",
            identifiers=EventIdentifiers(session_id="ses_1", device_id="tok_dev_41e", ip_hash="tok_ip_9c"),
            subject=EventSubject(customer_id=None, identity_state="orphan"),
            journey=JourneyContext(case_id="case_88213", thread_hint="billing_dispute"),
            payload={"amount": 142.50, "merchant": "CloudScale SaaS"},
        )
        res1 = self.store.ingest_event(dispute_env)
        self.assertEqual(res1.status, "buffered_orphan")
        self.assertEqual(res1.identity_state, "orphan")

        # Invariant: Prior to 10:47, journey for C1041 has 0 events
        pre_login_journey = self.store.get_journey("C1041")
        self.assertEqual(pre_login_journey.total_events, 0)

        # Step 2: Mon 10:47 Customer Logs in
        login_env = EventEnvelope(
            protocol_version="1.0",
            event_id="evt_mon_1047_login",
            event_type="web.login.completed",
            source=EventSource(channel="web", application="customer-web", instance_id="ses_2"),
            valid_time="2026-09-28T10:47:00Z",
            ingest_time="2026-09-28T10:47:00Z",
            identifiers=EventIdentifiers(
                session_id="ses_2",
                device_id="tok_dev_41e",
                ip_hash="tok_ip_9c",
                customer_id="C1041",
            ),
            subject=EventSubject(customer_id="C1041", identity_state="resolved"),
            journey=JourneyContext(thread_hint="customer_authentication"),
            payload={"auth_method": "password_otp"},
        )
        res2 = self.store.ingest_event(login_env)
        self.assertEqual(res2.status, "accepted")
        self.assertEqual(res2.bound_orphans_count, 1)
        self.assertEqual(res2.retractions_emitted, 1)

        # Invariant: Two attribution versions exist for the dispute event
        versions = [a for a in self.store.attributions if a.event_id == "evt_mon_1000_dispute"]
        self.assertEqual(len(versions), 2)
        self.assertEqual(versions[0].identity_state, "orphan")
        self.assertIsNotNone(versions[0].superseded_at)  # v1 closed at 10:47
        self.assertEqual(versions[1].identity_state, "resolved")
        self.assertEqual(versions[1].customer_id, "C1041")
        self.assertIsNone(versions[1].superseded_at)  # v2 currently active

        # Invariant: Retraction changelog contains the retraction pair
        self.assertEqual(len(self.store.retractions), 1)
        self.assertEqual(self.store.retractions[0].old_state["identity_state"], "orphan")
        self.assertEqual(self.store.retractions[0].new_state["customer_id"], "C1041")

    def test_bitemporal_as_of_and_knowledge_gap(self):
        """
        Bitemporal Store & Knowledge Gap Invariant:
        An AS-OF query at Wed 14:20 accurately reconstructs what was believed then,
        and computes the exact quantity of history that arrived or was bound later.
        """
        device = "dev_gap_test"
        customer = "C1041"

        # 1. Mon 10:00 Anonymous Dispute
        self.store.ingest_event(
            EventEnvelope(
                event_id="e_dispute",
                event_type="support.dispute.created",
                source=EventSource(channel="web", application="customer-web", instance_id="s1"),
                valid_time="2026-09-28T10:00:00Z",
                ingest_time="2026-09-28T10:00:00Z",
                identifiers=EventIdentifiers(session_id="s1", device_id=device, ip_hash="ip1"),
                subject=EventSubject(customer_id=None, identity_state="orphan"),
            )
        )

        # 2. Mon 10:47 Login
        self.store.ingest_event(
            EventEnvelope(
                event_id="e_login",
                event_type="web.login.completed",
                source=EventSource(channel="web", application="customer-web", instance_id="s2"),
                valid_time="2026-09-28T10:47:00Z",
                ingest_time="2026-09-28T10:47:00Z",
                identifiers=EventIdentifiers(session_id="s2", device_id=device, ip_hash="ip1", customer_id=customer),
                subject=EventSubject(customer_id=customer, identity_state="resolved"),
            )
        )

        # 3. Wed 14:20 Call Metadata (immediate)
        self.store.ingest_event(
            EventEnvelope(
                event_id="e_call_meta",
                event_type="call.interaction.started",
                source=EventSource(channel="call", application="call-simulator", instance_id="call_1"),
                valid_time="2026-09-30T14:20:00Z",
                ingest_time="2026-09-30T14:20:02Z",
                identifiers=EventIdentifiers(session_id="call_1", device_id="phone_1", ip_hash="ip_call", customer_id=customer),
                subject=EventSubject(customer_id=customer, identity_state="resolved"),
            )
        )

        # 4. Wed 20:15 Late Transcript Sync (valid_time = 14:20, ingest_time = 20:15)
        self.store.ingest_event(
            EventEnvelope(
                event_id="e_call_transcript",
                event_type="call.transcript.synced",
                source=EventSource(channel="call", application="call-simulator", instance_id="call_1"),
                valid_time="2026-09-30T14:20:00Z",
                ingest_time="2026-09-30T20:15:00Z",
                identifiers=EventIdentifiers(session_id="call_1", device_id="phone_1", ip_hash="ip_call", customer_id=customer),
                subject=EventSubject(customer_id=customer, identity_state="resolved"),
            )
        )

        # Present View: 4 events known
        current_journey = self.store.get_journey(customer)
        self.assertEqual(current_journey.total_events, 4)

        # Historical View AS-OF Wed 14:20 (when call started):
        # At 14:20, the transcript was NOT yet learned (learned at 20:15)
        as_of_1420 = self.store.get_journey(customer, as_of_time="2026-09-30T14:20:05Z")
        self.assertEqual(as_of_1420.total_events, 3)
        as_of_event_ids = [e["event_id"] for e in as_of_1420.events]
        self.assertNotIn("e_call_transcript", as_of_event_ids)

        # Knowledge Gap at Wed 14:20
        gap_resp = self.store.compute_knowledge_gap(customer, contact_time="2026-09-30T14:20:05Z")
        self.assertEqual(gap_resp.knowledge_gap, 1)
        self.assertEqual(gap_resp.invisible_events[0]["event_id"], "e_call_transcript")


if __name__ == "__main__":
    unittest.main()
