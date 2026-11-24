"""Shared local API for web and mobile; persona sign-in is explicitly demo-only."""
from datetime import datetime, timezone
from typing import Literal, Optional
import asyncio
import json
import math
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from .protocol import EventEnvelope
from .store import CUSTOMERS, store, utc_now

app = FastAPI(title='Wager Cross-Channel API',version='2.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'],allow_methods=['*'],allow_headers=['*'])

class SessionInput(BaseModel):
    device_id: str = Field(min_length=8,max_length=128)
    session_id: str = Field(min_length=8,max_length=128)
    channel: Literal['web','mobile','call','branch']

class LoginInput(BaseModel):
    customer_id: str

class ClaimInput(BaseModel):
    code: str = Field(min_length=8,max_length=128)


def current_session(authorization: Optional[str] = Header(None)):
    try:
        if not authorization or not authorization.startswith('Bearer '):
            raise PermissionError('Connect a session first')
        return store.get_session(authorization[7:])
    except PermissionError as e:
        raise HTTPException(401,str(e))


def fail(error):
    raise HTTPException(403 if isinstance(error,PermissionError) else 409,str(error))

@app.get('/api/v1/health')
def health():
    return dict(status='healthy',service='wager-api',timestamp=utc_now(),total_events=len(store.events),total_attributions=len(store.attributions),buffered_orphans=sum(len(v) for v in store.orphan_buffer_by_session.values()),retractions_emitted=len(store.retractions),storage='sqlite',authentication='demo_persona')

@app.get('/api/v1/customers')
def customers():
    return CUSTOMERS

@app.post('/api/v1/sessions')
def create_session(body: SessionInput):
    with store.lock:
        if any(s['session_id']==body.session_id for s in store.sessions.values()):
            raise HTTPException(409,'This session already exists. Restore its token or start a new session.')
        token,s=store.create_session(body.device_id,body.session_id,body.channel)
        return dict(access_token=token,session=safe_session(s))


def safe_session(s):
    return {k:v for k,v in s.items() if k!='key'}

@app.get('/api/v1/sessions/me')
def me(s=Depends(current_session)):
    return safe_session(s)

@app.post('/api/v1/sessions/login')
def login(body: LoginInput, authorization: str = Header(...), s=Depends(current_session)):
    try:
        if s['channel']=='call':
            raise PermissionError('Use call verification for a call session.')
        session,result=store.login(authorization[7:],body.customer_id)
        return dict(session=safe_session(session),result=result,customer=next(c for c in CUSTOMERS if c['id']==body.customer_id))
    except (ValueError,PermissionError) as e: fail(e)

@app.post('/api/v1/sessions/logout')
def logout(s=Depends(current_session)):
    with store.lock:
        s['expires_at']=utc_now()
        store._save()
    return {'status':'signed_out'}


def ingest(envelope,s):
    if s['channel']=='call' or envelope.event_type.startswith('call.'):
        raise PermissionError('Use the call endpoints for server-authored call events.')
    if envelope.source.channel != s['channel'] or envelope.identifiers.session_id != s['session_id'] or envelope.identifiers.device_id != s['device_id']:
        raise PermissionError('Event source does not match its session')
    if envelope.subject.customer_id != s['customer_id'] or envelope.identifiers.customer_id != s['customer_id']:
        raise PermissionError('Event identity must match the signed-in session')
    if envelope.subject.identity_state != ('resolved' if s['customer_id'] else 'orphan'):
        raise PermissionError('Event identity state does not match its session')
    if envelope.event_type in ('identity.handoff.claimed','web.login.completed','mobile.login.completed'):
        raise PermissionError('Use the shared sign-in or handoff endpoint for identity changes')
    p=envelope.payload
    for field in ('amount','requested_limit','annual_income'):
        value=p.get(field)
        if value is not None and (isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value < 0):
            raise ValueError(f'{field} must be a finite non-negative number')
    if envelope.event_type=='payment.authorized':
        if not isinstance(p.get('transaction_id'),str) or not p['transaction_id'] or not isinstance(p.get('merchant'),str) or not p['merchant'].strip() or not p.get('amount'):
            raise ValueError('A transaction needs an ID, merchant and positive amount')
    if envelope.event_type=='support.inquiry.created' and p.get('intent_type') not in ('credit_limit','general','card_replacement'):
        raise ValueError('Select a supported inquiry type')
    for field in ('content','description','customer_notes'):
        if field in p and (not isinstance(p[field],str) or len(p[field])>10000):
            raise ValueError(f'{field} must contain at most 10000 characters')
    if envelope.event_type in ('support.case.message_sent','mobile.case.message_sent','mobile.case.viewed'):
        if not any(c['id']==p.get('case_id') for c in store.get_cases(s)):
            raise PermissionError('This case is not available to the current session')
        if 'message_sent' in envelope.event_type and (not isinstance(p.get('content'),str) or not p['content'].strip() or len(p['content'])>10000):
            raise ValueError('A message must contain between 1 and 10000 characters')
    if envelope.event_type in ('support.dispute.created','support.inquiry.created'):
        if not isinstance(p.get('case_id'),str) or not p['case_id'].strip() or len(p['case_id'])>128:
            raise ValueError('A case ID is required')
        for previous in store.events.values():
            if previous.payload.get('case_id')==p['case_id'] and previous.event_type in ('support.dispute.created','support.inquiry.created') and previous.event_id!=envelope.event_id:
                raise ValueError('This case already exists')
        if p.get('amount',0) < 0 or p.get('requested_limit',0) < 0:
            raise ValueError('Amount cannot be negative')
    return store.ingest_event(envelope)

@app.post('/api/v1/events')
def ingest_single(envelope: EventEnvelope,s=Depends(current_session)):
    try:
        with store.lock:return ingest(envelope,s)
    except (ValueError,PermissionError) as e:fail(e)

@app.post('/api/v1/events/batch')
def ingest_batch(envelopes: list[EventEnvelope],s=Depends(current_session)):
    if len(envelopes)>100:raise HTTPException(400,'At most 100 events per batch')
    results=[]
    for envelope in envelopes:
        try:
            with store.lock:results.append(ingest(envelope,s))
        except (ValueError,PermissionError) as e:fail(e)
    return results

@app.get('/api/v1/events')
def recent_events(limit:int=Query(200,ge=1,le=1000),s=Depends(current_session)):
    # The web inspector is an explicit demo-wide diagnostics surface. Customer
    # case/journey endpoints below are scoped; raw events retain emission state.
    return list(reversed(list(store.events.values())))[:limit]

@app.get('/api/v1/events/{event_id}')
def event_details(event_id:str,s=Depends(current_session)):
    if event_id not in store.events:raise HTTPException(404,'Event not found')
    versions=[a for a in store.attributions if a.event_id==event_id]
    return dict(envelope=store.events[event_id],attribution_versions=versions,is_orphan=any(a.identity_state=='orphan' and a.superseded_at is None for a in versions))

@app.get('/api/v1/transactions')
def transactions(s=Depends(current_session)):
    with store.lock:return store.get_transactions(s)

@app.get('/api/v1/cases')
def cases(s=Depends(current_session)):
    with store.lock:return store.get_cases(s)

@app.get('/api/v1/cases/{case_id}')
def case_detail(case_id:str,s=Depends(current_session)):
    case=next((c for c in store.get_cases(s) if c['id']==case_id),None)
    if not case:raise HTTPException(404,'Case not found')
    return case

@app.post('/api/v1/handoffs')
def handoff(s=Depends(current_session)):
    try:return store.create_handoff(s)
    except (ValueError,PermissionError) as e:fail(e)

@app.post('/api/v1/handoffs/redeem')
def redeem(body:ClaimInput,s=Depends(current_session)):
    try:return store.redeem_handoff(s,body.code)
    except (ValueError,PermissionError) as e:fail(e)

@app.get('/api/v1/customers/{customer_id}/journey')
def journey(customer_id:str,as_of:Optional[datetime]=None,s=Depends(current_session)):
    if s['customer_id']!=customer_id:raise HTTPException(403,'Sign in to this customer account')
    return store.get_journey(customer_id,as_of.astimezone(timezone.utc).isoformat() if as_of else None)

@app.get('/api/v1/customers/{customer_id}/knowledge-gap')
def gap(customer_id:str,contact_time:datetime,s=Depends(current_session)):
    if s['customer_id']!=customer_id:raise HTTPException(403,'Sign in to this customer account')
    return store.compute_knowledge_gap(customer_id,contact_time.astimezone(timezone.utc).isoformat())

@app.get('/api/v1/retractions')
def retractions(s=Depends(current_session)):
    return store.retractions

@app.get('/api/v1/stream')
async def stream(request:Request):
    # Notifications carry counts, never case contents or credentials. Clients
    # refetch their authorized projection after a revision or foreground resume.
    async def updates():
        last=None
        while not await request.is_disconnected():
            counts=(len(store.events),len(store.retractions))
            if counts!=last:
                yield 'data: '+json.dumps(dict(type='journey.updated',total_events=counts[0],retractions=counts[1],timestamp=utc_now()))+'\n\n'
                last=counts
            else:yield ': heartbeat\n\n'
            await asyncio.sleep(2)
    return StreamingResponse(updates(),media_type='text/event-stream',headers={'Cache-Control':'no-cache'})


# The call adapter shares sessions, case projections and the durable event store.
from .calls import register_call_routes
register_call_routes(app, current_session, lambda: store)
