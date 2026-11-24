import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from '../apps/web/node_modules/typescript/lib/typescript.js';
const source = await readFile(new URL('../packages/client/src/index.ts',import.meta.url),'utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const { WagerClient, ApiError } = await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const memory = () => { const values=new Map(); return {values,getItem:async k=>values.get(k)??null,setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k)}; };
const identity={device_id:'call-device-test',session_id:'call-session-test',channel:'call'};
const anon={...identity,customer_id:null,expires_at:'2099-01-01T00:00:00Z'};
const verified={...anon,customer_id:'C1041'};
const credentials={access_token:'call-token',session:anon};
const state=(session=anon)=>({id:'call_transport_test',state:session.customer_id?'choosing_case':'verifying',session,customer_id:session.customer_id,cases:[],transcript:[],followups:[]});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});

test('call verification reuses shared transport and persists only the verified session',async()=>{
 const storage=memory(),secure=memory(),requests=[];
 globalThis.fetch=async(url,options)=>{requests.push({url,options});return json(url.endsWith('/sessions')?credentials:url.endsWith('/verify')?state(verified):state());};
 const c=new WagerClient('http://calls/api/v1',storage,secure);
 await c.connect(identity);assert.equal(JSON.parse(requests[0].options.body).channel,'call');
 await c.startCall('call_transport_test');
 await c.verifyCall('call_transport_test','1041','1234','verify_action_001');
 assert.equal(c.getSession().customer_id,'C1041');
 assert.equal(requests.at(-1).options.headers.Authorization,'Bearer call-token');
 assert.equal(JSON.parse(requests.at(-1).options.body).pin,'1234');
 assert.ok(![...storage.values.values(),...secure.values.values()].join('').includes('1234'));
 globalThis.fetch=async()=>json(verified);
 const restored=new WagerClient('http://calls/api/v1',storage,secure);
 assert.equal((await restored.connect(identity)).customer_id,'C1041');
});

test('call action retries send the same action ID and do not pretend to save an offline request',async()=>{
 const storage=memory();globalThis.fetch=async()=>json(credentials);
 const c=new WagerClient('http://calls/api/v1',storage);await c.connect(identity);
 const bodies=[];let attempts=0;
 globalThis.fetch=async(url,options)=>{bodies.push(JSON.parse(options.body));return ++attempts===1?json({detail:'Temporarily unavailable'},503):json(state(verified));};
 await assert.rejects(c.callAction('call_transport_test','follow-up','retry_action_001'),e=>e instanceof ApiError&&e.status===503);
 assert.equal(c.getOfflineQueue().length,0);
 await c.callAction('call_transport_test','follow-up','retry_action_001');
 assert.deepEqual(bodies[0],bodies[1]);
 assert.deepEqual(bodies[1],{action_id:'retry_action_001'});
});

test('call session expiry restores through a fresh server registration',async()=>{
 const storage=memory();globalThis.fetch=async()=>json(credentials);
 const first=new WagerClient('http://calls/api/v1',storage);await first.connect(identity);
 let registrations=0;
 globalThis.fetch=async(url)=>url.endsWith('/sessions/me')?json({detail:'Expired'},401):(registrations++,json({...credentials,access_token:'new-call-token'}));
 const next=new WagerClient('http://calls/api/v1',storage);await next.connect(identity);
 assert.equal(registrations,1);assert.equal(next.getSession().channel,'call');
});
