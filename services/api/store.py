"""Durable CJEP event log, versioned attribution and demo session boundaries.

SQLite is the zero-service local adapter. Cases are projections of canonical
 events, never a second source of truth. Pass no path for isolated unit tests.
"""
from __future__ import annotations
import hashlib
import json
import os
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from .protocol import AttributionRecord, EventEnvelope, EventIngestResponse, JourneyResponse, KnowledgeGapResponse, RetractionPair


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


CUSTOMERS = [
    dict(id="C1041", fullName="Alex Mercer", email="alex.mercer@apex.bank", phoneSuffix="8821", tier="Premier", accountNumber="APEX-8821-4902", linkedDevicesCount=2),
    dict(id="C2094", fullName="Priya Sharma", email="priya.sharma@apex.bank", phoneSuffix="4410", tier="Standard", accountNumber="APEX-4410-1092", linkedDevicesCount=1),
    dict(id="C3819", fullName="David Vance", email="david.vance@apex.bank", phoneSuffix="9920", tier="Private Client", accountNumber="APEX-9920-8801", linkedDevicesCount=3),
]


class BitemporalStore:
    def __init__(self, db_path: Optional[str] = None, server_clock: bool = False):
        self.lock = threading.RLock()
        self.server_clock = server_clock
        if db_path and db_path != ':memory:':
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(db_path or ':memory:', check_same_thread=False)
        self.db.execute('PRAGMA journal_mode=WAL')
        for table in ('events', 'attributions', 'retractions', 'sessions', 'handoffs', 'calls'):
            self.db.execute(f'CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, data TEXT NOT NULL)')
        self.db.commit()
        self._load()

    def _load(self):
        def rows(table):
            return [json.loads(row[0]) for row in self.db.execute(f'SELECT data FROM {table} ORDER BY rowid')]
        self.events = {e['event_id']: EventEnvelope.model_validate(e) for e in rows('events')}
        self.attributions = [AttributionRecord.model_validate(a) for a in rows('attributions')]
        self.retractions = [RetractionPair.model_validate(r) for r in rows('retractions')]
        self.sessions = {r['key']: r for r in rows('sessions')}
        self.handoffs = {r['key']: r for r in rows('handoffs')}
        self.calls = {r['id']: r for r in rows('calls')}
        self._next_attribution_id = max([a.attribution_id for a in self.attributions], default=0) + 1
        self._next_retraction_id = max([r.retraction_id for r in self.retractions], default=0) + 1
        self._rebuild_buffers()

    def _rebuild_buffers(self):
        self.orphan_buffer_by_device = {}
        self.orphan_buffer_by_session = {}
        for a in self.attributions:
            if a.superseded_at is None and a.identity_state == 'orphan':
                e = self.events[a.event_id]
                self.orphan_buffer_by_device.setdefault(e.identifiers.device_id, []).append(e.event_id)
                self.orphan_buffer_by_session.setdefault(e.identifiers.session_id, []).append(e.event_id)

    def _write(self, table, key, data):
        self.db.execute(f'INSERT INTO {table}(id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data', (str(key), json.dumps(data)))

    def _save(self):
        # One SQLite transaction covers event, attribution closures, retractions
        # and handoff consumption. No client can observe a half-completed claim.
        try:
            with self.db:
                for e in self.events.values():
                    self._write('events', e.event_id, e.model_dump())
                for a in self.attributions:
                    self._write('attributions', a.attribution_id, a.model_dump())
                for r in self.retractions:
                    self._write('retractions', r.retraction_id, r.model_dump())
                for table, entries in [('sessions', self.sessions), ('handoffs', self.handoffs), ('calls', self.calls)]:
                    for key, value in entries.items():
                        self._write(table, key, value)
        except Exception:
            self._load()
            raise

    def active_attribution(self, event_id):
        return next((a for a in reversed(self.attributions) if a.event_id == event_id and a.superseded_at is None), None)

    def _bind(self, event_ids, customer_id, binding_time, evidence):
        bound = 0
        for eid in event_ids:
            old = self.active_attribution(eid)
            if not old or old.identity_state != 'orphan':
                continue
            old.superseded_at = binding_time
            self.attributions.append(AttributionRecord(attribution_id=self._next_attribution_id, event_id=eid, customer_id=customer_id, identity_state='resolved', confidence=1.0, method='binding', evidence=evidence, learned_at=binding_time))
            self._next_attribution_id += 1
            self.retractions.append(RetractionPair(retraction_id=self._next_retraction_id, event_id=eid, old_state={'identity_state':'orphan','customer_id':None}, new_state={'identity_state':'resolved','customer_id':customer_id}, system_time=binding_time, reason=evidence['rule']))
            self._next_retraction_id += 1
            bound += 1
        self._rebuild_buffers()
        return bound

    def ingest_event(self, envelope: EventEnvelope, *, persist=True) -> EventIngestResponse:
        with self.lock:
            existing = self.events.get(envelope.event_id)
            if existing:
                # Receipt-time is authoritative; retries must compare producer content.
                before = existing.model_dump(exclude={'ingest_time'})
                after = envelope.model_dump(exclude={'ingest_time'})
                if before != after:
                    raise ValueError('Event ID already exists with different content')
                a = self.active_attribution(envelope.event_id)
                return EventIngestResponse(status='accepted', event_id=existing.event_id, valid_time=existing.valid_time, ingest_time=existing.ingest_time, assigned_customer_id=a.customer_id, identity_state=a.identity_state, attribution_id=a.attribution_id, message='Duplicate delivery acknowledged; no new records created.')
            learned = utc_now() if self.server_clock else envelope.ingest_time
            envelope = envelope.model_copy(deep=True, update={'ingest_time':learned})
            self.events[envelope.event_id] = envelope
            customer = envelope.identifiers.customer_id or envelope.subject.customer_id
            state = 'resolved' if customer else 'orphan'
            a = AttributionRecord(attribution_id=self._next_attribution_id, event_id=envelope.event_id, customer_id=customer, identity_state=state, confidence=1.0 if customer else 0.0, method='deterministic', evidence={'strong_identifier':'customer_id'} if customer else {'weak_signals':['device_id','session_id']}, learned_at=learned)
            self._next_attribution_id += 1
            self.attributions.append(a)
            bound = 0
            if customer:
                # Claim this session only: another person's earlier session on a
                # shared device must never be claimed merely by device equality.
                candidates = self.orphan_buffer_by_session.get(envelope.identifiers.session_id, [])
                bound = self._bind(candidates, customer, learned, {'rule':'authenticated_session_claim','session_id':envelope.identifiers.session_id})
            self._rebuild_buffers()
            if persist:
                self._save()
            return EventIngestResponse(status='accepted' if customer else 'buffered_orphan', event_id=envelope.event_id, valid_time=envelope.valid_time, ingest_time=learned, assigned_customer_id=customer, identity_state=state, attribution_id=a.attribution_id, bound_orphans_count=bound, retractions_emitted=bound, message='Event stored with versioned attribution.')

    def create_session(self, device_id, session_id, channel):
        with self.lock:
            # A server-issued bearer is the session capability; knowing a device
            # token does not let a new caller reopen or claim another session.
            token = secrets.token_urlsafe(32)
            key = digest(token)
            self.sessions[key] = dict(key=key, device_id=device_id, session_id=session_id, channel=channel, customer_id=None, expires_at=(datetime.now(timezone.utc)+timedelta(days=7)).isoformat())
            self._save()
            return token, self.sessions[key]

    def get_session(self, token):
        session = self.sessions.get(digest(token or ''))
        if not session or session['expires_at'] <= utc_now():
            raise PermissionError('Session expired. Please reconnect and sign in again.')
        return session

    def login(self, token, customer_id):
        with self.lock:
            s = self.get_session(token)
            if not any(c['id'] == customer_id for c in CUSTOMERS):
                raise ValueError('Unknown demo customer')
            if s['customer_id'] and s['customer_id'] != customer_id:
                raise ValueError('Sign out before switching customers')
            s['customer_id'] = customer_id
            event = self.make_event(s, f"{s['channel']}.login.completed", {'customer_id':customer_id,'auth_method':'demo_persona'}, thread='customer_authentication')
            result = self.ingest_event(event)
            return s, result

    def make_event(self, session, event_type, payload, case_id=None, thread=None):
        now = utc_now()
        return EventEnvelope.model_validate(dict(event_id='evt_'+secrets.token_hex(12), event_type=event_type, source=dict(channel=session['channel'],application='customer-'+session['channel'],instance_id=session['session_id']), valid_time=now,ingest_time=now,identifiers=dict(session_id=session['session_id'],device_id=session['device_id'],ip_hash='local_demo',customer_id=session['customer_id']),subject=dict(customer_id=session['customer_id'],identity_state='resolved' if session['customer_id'] else 'orphan'),journey=dict(case_id=case_id,thread_hint=thread),payload=payload))

    def visible(self, event, session):
        a = self.active_attribution(event.event_id)
        if session['customer_id']:
            return bool(a and (a.customer_id == session['customer_id'] or (a.customer_id is None and event.identifiers.session_id == session['session_id'])))
        return event.identifiers.session_id == session['session_id']

    def create_handoff(self, session):
        with self.lock:
            if session['channel'] != 'web' or session['customer_id']:
                raise ValueError('Create a handoff from an anonymous web session')
            # Invalidate older unredeemed links from the same session.
            for h in self.handoffs.values():
                if h['session_id'] == session['session_id']:
                    h['used'] = True
            code = secrets.token_hex(8).upper()
            key = digest(code)
            h = dict(key=key, session_id=session['session_id'], device_id=session['device_id'], expires_at=(datetime.now(timezone.utc)+timedelta(minutes=5)).isoformat(),used=False)
            self.handoffs[key] = h
            self._save()
            return dict(code=code,expires_at=h['expires_at'],uri='wager://handoff?code='+code)

    def redeem_handoff(self, session, code):
        with self.lock:
            if not session['customer_id']:
                raise PermissionError('Sign in before linking a web session')
            h = self.handoffs.get(digest(code.replace('-','').replace(' ','').upper()))
            if not h or h['used'] or h['expires_at'] <= utc_now():
                raise ValueError('This handoff is expired or already used. Generate a new code on the web portal.')
            h['used'] = True
            now = utc_now()
            count = self._bind(list(self.orphan_buffer_by_session.get(h['session_id'],[])),session['customer_id'],now,{'rule':'explicit_cross_channel_handoff','source_session':h['session_id'],'target_session':session['session_id']})
            self.ingest_event(self.make_event(session, 'identity.handoff.claimed', {'source_session_id':h['session_id'],'claimed_events':count},thread='customer_authentication'),persist=False)
            self._save()
            return dict(bound_events=count,customer_id=session['customer_id'],message='Your web conversation is now connected to this account.')

    def get_cases(self, session):
        result = []
        for event in self.events.values():
            p = event.payload
            if event.event_type not in ('support.dispute.created','support.inquiry.created') or not self.visible(event,session):
                continue
            cid = p.get('case_id')
            if not cid:
                continue
            a = self.active_attribution(event.event_id)
            thread = (event.journey.thread_hint if event.journey else None) or p.get('thread_hint','billing_dispute')
            intent = p.get('intent_type','billing_dispute')
            titles = {'credit_limit':'Credit limit request','card_replacement':'Card replacement','general':'General assistance'}
            notes = p.get('customer_notes',p.get('description',''))
            c = dict(id=cid,transactionId=p.get('transaction_id',''),merchant=p.get('merchant',titles.get(intent,'Support inquiry')),amount=p.get('amount',p.get('requested_limit',0)) or 0,currency=p.get('currency','USD'),reason=p.get('dispute_reason',titles.get(intent,'Support inquiry')),customerNotes=notes,attachments=p.get('attachments',[]),status='submitted' if thread=='billing_dispute' else 'under_review',createdAt=event.valid_time,threadHint=thread,anonymousOrigin=event.subject.customer_id is None,associatedCustomerId=a.customer_id,originatingDeviceId=event.identifiers.device_id,originatingSessionId=event.identifiers.session_id,timeline=[],messages=[])
            for e in self.events.values():
                if e.payload.get('case_id') != cid or e.event_type not in ('support.dispute.created','support.inquiry.created','support.case.message_sent','mobile.case.message_sent','call.case.selected','call.status.presented','call.followup.requested','call.ended'):
                    continue
                text = e.payload.get('content', e.payload.get('customer_notes',e.payload.get('description','')))
                call_titles = {'call.case.selected':'Call context retrieved','call.status.presented':'Status heard on call','call.followup.requested':'Follow-up requested on call','call.ended':'Call ended'}
                title = 'Case opened' if e.event_id == event.event_id else call_titles.get(e.event_type,'Message sent')
                c['timeline'].append(dict(id=e.event_id,timestamp=e.valid_time,title=title,description=text,channel=e.source.channel,identityStateAtEmission=e.subject.identity_state,eventType=e.event_type,actor='system' if e.event_type in ('call.case.selected','call.status.presented','call.ended') else 'customer'))
                if text and (not e.event_type.startswith('call.') or e.event_type=='call.followup.requested'):
                    name=next((c['fullName'] for c in CUSTOMERS if c['id']==e.subject.customer_id),'Anonymous visitor')
                    c['messages'].append(dict(id=e.event_id,timestamp=e.valid_time,sender='customer',senderName=name,content=text,attachments=e.payload.get('attachments',[]),identityStateAtEmission=e.subject.identity_state,channel=e.source.channel))
            for revision in self.retractions:
                if revision.event_id == event.event_id:
                    c['timeline'].append(dict(id='binding_'+str(revision.retraction_id),timestamp=revision.system_time,title='Identity connected',description='Earlier history linked without overwriting the original event.',channel='mobile' if 'handoff' in revision.reason else event.source.channel,identityStateAtEmission='resolved',eventType='identity.bound',actor='system'))
            c['timeline'].sort(key=lambda t:t['timestamp'])
            result.append(c)
        return sorted(result,key=lambda c:c['createdAt'],reverse=True)

    def get_transactions(self, session):
        fixture = Path(__file__).resolve().parents[2] / 'packages' / 'contracts' / 'fixtures' / 'transactions.json'
        transactions = json.loads(fixture.read_text(encoding='utf-8'))
        for event in self.events.values():
            if event.event_type == 'payment.authorized' and self.visible(event, session):
                p = event.payload
                transactions.insert(0, dict(id=p['transaction_id'],date=p.get('date',event.valid_time),merchant=p['merchant'],category=p.get('category','Other'),amount=p['amount'],currency=p.get('currency','USD'),location=p.get('location',''),canDispute=p.get('status')!='cleared',status=p.get('status','unrecognized'),channel=p.get('channel',event.source.channel),cycle=p.get('cycle','current')))
        cases = {c['transactionId']:c for c in self.get_cases(session)}
        for transaction in transactions:
            if transaction['id'] in cases:
                transaction.update(status='under_review',canDispute=False,disputeId=cases[transaction['id']]['id'])
        return transactions

    def get_journey(self, customer_id, as_of_time=None):
        if as_of_time:
            as_of_time = datetime.fromisoformat(as_of_time.replace('Z','+00:00')).astimezone(timezone.utc).isoformat()
        events=[]
        for a in self.attributions:
            if a.customer_id != customer_id or (as_of_time and (a.learned_at > as_of_time or (a.superseded_at and a.superseded_at <= as_of_time))) or (not as_of_time and a.superseded_at):
                continue
            e=self.events[a.event_id]
            events.append(dict(event_id=e.event_id,event_type=e.event_type,channel=e.source.channel,valid_time=e.valid_time,ingest_time=e.ingest_time,learned_at=a.learned_at,identity_state=a.identity_state,attribution_method=a.method,confidence=a.confidence,evidence=a.evidence,thread_hint=e.journey.thread_hint if e.journey else None,case_id=e.journey.case_id if e.journey else None,payload=e.payload))
        events.sort(key=lambda e:e['valid_time'])
        return JourneyResponse(customer_id=customer_id,as_of=as_of_time,total_events=len(events),events=events,active_threads=sorted({e['thread_hint'] for e in events if e['thread_hint']}))

    def compute_knowledge_gap(self,customer_id,contact_time):
        current=self.get_journey(customer_id)
        historical=self.get_journey(customer_id,contact_time)
        known={e['event_id'] for e in historical.events}
        invisible=[e for e in current.events if e['event_id'] not in known]
        return KnowledgeGapResponse(customer_id=customer_id,contact_time=contact_time,current_known_count=len(current.events),known_at_contact_count=len(historical.events),knowledge_gap=len(invisible),invisible_events=invisible)


store = BitemporalStore(os.environ.get('WAGER_DB_PATH', str(Path(__file__).resolve().parents[2] / '.data' / 'wager.sqlite3')), server_clock=True)
