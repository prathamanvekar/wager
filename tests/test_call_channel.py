import json
import tempfile
import unittest
import uuid
from pathlib import Path
from fastapi.testclient import TestClient
from services.api import main
from services.api.store import BitemporalStore

class TestCallChannel(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = str(Path(self.tmp.name) / 'calls.sqlite3')
        self.original = main.store
        main.store = BitemporalStore(self.path, server_clock=True)
        self.http = TestClient(main.app)
        self.web = self.session('web')
        self.mobile = self.session('mobile')
        self.caller = self.session('call')

    def tearDown(self):
        main.store.db.close()
        main.store = self.original
        self.tmp.cleanup()

    def session(self, channel):
        return self.http.post('/api/v1/sessions', json={'channel':channel, 'device_id':'device_'+uuid.uuid4().hex, 'session_id':'session_'+uuid.uuid4().hex}).json()

    def headers(self, session):
        return {'Authorization':'Bearer '+session['access_token']}

    def start(self, caller=None, call_id='call_test_001'):
        return self.http.post('/api/v1/calls', json={'call_id':call_id}, headers=self.headers(caller or self.caller))

    def action(self, action, caller=None, call_id='call_test_001', action_id=None, **payload):
        return self.http.post(f'/api/v1/calls/{call_id}/{action}', json={'action_id':action_id or 'action_'+uuid.uuid4().hex, **payload}, headers=self.headers(caller or self.caller))

    def verify(self, caller=None, number='1041', pin='1234', **kwargs):
        return self.action('verify', caller, customer_number=number, pin=pin, **kwargs)

    def create_case(self, session, cid='case_shared', intent=None):
        s = main.store.get_session(session['access_token'])
        payload = {'case_id':cid, 'merchant':'CloudScale', 'amount':142.5, 'transaction_id':'txn_shared', 'customer_notes':'Unfamiliar charge from the web portal.'}
        if intent: payload.update(intent_type=intent, description='Please review my support request.')
        event = main.store.make_event(s, 'support.inquiry.created' if intent else 'support.dispute.created', payload, case_id=cid, thread='general_support' if intent else 'billing_dispute')
        result = self.http.post('/api/v1/events', json=event.model_dump(), headers=self.headers(session))
        self.assertEqual(result.status_code, 200, result.text)
        return event.event_id

    def login(self, session, customer='C1041'):
        result = self.http.post('/api/v1/sessions/login', json={'customer_id':customer}, headers=self.headers(session))
        self.assertEqual(result.status_code, 200, result.text)

    def get_cases(self, session):
        return self.http.get('/api/v1/cases', headers=self.headers(session)).json()

    def test_three_channels_share_actual_inquiry_and_persist_call(self):
        original_event = self.create_case(self.web)
        self.login(self.mobile)
        code = self.http.post('/api/v1/handoffs', headers=self.headers(self.web)).json()['code']
        self.http.post('/api/v1/handoffs/redeem', json={'code':code}, headers=self.headers(self.mobile))
        started = self.start()
        self.assertEqual(started.status_code, 200, started.text)
        self.assertEqual(started.json()['cases'], [])
        verified = self.verify()
        self.assertEqual(verified.status_code, 200, verified.text)
        self.assertEqual(verified.json()['customer']['id'], 'C1041')
        self.assertEqual(len(verified.json()['cases']), 1) # No handoff needed for a verified caller.
        selected = self.action('select', case_id='case_shared')
        self.assertEqual(selected.status_code, 200, selected.text)
        status = self.action('status')
        self.assertIn('submitted', status.json()['prompt'])
        followup = self.action('follow-up', action_id='followup_once_001')
        self.assertEqual(followup.status_code, 200, followup.text)
        self.assertEqual(self.action('follow-up', action_id='followup_once_001').status_code, 200)
        self.assertEqual(self.action('follow-up').status_code, 409)
        ended = self.action('end', action_id='end_once_001')
        self.assertEqual(ended.json()['state'], 'ended')
        self.assertEqual(self.action('end', action_id='end_once_001').status_code, 200)
        for channel in [self.web, self.mobile]:
            cases = self.get_cases(channel)
            self.assertEqual(len(cases), 1)
            self.assertEqual(cases[0]['messages'][-1]['channel'], 'call')
            self.assertEqual(sum(m['channel']=='call' for m in cases[0]['messages']), 1)
            self.assertIn('call.status.presented', [e['eventType'] for e in cases[0]['timeline']])
        self.assertEqual(main.store.events[original_event].subject.identity_state, 'orphan')
        main.store.db.close()
        main.store = BitemporalStore(self.path, server_clock=True)
        restored = self.http.get('/api/v1/calls/call_test_001', headers=self.headers(self.caller))
        self.assertEqual(restored.json()['state'], 'ended')
        self.assertEqual(restored.json()['followups'], ['case_shared'])
        self.assertNotIn('"pin"', json.dumps(main.store.calls))
        self.assertNotIn('"pin"', json.dumps([e.model_dump() for e in main.store.events.values()]))

    def test_caller_cannot_claim_unrelated_anonymous_web_history(self):
        self.create_case(self.web)
        self.start()
        self.assertEqual(self.verify().json()['cases'], [])
        self.assertEqual(self.action('select', case_id='case_shared').status_code, 403)
        self.assertIsNone(self.get_cases(self.web)[0]['associatedCustomerId'])

    def test_other_customer_and_other_call_are_isolated(self):
        self.login(self.web)
        self.create_case(self.web)
        self.start()
        self.assertEqual(self.verify(number='2094').json()['cases'], [])
        self.assertEqual(self.action('select', case_id='case_shared').status_code, 403)
        another = self.session('call')
        self.assertEqual(self.http.get('/api/v1/calls/call_test_001', headers=self.headers(another)).status_code, 403)
        self.assertEqual(self.start(another).status_code, 403)
        self.assertEqual(self.action('end', another).status_code, 403)

    def test_pin_attempts_are_bounded_and_retry_does_not_double_count(self):
        self.start()
        self.assertEqual(self.verify(pin='9999', action_id='bad_attempt_001').status_code, 403)
        self.assertEqual(self.verify(pin='9999', action_id='bad_attempt_001').status_code, 403)
        self.assertEqual(main.store.calls['call_test_001']['attempts'], 1)
        self.assertEqual(self.verify(pin='wrong').status_code, 403)
        self.assertEqual(self.verify(pin='9999').status_code, 403)
        self.assertEqual(main.store.calls['call_test_001']['state'], 'ended')
        self.assertEqual(self.verify().status_code, 409)

    def test_identity_cannot_be_forged_through_generic_routes(self):
        self.start()
        response = self.http.post('/api/v1/sessions/login', json={'customer_id':'C1041'}, headers=self.headers(self.caller))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(main.store.get_session(self.caller['access_token'])['customer_id'], None)
        session = main.store.get_session(self.caller['access_token'])
        forged = main.store.make_event(session, 'call.identity.verified', {'customer_id':'C1041'})
        self.assertEqual(self.http.post('/api/v1/events', json=forged.model_dump(), headers=self.headers(self.caller)).status_code, 403)
        self.assertEqual(self.start(self.web, 'call_web_forbidden').status_code, 403)

    def test_state_and_idempotency_preconditions(self):
        self.start()
        self.assertEqual(self.start().status_code, 200)
        self.assertEqual(self.action('status').status_code, 409)
        self.assertEqual(self.action('select', case_id='unknown').status_code, 403)
        self.assertEqual(self.action('end').json()['state'], 'ended')
        self.assertEqual(self.action('status').status_code, 409)
        self.assertEqual(self.start(call_id='call_next_001').status_code, 200)

    def test_multi_intent_cases_remain_separate(self):
        self.login(self.web)
        self.create_case(self.web)
        self.create_case(self.web, 'case_general', intent='general')
        self.start(); self.verify()
        self.action('select', case_id='case_shared')
        self.action('follow-up', action_id='followup_shared')
        self.action('menu')
        self.action('select', case_id='case_general')
        self.action('status')
        cases = {c['id']:c for c in self.get_cases(self.web)}
        self.assertEqual(cases['case_shared']['status'], 'submitted')
        self.assertEqual(cases['case_general']['status'], 'under_review')
        self.assertEqual(sum(m['channel']=='call' for m in cases['case_shared']['messages']),1)
        self.assertEqual(sum(m['channel']=='call' for m in cases['case_general']['messages']),0)
        conflict = self.action('select', case_id='case_general', action_id='followup_shared')
        self.assertEqual(conflict.status_code,409)

    def test_call_can_end_before_verification_without_exposing_cases(self):
        self.start()
        result = self.action('end')
        self.assertEqual(result.status_code,200)
        self.assertEqual(result.json()['cases'],[])
        self.assertIsNone(result.json()['customer'])
        self.assertEqual(self.http.get('/api/v1/calls/call_test_001').status_code,401)
