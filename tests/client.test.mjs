import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from '../apps/web/node_modules/typescript/lib/typescript.js';
const source=await readFile(new URL('../packages/client/src/index.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {WagerClient,ApiError}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const memory=()=>{const values=new Map();return {values,getItem:async k=>values.get(k)??null,setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k)};};
const identity={device_id:'device-test',session_id:'session-test',channel:'mobile'};
const credentials={access_token:'test-token',session:{...identity,session_id:'server-session',customer_id:null,expires_at:'2099-01-01T00:00:00Z'}};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
function sessionFetch(){return async(url)=>url.endsWith('/sessions')?json(credentials):json(credentials.session);}
test('offline queue survives restart and retries exactly the same envelope',async()=>{
 const storage=memory();globalThis.fetch=sessionFetch();
 const first=new WagerClient('http://test/api/v1',storage);await first.connect(identity);
 globalThis.fetch=async()=>{throw new TypeError('offline');};
 const event=first.makeEvent('mobile.case.message_sent',{case_id:'case1',content:'Phone reply'});
 const queued=await first.ingestEvent(event);assert.equal(queued.status,'queued_offline');assert.equal(first.getOfflineQueue().length,1);
 globalThis.fetch=sessionFetch();const restored=new WagerClient('http://test/api/v1',storage);await restored.connect(identity);
 let sent;globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return json({status:'accepted'});};
 assert.equal(await restored.flushQueue(),1);assert.deepEqual(sent,JSON.parse(JSON.stringify(event)));assert.equal(restored.getOfflineQueue().length,0);
});
test('HTTP rejection is surfaced and never labelled offline success',async()=>{
 const storage=memory();globalThis.fetch=sessionFetch();const c=new WagerClient('http://test/api/v1',storage);await c.connect(identity);
 globalThis.fetch=async()=>json({detail:'Not your case'},403);
 await assert.rejects(c.ingestEvent(c.makeEvent('mobile.case.message_sent',{case_id:'wrong'})),e=>e instanceof ApiError&&e.status===403);
 assert.equal(c.getOfflineQueue().length,0);
});
test('single-flight connect issues only one session registration',async()=>{
 const storage=memory();let count=0;globalThis.fetch=async()=>{count++;return json(credentials);};
 const c=new WagerClient('http://test/api/v1',storage);await Promise.all([c.connect(identity),c.connect(identity),c.connect(identity)]);assert.equal(count,1);
});
test('changing backend does not reuse another server credentials',async()=>{
 const storage=memory();globalThis.fetch=sessionFetch();const c=new WagerClient('http://first/api/v1',storage);await c.connect(identity);
 let auth;globalThis.fetch=async(url,options)=>{auth=options.headers.Authorization;return json(credentials);};
 const second=new WagerClient('http://second/api/v1',storage);await second.connect(identity);assert.equal(auth,undefined);
});
test('sign-out preserves pending messages and does not revoke their session',async()=>{
 const storage=memory();globalThis.fetch=sessionFetch();const c=new WagerClient('http://test/api/v1',storage);await c.connect(identity);
 globalThis.fetch=async()=>{throw new Error('offline');};await c.ingestEvent(c.makeEvent('support.inquiry.created',{case_id:'case2'}));
 await assert.rejects(c.logout(),/pending/);assert.equal(c.getSession().session_id,'server-session');assert.equal(c.getOfflineQueue().length,1);
});

for (const status of [408, 429, 500, 503]) {
 test(`HTTP ${status} preserves the original durable event for retry after restart`,async()=>{
  const storage=memory();globalThis.fetch=sessionFetch();
  const first=new WagerClient('http://test/api/v1',storage);await first.connect(identity);
  const event=first.makeEvent('mobile.case.message_sent',{case_id:'case1',content:'Retry me'});
  globalThis.fetch=async()=>json({detail:'Try again'},status);
  assert.equal((await first.ingestEvent(event)).status,'queued_offline');
  assert.equal(first.getOfflineQueue().length,1);
  globalThis.fetch=sessionFetch();
  const restored=new WagerClient('http://test/api/v1',storage);await restored.connect(identity);
  let sent;globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return json({status:'accepted'});};
  assert.equal(await restored.flushQueue(),1);
  assert.deepEqual(sent,JSON.parse(JSON.stringify(event)));
  assert.equal(restored.getOfflineQueue().length,0);
 });
}
