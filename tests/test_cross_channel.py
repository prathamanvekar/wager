import unittest
import tempfile
from pathlib import Path
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from services.api import main
from services.api.store import BitemporalStore

class TestCrossChannel(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.original=main.store
        self.path=str(Path(self.tmp.name)/'test.sqlite3')
        main.store=BitemporalStore(self.path,server_clock=True)
        self.client=TestClient(main.app)
        self.web=self.session('web','browser-device')
        self.mobile=self.session('mobile','phone-device')
    def tearDown(self):
        main.store.db.close();main.store=self.original;self.tmp.cleanup()
    def session(self,channel,device):
        import uuid
        r=self.client.post('/api/v1/sessions',json={'channel':channel,'device_id':device,'session_id':'ses_'+uuid.uuid4().hex})
        self.assertEqual(r.status_code,200,r.text)
        return r.json()
    def headers(self,s):return {'Authorization':'Bearer '+s['access_token']}
    def login(self,s,customer='C1041'):
        r=self.client.post('/api/v1/sessions/login',json={'customer_id':customer},headers=self.headers(s))
        self.assertEqual(r.status_code,200,r.text);s['session']=r.json()['session']
    def event(self,s,event_id='evt_dispute',kind='support.dispute.created',payload=None):
        session=main.store.get_session(s['access_token'])
        e=main.store.make_event(session,kind,payload or {'case_id':'case_test','transaction_id':'txn_test','merchant':'CloudScale','amount':142.5,'customer_notes':'This charge is unfamiliar.'},case_id='case_test',thread='billing_dispute').model_dump()
        e['event_id']=event_id
        return e
    def post(self,s,e):return self.client.post('/api/v1/events',json=e,headers=self.headers(s))
    def cases(self,s):return self.client.get('/api/v1/cases',headers=self.headers(s)).json()
    def handoff(self):return self.client.post('/api/v1/handoffs',headers=self.headers(self.web)).json()['code']
    def claim(self,code,s=None):return self.client.post('/api/v1/handoffs/redeem',json={'code':code},headers=self.headers(s or self.mobile))
    def test_web_to_mobile_case_message_and_restart(self):
        raw=self.event(self.web)
        self.assertEqual(self.post(self.web,raw).status_code,200)
        self.login(self.mobile)
        self.assertEqual(self.cases(self.mobile),[]) # distinct device cannot silently claim
        code=self.handoff();before=datetime.now(timezone.utc).isoformat()
        claim=self.claim(code);self.assertEqual(claim.status_code,200,claim.text)
        self.assertEqual(claim.json()['bound_events'],1)
        self.assertEqual(self.cases(self.mobile)[0]['associatedCustomerId'],'C1041')
        message=self.event(self.mobile,'evt_mobile_message','mobile.case.message_sent',{'case_id':'case_test','content':'Following up from my phone.'})
        self.assertEqual(self.post(self.mobile,message).status_code,200)
        case=self.cases(self.web)[0]
        self.assertEqual(case['messages'][-1]['channel'],'mobile')
        self.assertEqual(case['messages'][-1]['content'],'Following up from my phone.')
        self.assertEqual(main.store.events['evt_dispute'].subject.identity_state,'orphan')
        self.assertEqual(main.store.get_journey('C1041',before).total_events,1) # login only, before handoff
        main.store.db.close();main.store=BitemporalStore(self.path,server_clock=True)
        self.assertEqual(self.cases(self.mobile)[0]['messages'][-1]['content'],'Following up from my phone.')
        self.assertEqual(len(main.store.retractions),1)
    def test_idempotent_retry_and_conflicting_content(self):
        e=self.event(self.web)
        self.post(self.web,e)
        received=main.store.events[e['event_id']].ingest_time
        e['ingest_time']='2099-01-01T00:00:00Z'
        self.assertEqual(self.post(self.web,e).status_code,200)
        self.assertEqual(len(main.store.attributions),1)
        self.assertEqual(main.store.events[e['event_id']].ingest_time,received)
        e['payload']['amount']=999
        self.assertEqual(self.post(self.web,e).status_code,409)
        self.assertEqual(main.store.events[e['event_id']].payload['amount'],142.5)
    def test_server_controls_ingest_clock(self):
        e=self.event(self.web);e['ingest_time']='2099-01-01T00:00:00Z';e['valid_time']='2020-01-01T00:00:00Z'
        self.post(self.web,e)
        stored=main.store.events[e['event_id']]
        self.assertTrue(stored.ingest_time.startswith(str(datetime.now(timezone.utc).year)))
        self.assertTrue(stored.valid_time.startswith('2020'))
    def test_handoff_expiry_replay_and_replacement(self):
        self.post(self.web,self.event(self.web));self.login(self.mobile)
        old=self.handoff();new=self.handoff()
        self.assertEqual(self.claim(old).status_code,409)
        self.assertEqual(self.claim(new).status_code,200)
        self.assertEqual(self.claim(new).status_code,409)
        self.assertEqual(len(main.store.retractions),1)
        expired=self.handoff()
        for h in main.store.handoffs.values():h['expires_at']=(datetime.now(timezone.utc)-timedelta(seconds=1)).isoformat()
        self.assertEqual(self.claim(expired).status_code,409)
    def test_unauthenticated_claim_and_other_customer_access(self):
        self.post(self.web,self.event(self.web));code=self.handoff()
        self.assertEqual(self.claim(code).status_code,403)
        self.login(self.mobile);self.assertEqual(self.claim(code).status_code,200)
        other=self.session('mobile','other-device');self.login(other,'C2094')
        self.assertEqual(self.cases(other),[])
        r=self.client.get('/api/v1/cases/case_test',headers=self.headers(other));self.assertEqual(r.status_code,404)
        e=self.event(other,'evt_intruder','mobile.case.message_sent',{'case_id':'case_test','content':'Not my case'})
        self.assertEqual(self.post(other,e).status_code,403)
        self.assertNotIn('evt_intruder',main.store.events)
    def test_source_browser_cannot_relabel_a_claimed_case_as_another_customer(self):
        self.post(self.web,self.event(self.web));self.login(self.mobile)
        self.assertEqual(self.claim(self.handoff()).status_code,200)
        self.login(self.web,'C2094')
        self.assertEqual(self.cases(self.web),[])
        self.assertEqual(main.store.active_attribution('evt_dispute').customer_id,'C1041')

    def test_invalid_payload_does_not_poison_shared_projections(self):
        event=self.event(self.web)
        event['payload']['amount']='not-a-number'
        self.assertEqual(self.post(self.web,event).status_code,409)
        self.assertEqual(len(main.store.events),0)
        event=self.event(self.web);event['valid_time']='2026-01-01T10:00:00'
        self.assertEqual(self.post(self.web,event).status_code,422)
        self.assertEqual(len(main.store.events),0)

    def test_shared_device_does_not_claim_previous_session(self):
        self.post(self.web,self.event(self.web))
        other=self.session('web','browser-device');self.login(other,'C2094')
        self.assertEqual(self.cases(other),[])
        self.assertEqual(main.store.active_attribution('evt_dispute').identity_state,'orphan')
    def test_client_cannot_forge_identity_or_channel(self):
        e=self.event(self.web);e['subject']['customer_id']='C1041';e['identifiers']['customer_id']='C1041'
        self.assertEqual(self.post(self.web,e).status_code,403)
        e=self.event(self.web);e['source']['channel']='mobile'
        self.assertEqual(self.post(self.web,e).status_code,403)
        self.assertEqual(len(main.store.events),0)
    def test_sign_in_binds_current_session_immediately(self):
        self.post(self.web,self.event(self.web));self.login(self.web)
        self.assertEqual(main.store.active_attribution('evt_dispute').identity_state,'resolved')
        self.assertEqual(self.cases(self.web)[0]['associatedCustomerId'],'C1041')
        logout=self.client.post('/api/v1/sessions/logout',headers=self.headers(self.web))
        self.assertEqual(logout.status_code,200)
        self.assertEqual(self.client.get('/api/v1/cases',headers=self.headers(self.web)).status_code,401)

if __name__=='__main__':unittest.main()
