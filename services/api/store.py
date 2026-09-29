"""
Wager In-Memory Bitemporal Store and Identity Binding Engine.
Implements the core two-clock temporal model, pending orphan buffer,
and retraction changelog for cross-channel journey stitching.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
from .protocol import (
    EventEnvelope,
    AttributionRecord,
    RetractionPair,
    EventIngestResponse,
    JourneyResponse,
    KnowledgeGapResponse,
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class BitemporalStore:
    def __init__(self):
        # 1. Immutable raw event log: event_id -> EventEnvelope
        self.events: Dict[str, EventEnvelope] = {}

        # 2. Bitemporal attribution versions: attribution_id -> AttributionRecord
        self.attributions: List[AttributionRecord] = []
        self._next_attribution_id = 1

        # 3. Pending orphan buffer: device_id -> List[event_id]
        self.orphan_buffer_by_device: Dict[str, List[str]] = {}
        self.orphan_buffer_by_session: Dict[str, List[str]] = {}

        # 4. Retraction changelog
        self.retractions: List[RetractionPair] = []
        self._next_retraction_id = 1

        # 5. Active SSE listeners
        self.listeners = []

    def ingest_event(self, envelope: EventEnvelope) -> EventIngestResponse:
        event_id = envelope.event_id
        # Use provided ingest_time (e.g. from simulation/envelope) or current clock
        learned_time = envelope.ingest_time if envelope.ingest_time else utc_now()

        # 1. Store raw event immutably
        self.events[event_id] = envelope

        # 2. Determine initial attribution
        customer_id = envelope.identifiers.customer_id or envelope.subject.customer_id
        device_id = envelope.identifiers.device_id
        session_id = envelope.identifiers.session_id

        bound_orphans_count = 0
        retractions_emitted = 0

        if customer_id:
            # Deterministic resolution
            identity_state = "resolved"
            confidence = 1.0
            method = "deterministic"
            evidence = {"strong_identifier": "customer_id", "value": customer_id}

            # Create attribution v1
            attr_rec = AttributionRecord(
                attribution_id=self._next_attribution_id,
                event_id=event_id,
                customer_id=customer_id,
                identity_state=identity_state,
                confidence=confidence,
                method=method,
                evidence=evidence,
                learned_at=learned_time,
                superseded_at=None,
            )
            self._next_attribution_id += 1
            self.attributions.append(attr_rec)

            # Check if this strong identity claims any pending orphans from this device!
            bound_orphans_count, retractions_emitted = self._trigger_binding(
                customer_id=customer_id,
                device_id=device_id,
                session_id=session_id,
                binding_time=learned_time,
            )

            status = "accepted"
            message = f"Event {event_id} resolved deterministically to customer {customer_id}."

        else:
            # No strong customer ID -> ORPHAN
            identity_state = "orphan"
            confidence = 0.0
            method = "deterministic"
            evidence = {"weak_signals": ["device_id", "session_id", "ip_hash"]}

            # Create initial orphan attribution version
            attr_rec = AttributionRecord(
                attribution_id=self._next_attribution_id,
                event_id=event_id,
                customer_id=None,
                identity_state=identity_state,
                confidence=confidence,
                method=method,
                evidence=evidence,
                learned_at=learned_time,
                superseded_at=None,
            )
            self._next_attribution_id += 1
            self.attributions.append(attr_rec)

            # Buffer orphan for retroactive binding
            if device_id not in self.orphan_buffer_by_device:
                self.orphan_buffer_by_device[device_id] = []
            self.orphan_buffer_by_device[device_id].append(event_id)

            if session_id not in self.orphan_buffer_by_session:
                self.orphan_buffer_by_session[session_id] = []
            self.orphan_buffer_by_session[session_id].append(event_id)

            status = "buffered_orphan"
            message = f"Event {event_id} has no strong identifier. Retained in pending buffer as ORPHAN with device {device_id}."

        return EventIngestResponse(
            status=status,
            event_id=event_id,
            valid_time=envelope.valid_time,
            ingest_time=learned_time,
            assigned_customer_id=customer_id,
            identity_state=identity_state,
            attribution_id=attr_rec.attribution_id,
            bound_orphans_count=bound_orphans_count,
            retractions_emitted=retractions_emitted,
            message=message,
        )

    def _trigger_binding(
        self,
        customer_id: str,
        device_id: str,
        session_id: str,
        binding_time: str,
    ) -> (int, int):
        """
        Scans pending orphan buffer for events emitted from the same device/session.
        Closes v1 attribution and opens v2 attribution with retraction changelog.
        """
        candidate_ids = set()
        if device_id in self.orphan_buffer_by_device:
            candidate_ids.update(self.orphan_buffer_by_device[device_id])
        if session_id in self.orphan_buffer_by_session:
            candidate_ids.update(self.orphan_buffer_by_session[session_id])

        if not candidate_ids:
            return 0, 0

        bound_count = 0
        retractions_count = 0

        for orphan_id in candidate_ids:
            # Find the active attribution record for this orphan
            active_attr = None
            for attr in self.attributions:
                if attr.event_id == orphan_id and attr.superseded_at is None:
                    active_attr = attr
                    break

            if active_attr and active_attr.identity_state == "orphan":
                # 1. Close the current orphan version in system time
                active_attr.superseded_at = binding_time

                # 2. Insert new resolved version for this customer
                new_attr = AttributionRecord(
                    attribution_id=self._next_attribution_id,
                    event_id=orphan_id,
                    customer_id=customer_id,
                    identity_state="resolved",
                    confidence=0.98,
                    method="binding",
                    evidence={
                        "rule": "device_fingerprint_retroactive_claim",
                        "matched_device_id": device_id,
                        "binding_event_time": binding_time,
                    },
                    learned_at=binding_time,
                    superseded_at=None,
                )
                self._next_attribution_id += 1
                self.attributions.append(new_attr)

                # 3. Emit retraction pair: (-) orphan, (+) customer_id
                retraction = RetractionPair(
                    retraction_id=self._next_retraction_id,
                    event_id=orphan_id,
                    old_state={"identity_state": "orphan", "customer_id": None},
                    new_state={"identity_state": "resolved", "customer_id": customer_id},
                    system_time=binding_time,
                    reason=f"Retroactive claim by customer {customer_id} on device {device_id}",
                )
                self._next_retraction_id += 1
                self.retractions.append(retraction)

                bound_count += 1
                retractions_count += 1

        # Clear claimed orphans from buffer
        if device_id in self.orphan_buffer_by_device:
            self.orphan_buffer_by_device[device_id] = [
                eid for eid in self.orphan_buffer_by_device[device_id] if eid not in candidate_ids
            ]
        if session_id in self.orphan_buffer_by_session:
            self.orphan_buffer_by_session[session_id] = [
                eid for eid in self.orphan_buffer_by_session[session_id] if eid not in candidate_ids
            ]

        return bound_count, retractions_count

    def get_journey(self, customer_id: str, as_of_time: Optional[str] = None) -> JourneyResponse:
        """
        Retrieves the stitched customer journey.
        If as_of_time is provided, reconstructs what the system believed as of that moment.
        """
        stitched_events = []
        threads = set()

        for attr in self.attributions:
            if attr.customer_id != customer_id:
                continue

            # Bitemporal AS-OF condition:
            # fact was learned on or before as_of_time, and either not superseded or superseded AFTER as_of_time
            if as_of_time:
                if attr.learned_at > as_of_time:
                    continue
                if attr.superseded_at and attr.superseded_at <= as_of_time:
                    continue
            else:
                # Current view: only active versions
                if attr.superseded_at is not None:
                    continue

            raw_event = self.events.get(attr.event_id)
            if not raw_event:
                continue

            event_summary = {
                "event_id": raw_event.event_id,
                "event_type": raw_event.event_type,
                "channel": raw_event.source.channel,
                "valid_time": raw_event.valid_time,
                "ingest_time": raw_event.ingest_time,
                "learned_at": attr.learned_at,
                "identity_state": attr.identity_state,
                "attribution_method": attr.method,
                "confidence": attr.confidence,
                "evidence": attr.evidence,
                "thread_hint": raw_event.journey.thread_hint if raw_event.journey else None,
                "case_id": raw_event.journey.case_id if raw_event.journey else None,
                "payload": raw_event.payload,
            }

            if raw_event.journey and raw_event.journey.thread_hint:
                threads.add(raw_event.journey.thread_hint)

            stitched_events.append(event_summary)

        # Sort by valid_time (when they happened in the world)
        stitched_events.sort(key=lambda x: x["valid_time"])

        return JourneyResponse(
            customer_id=customer_id,
            as_of=as_of_time,
            total_events=len(stitched_events),
            events=stitched_events,
            active_threads=list(threads),
        )

    def compute_knowledge_gap(self, customer_id: str, contact_time: str) -> KnowledgeGapResponse:
        """
        Calculates the novel Wager metric:
        knowledge_gap = |events known now| - |events known as-of contact_time|
        """
        current_journey = self.get_journey(customer_id)
        as_of_journey = self.get_journey(customer_id, as_of_time=contact_time)

        current_event_ids = {e["event_id"] for e in current_journey.events}
        as_of_event_ids = {e["event_id"] for e in as_of_journey.events}

        missing_ids = current_event_ids - as_of_event_ids
        invisible_events = [e for e in current_journey.events if e["event_id"] in missing_ids]

        return KnowledgeGapResponse(
            customer_id=customer_id,
            contact_time=contact_time,
            current_known_count=len(current_journey.events),
            known_at_contact_count=len(as_of_journey.events),
            knowledge_gap=len(invisible_events),
            invisible_events=invisible_events,
        )


# Singleton store instance
store = BitemporalStore()
