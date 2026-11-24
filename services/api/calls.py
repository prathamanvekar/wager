"""Minimal IVR adapter. Demo PIN verification is not production authentication."""
from __future__ import annotations
import copy
import hashlib
import json
import secrets
from datetime import datetime
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field
from .store import CUSTOMERS, utc_now


class StartCall(BaseModel):
    call_id: str = Field(min_length=8, max_length=96, pattern=r'^[a-zA-Z0-9_-]+$')


class CallAction(BaseModel):
    action_id: str = Field(min_length=8, max_length=96, pattern=r'^[a-zA-Z0-9_-]+$')


class VerifyCall(CallAction):
    customer_number: str = Field(min_length=1, max_length=12)
    pin: str = Field(min_length=1, max_length=12)


class SelectCase(CallAction):
    case_id: str = Field(min_length=1, max_length=128)


def owned_call(store, session, call_id):
    call = store.calls.get(call_id)
    if session['channel'] != 'call' or not call or call['session_id'] != session['session_id']:
        raise PermissionError('This call is not available to the current session.')
    return call


def transcript(call, speaker, text):
    call['transcript'].append(dict(speaker=speaker, text=text, at=utc_now()))
    if speaker == 'assistant':
        call['prompt'] = text


def record(store, session, call, kind, content, case=None):
    payload = dict(call_id=call['id'], content=content)
    if case:
        payload['case_id'] = case['id']
    event = store.make_event(session, kind, payload, case_id=case['id'] if case else None,
                             thread=case['threadHint'] if case else 'call_support')
    store.ingest_event(event, persist=False)


def case_for(store, session, case_id):
    case = next((c for c in store.get_cases(session) if c['id'] == case_id), None)
    if not case:
        raise PermissionError('This inquiry is not available to the verified customer.')
    return case


def view(store, session, call):
    result = copy.deepcopy({k: v for k, v in call.items() if k not in ('actions', 'session_id')})
    verified = bool(call['customer_id'])
    result['customer'] = next((dict(id=c['id'], fullName=c['fullName']) for c in CUSTOMERS if c['id'] == call['customer_id']), None)
    result['cases'] = store.get_cases(session) if verified else []
    result['selected_case'] = next((c for c in result['cases'] if c['id'] == call['case_id']), None)
    result['session'] = {k: v for k, v in session.items() if k != 'key'}
    return result


def request_fingerprint(action, body):
    # Even the idempotency record never contains a PIN or a hash of the PIN.
    data = body.model_dump(exclude={'pin'})
    return hashlib.sha256(json.dumps([action, data], sort_keys=True).encode()).hexdigest()


def register_call_routes(app, session_dependency, get_store):
    def run(call_id, body, session, action, operation):
        store = get_store()
        try:
            with store.lock:
                call = owned_call(store, session, call_id)
                fingerprint = request_fingerprint(action, body)
                previous = call['actions'].get(body.action_id)
                if previous:
                    if previous['fingerprint'] != fingerprint:
                        raise ValueError('Action ID already used for a different request.')
                    if previous.get('error'):
                        raise HTTPException(403, previous['error'])
                    return view(store, session, call)
                if call['state'] == 'ended':
                    raise ValueError('This call has ended. Start a new call.')
                operation(store, session, call)
                call['actions'][body.action_id] = dict(fingerprint=fingerprint)
                store._save()
                return view(store, session, call)
        except PermissionError as e:
            raise HTTPException(403, str(e))
        except ValueError as e:
            raise HTTPException(409, str(e))

    @app.post('/api/v1/calls')
    def start(body: StartCall, session=Depends(session_dependency)):
        store = get_store()
        with store.lock:
            if session['channel'] != 'call':
                raise HTTPException(403, 'Start this interaction from the call channel.')
            if body.call_id in store.calls:
                try:
                    return view(store, session, owned_call(store, session, body.call_id))
                except PermissionError as e:
                    raise HTTPException(403, str(e))
            if session['customer_id']:
                raise HTTPException(409, 'Start a fresh call session before calling again.')
            if any(c['session_id'] == session['session_id'] and c['state'] != 'ended' for c in store.calls.values()):
                raise HTTPException(409, 'There is already an active call in this session.')
            call = dict(id=body.call_id, session_id=session['session_id'], state='verifying',
                        customer_id=None, case_id=None, started_at=utc_now(), ended_at=None,
                        attempts=0, transcript=[], prompt='', actions={}, followups=[], heard_cases=[])
            store.calls[call['id']] = call
            transcript(call, 'assistant', 'Welcome to Wager support. Enter your four-digit demo customer number, then your demo PIN. Your existing inquiries will be available after verification.')
            record(store, session, call, 'call.started', 'Support call started. Customer not yet verified.')
            store._save()
            return view(store, session, call)

    @app.get('/api/v1/calls/{call_id}')
    def get(call_id: str, session=Depends(session_dependency)):
        store = get_store()
        try:
            with store.lock:
                return view(store, session, owned_call(store, session, call_id))
        except PermissionError as e:
            raise HTTPException(403, str(e))

    @app.post('/api/v1/calls/{call_id}/verify')
    def verify(call_id: str, body: VerifyCall, session=Depends(session_dependency)):
        def operation(store, s, call):
            if call['state'] != 'verifying':
                raise ValueError('This call has already been verified.')
            customer = next((c for c in CUSTOMERS if c['id'] == 'C' + body.customer_number), None)
            if not customer or not secrets.compare_digest(body.pin.encode(), b'1234'):
                call['attempts'] += 1
                message = 'Demo verification failed. Check the customer number and PIN.'
                if call['attempts'] >= 3:
                    call.update(state='ended', ended_at=utc_now())
                    message = 'Three unsuccessful verification attempts. This call has ended.'
                    record(store, s, call, 'call.ended', message)
                transcript(call, 'assistant', message)
                call['actions'][body.action_id] = dict(fingerprint=request_fingerprint('verify', body), error=message)
                store._save()
                raise HTTPException(403, message)
            s['customer_id'] = customer['id']
            call.update(customer_id=customer['id'], state='choosing_case')
            record(store, s, call, 'call.identity.verified', 'Customer verified using demo customer number and demo PIN.')
            cases = store.get_cases(s)
            message = f"Thank you, {customer['fullName'].split()[0]}. "
            message += f"I found {len(cases)} existing {'inquiry' if len(cases)==1 else 'inquiries'}. Choose the one you are calling about." if cases else 'There are no inquiries linked to this customer yet. Start one on web or mobile, then refresh the inquiry list here.'
            transcript(call, 'assistant', message)
        return run(call_id, body, session, 'verify', operation)

    @app.post('/api/v1/calls/{call_id}/select')
    def select(call_id: str, body: SelectCase, session=Depends(session_dependency)):
        def operation(store, s, call):
            if not call['customer_id']:
                raise PermissionError('Verify the customer before choosing an inquiry.')
            case = case_for(store, s, body.case_id)
            call.update(case_id=case['id'], state='in_case')
            transcript(call, 'customer', 'Selected inquiry: ' + case['merchant'] + '.')
            message = f"You are calling about {case['merchant']}. I have your existing conversation, including {len(case['messages'])} messages. Press 1 to hear the status, 2 to request a follow-up, or 0 to choose another inquiry."
            transcript(call, 'assistant', message)
            record(store, s, call, 'call.case.selected', 'Existing inquiry retrieved during a verified support call.', case)
        return run(call_id, body, session, 'select', operation)

    @app.post('/api/v1/calls/{call_id}/status')
    def status(call_id: str, body: CallAction, session=Depends(session_dependency)):
        def operation(store, s, call):
            if call['state'] != 'in_case':
                raise ValueError('Choose an inquiry first.')
            case = case_for(store, s, call['case_id'])
            label = {'submitted':'Submitted', 'under_review':'Under review', 'awaiting_agent':'Awaiting agent', 'resolved':'Resolved'}[case['status']]
            content = f"The current status of your {case['merchant']} inquiry is {label.lower()}. Your web, mobile and call activity stays together in this conversation."
            transcript(call, 'customer', 'Requested inquiry status.')
            transcript(call, 'assistant', content)
            if case['id'] not in call['heard_cases']:
                call['heard_cases'].append(case['id'])
            record(store, s, call, 'call.status.presented', content, case)
        return run(call_id, body, session, 'status', operation)

    @app.post('/api/v1/calls/{call_id}/follow-up')
    def followup(call_id: str, body: CallAction, session=Depends(session_dependency)):
        def operation(store, s, call):
            if call['state'] != 'in_case':
                raise ValueError('Choose an inquiry first.')
            case = case_for(store, s, call['case_id'])
            if case['id'] in call['followups']:
                raise ValueError('A follow-up was already requested for this inquiry during this call.')
            call['followups'].append(case['id'])
            content = 'Please follow up on this inquiry. Requested during a verified support call.'
            transcript(call, 'customer', content)
            transcript(call, 'assistant', 'Your follow-up request has been added to the existing conversation. It is visible on web and mobile. This request does not schedule a callback.')
            record(store, s, call, 'call.followup.requested', content, case)
        return run(call_id, body, session, 'follow-up', operation)

    @app.post('/api/v1/calls/{call_id}/menu')
    def menu(call_id: str, body: CallAction, session=Depends(session_dependency)):
        def operation(store, s, call):
            if not call['customer_id']:
                raise PermissionError('Verify the customer first.')
            call.update(state='choosing_case', case_id=None)
            transcript(call, 'assistant', 'Choose the inquiry you are calling about. Each inquiry keeps its own conversation.')
        return run(call_id, body, session, 'menu', operation)

    @app.post('/api/v1/calls/{call_id}/end')
    def end(call_id: str, body: CallAction, session=Depends(session_dependency)):
        def operation(store, s, call):
            case = case_for(store, s, call['case_id']) if call['case_id'] else None
            call.update(state='ended', ended_at=utc_now())
            duration = max(0, round((datetime.fromisoformat(call['ended_at']) - datetime.fromisoformat(call['started_at'])).total_seconds()))
            transcript(call, 'assistant', 'Your call has ended. Any inquiry activity is saved in the shared history. Thank you for calling Wager.')
            record(store, s, call, 'call.ended', f'Support call ended after {duration} seconds.', case)
        return run(call_id, body, session, 'end', operation)
