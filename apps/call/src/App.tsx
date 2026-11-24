import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, FileText, Headphones, LoaderCircle, Moon, Phone, PhoneOff, RefreshCw, RotateCcw, Settings2, ShieldCheck, Sun, Volume2, VolumeX } from 'lucide-react';
import { ApiError, newId, WagerClient } from '../../../packages/client/src';
import type { CallState } from '../../../packages/contracts/src';
import { addressFor, callKey, createClient, defaultAddress, endKey, read, write } from './api';
import { useVoice } from './useVoice';

type Ending = { id: string; actionId: string; at: number };
type Action = 'select' | 'status' | 'follow-up' | 'menu' | 'end';
const statuses = { submitted: 'Submitted', under_review: 'Under review', awaiting_agent: 'Awaiting agent', resolved: 'Resolved' };
const digits = [['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*','Clear'],['0','+'],['#','Enter']];
function message(error: unknown) { if (error instanceof ApiError && error.status === 404) return 'Call endpoints are unavailable. Restart the backend from the updated project, then retry.'; return error instanceof ApiError || (error instanceof Error && !(error instanceof TypeError) && error.name !== 'AbortError') ? error.message : 'Cannot reach the shared backend. Keep it running and check the server address.'; }
function duration(start: string, end: number) { const n = Math.max(0, Math.floor((end - Date.parse(start)) / 1000)); return `${Math.floor(n / 60).toString().padStart(2,'0')}:${(n % 60).toString().padStart(2,'0')}`; }

export default function App() {
  const [address, setAddress] = useState(defaultAddress);
  const [call, setCall] = useState<CallState | null>(null);
  const [busy, setBusy] = useState(false), [restoring, setRestoring] = useState(true);
  const [online, setOnline] = useState(false), [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState(''), [customerNumber, setCustomerNumber] = useState('');
  const [phase, setPhase] = useState<'customer' | 'pin'>('customer');
  const [audio, setAudio] = useState(read('audio') !== 'off');
  const [expired, setExpired] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [ending, setEnding] = useState<Ending | null>(null);
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  const client = useRef<WagerClient | null>(null), current = useRef<CallState | null>(null);
  const working = useRef(false), fetching = useRef(false), pending = useRef<{ key: string; id: string } | null>(null);
  const endingRef = useRef<Ending | null>(null), entryRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const active = !!call && call.state !== 'ended' && !ending && !expired;
  const voice = useVoice(call?.prompt || '', audio && !ending && !expired);
  const setEndingState = (value: Ending | null) => { endingRef.current = value; setEnding(value); };
  const sessionUnavailable = useCallback((e: unknown) => {
    if (!(e instanceof ApiError) || ![401,403].includes(e.status)) return false;
    setExpired(true); setOnline(false);
    setError('This call session is no longer accessible. Any unconfirmed action or call summary could not be saved. Start a new session to continue.');
    return true;
  }, []);
  const commit = useCallback((next: CallState) => {
    if (current.current?.id === next.id && current.current.transcript.length > next.transcript.length) return;
    current.current = next; setCall(next); setOnline(true);
  }, []);
  const connect = useCallback(async (url: string) => {
    const c = client.current?.getBaseUrl() === url ? client.current : createClient(url);
    client.current = c;
    let device = read('device');
    if (!device) { device = newId('dev'); write('device', device); }
    await c.connect({ device_id: device, session_id: newId('ses'), channel: 'call' });
    return c;
  }, []);

  useEffect(() => {
    let alive = true;
    const url = defaultAddress;
    const id = read(callKey(url), true);
    if (!id) { setRestoring(false); return; }
    (async () => {
      try {
        const c = await connect(url);
        const savedEnd = read(endKey(url), true);
        if (savedEnd) {
          try { const parsed = JSON.parse(savedEnd) as Ending; if (alive && parsed.id === id) setEndingState(parsed); } catch { write(endKey(url), null, true); }
        }
        const restored = await c.fetchCall(id);
        if (alive) { commit(restored); if (restored.state === 'ended') { setEndingState(null); write(endKey(url), null, true); } }
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && [401,403].includes(e.status)) {
          write(callKey(url), null, true); write(endKey(url), null, true); client.current = null;
          setError('The previous call session is no longer available. You can start a new call.');
        } else setError(message(e));
      } finally { if (alive) setRestoring(false); }
    })();
    return () => { alive = false; };
  }, [commit, connect]);

  const refresh = useCallback(async () => {
    const c = client.current, before = current.current;
    if (!c || !before || working.current || fetching.current) return;
    fetching.current = true;
    try {
      const end = endingRef.current;
      const next = end ? await c.callAction(before.id, 'end', end.actionId) : await c.fetchCall(before.id);
      if (client.current !== c || current.current?.id !== before.id || working.current) return;
      commit(next); setError(null);
      if (next.state === 'ended') { setEndingState(null); write(endKey(c.getBaseUrl()), null, true); }
    } catch (e) { if (client.current === c && current.current?.id === before.id) { if (!sessionUnavailable(e)) { setOnline(false); setError(message(e)); } } }
    finally { fetching.current = false; }
  }, [commit, sessionUnavailable]);
  useEffect(() => {
    if (!call || call.state === 'ended' || expired) return;
    const poll = window.setInterval(() => { void refresh(); }, 5000);
    const onFocus = () => { void refresh(); };
    window.addEventListener('online', onFocus); window.addEventListener('focus', onFocus);
    return () => { clearInterval(poll); window.removeEventListener('online',onFocus); window.removeEventListener('focus',onFocus); };
  }, [call?.id, call?.state, expired, refresh]);
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [active]);
  useEffect(() => { if (call?.state === 'verifying') entryRef.current?.focus(); }, [phase, call?.state]);
  useEffect(() => { transcriptRef.current?.scrollTo({top:transcriptRef.current.scrollHeight, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); }, [call?.transcript.length]);

  async function start() {
    if (working.current) return;
    working.current = true; setBusy(true); setError(null); voice.stop();
    try {
      const url = addressFor(address);
      const fresh = expired || current.current?.state === 'ended';
      if (expired) client.current = null;
      let c = await connect(url);
      if (!expired && (current.current?.state === 'ended' || c.getSession()?.customer_id)) {
        try { await c.logout(); } catch (e) { if (!(e instanceof ApiError && e.status === 401)) throw e; }
        client.current = null; c = await connect(url); current.current = null; setCall(null);
      }
      const id = fresh ? newId('call') : (read(callKey(url), true) || newId('call'));
      if (fresh) { current.current = null; setCall(null); setExpired(false); }
      write('api', url); write(callKey(url), id, true);
      const next = await c.startCall(id);
      setEndingState(null); write(endKey(url), null, true); pending.current = null;
      setAddress(url); setPhase('customer'); setEntry(''); setCustomerNumber(''); commit(next); setClock(Date.now());
    } catch (e) { setOnline(false); setError(message(e)); }
    finally { working.current = false; setBusy(false); }
  }

  async function act(action: Action, caseId?: string) {
    const c = client.current, before = current.current;
    if (!c || !before || working.current) return;
    const key = `${before.id}:${action}:${caseId || ''}`;
    const id = action === 'end' && endingRef.current ? endingRef.current.actionId : pending.current?.key === key ? pending.current.id : newId('action');
    pending.current = {key, id};
    if (action === 'end') {
      voice.stop();
      const localEnd = endingRef.current || { id:before.id, actionId:id, at:Date.now() };
      setEndingState(localEnd); write(endKey(c.getBaseUrl()), JSON.stringify(localEnd), true);
    }
    working.current = true; setBusy(true); setError(null);
    try {
      const next = await c.callAction(before.id, action, id, caseId);
      commit(next); pending.current = null;
      if (next.state === 'ended') { setEndingState(null); write(endKey(c.getBaseUrl()), null, true); }
    } catch (e) {
      setError(action === 'end' ? 'The call ended on this device. Its summary will save when the backend reconnects. Keep this tab open, or reopen it in the same session.' : message(e));
      if (!(e instanceof ApiError) || e.status >= 500) setOnline(false);
      else pending.current = null;
      try {
        const latest = await c.fetchCall(before.id); commit(latest);
        if (latest.state === 'ended') { setEndingState(null); write(endKey(c.getBaseUrl()), null, true); pending.current = null; }
      } catch (fetchError) { sessionUnavailable(fetchError); }
    } finally { working.current = false; setBusy(false); }
  }

  async function submitEntry() {
    if (entry.length !== 4 || working.current) return;
    if (phase === 'customer') { setCustomerNumber(entry); setEntry(''); setPhase('pin'); return; }
    const c = client.current, before = current.current;
    if (!c || !before) return;
    const key = `${before.id}:verify:${customerNumber}`;
    const id = pending.current?.key === key ? pending.current.id : newId('action');
    pending.current = { key, id }; working.current = true; setBusy(true); setError(null);
    try { commit(await c.verifyCall(before.id, customerNumber, entry, id)); pending.current = null; }
    catch (e) {
      setError(message(e));
      if (e instanceof ApiError && e.status < 500) pending.current = null; else setOnline(false);
      try { commit(await c.fetchCall(before.id)); } catch (fetchError) { sessionUnavailable(fetchError); }
    } finally { setEntry(''); working.current = false; setBusy(false); }
  }
  function keypress(key: string) {
    if (busy || !active) return;
    if (call?.state === 'verifying') {
      if (key === '*') setEntry('');
      else if (key === '#') void submitEntry();
      else setEntry(value => (value + key).slice(0,4));
    } else if (call?.state === 'choosing_case' && /^[1-9]$/.test(key)) {
      const inquiry = call.cases[Number(key) - 1];
      if (inquiry) void act('select', inquiry.id);
    } else if (call?.state === 'in_case') {
      if (key === '1') void act('status');
      if (key === '2' && !call.followups.includes(call.case_id!)) void act('follow-up');
      if (key === '0') void act('menu');
    }
  }
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); document.documentElement.dataset.theme = next;
    write('theme', next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#202123' : '#f7f8f7');
  }
  const selected = call?.selected_case;
  const isEnded = call?.state === 'ended' || !!ending;
  const elapsed = call ? duration(call.started_at, call.ended_at ? Date.parse(call.ended_at) : ending?.at || clock) : '00:00';
  const followupSaved = !!selected && call!.followups.includes(selected.id);

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="/" aria-label="Wager support call home"><span className="brand-icon"><Phone size={19}/></span><strong>Wager</strong><span className="brand-divider"/><span>Support call</span></a>
      <div className="header-actions">
        <span className="simulation-label">IVR simulator</span>
        <button className="icon-button" role="switch" aria-label="Dark mode" aria-checked={theme==='dark'} title="Switch appearance" onClick={toggleTheme}>{theme==='dark'?<Moon size={18}/>:<Sun size={18}/>}</button>
        <details className="connection-settings"><summary className="icon-button" aria-label="Backend settings" title="Backend settings"><Settings2 size={18}/></summary><div className="settings-panel"><label htmlFor="server">Shared backend</label><input id="server" type="url" value={address} disabled={active || !!ending} onChange={e=>setAddress(e.target.value)} spellCheck={false}/><p>Use the same API as web and mobile. Change it between calls.</p></div></details>
      </div>
    </header>
    <main className="workspace">
      <section className={`call-console ${active ? 'is-live' : ''}`} aria-label="Support call controls" onKeyDown={event => {
        if (event.ctrlKey || event.metaKey || event.altKey || !/^[0-9*#]$/.test(event.key)) return;
        if ((event.target as HTMLElement).closest('input') && !['*','#'].includes(event.key)) return;
        event.preventDefault(); keypress(event.key);
      }}>
        <div className="service-identity"><div className={`service-icon ${active?'is-active':''}`}><Headphones size={30} strokeWidth={1.5}/></div><h1>Wager support</h1><p>{call?.customer ? `Connected as ${call.customer.fullName}` : 'Continue an existing inquiry.'}</p></div>
        <div className="call-state"><span className={`status-dot ${active && online?'connected':''}`}/><span role="status">{expired?'Session unavailable':restoring?'Restoring call':ending?'Saving call summary':isEnded?'Call ended':active?online?'In call':'Connection interrupted':'Ready to call'}</span><time role="timer" aria-live="off" aria-label="Call duration">{elapsed}</time></div>
        {error && <div className="error-banner" role="alert"><p>{error}</p>{call && <button className="text-button" disabled={busy} onClick={()=>void (expired ? start() : refresh())}><RefreshCw size={14}/>{expired ? 'Start new session' : 'Retry connection'}</button>}</div>}
        {!call && <div className="ready-state"><p>Your support history comes with you. Verify your demo identity once, then choose an inquiry already linked to your account.</p><button className="button primary full-width" disabled={busy || restoring} onClick={()=>void start()}>{busy?<LoaderCircle size={18} className="spin"/>:<Phone size={18}/>} {busy?'Connecting':'Start support call'}</button><p className="fine-print">Browser simulation. No real number is dialled and no microphone is used.</p></div>}
        {call?.state === 'verifying' && !ending && !expired && <div className="verification"><form onSubmit={e=>{e.preventDefault();void submitEntry();}}><div className="field-heading"><label htmlFor="digits">{phase==='customer'?'Demo customer number':'Demo PIN'}</label><span>{phase==='customer'?'1 of 2':'2 of 2'}</span></div><input ref={entryRef} id="digits" className="digit-entry" type={phase==='pin'?'password':'text'} inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" maxLength={4} value={entry} onChange={e=>setEntry(e.target.value.replace(/\D/g,'').slice(0,4))} disabled={busy} aria-describedby="entry-help"/><p id="entry-help" className="entry-help">{phase==='customer'?'Enter four digits, then press # or Continue.':`Customer ${customerNumber}. Enter the demo PIN, then press #.`}</p><button className="button primary full-width" type="submit" disabled={busy || entry.length!==4}>{busy?<LoaderCircle size={16} className="spin"/>:<ShieldCheck size={16}/>} {phase==='customer'?'Continue':'Verify demo identity'}</button></form><div className="keypad" aria-label="Telephone keypad">{digits.map(([n,letters])=><button key={n} type="button" disabled={busy} onClick={()=>keypress(n)} aria-label={n==='*'?'Clear digits':n==='#'?'Submit digits':`Digit ${n}`}><span>{n}</span><small>{letters || '\u00a0'}</small></button>)}</div>{phase==='pin' && <button className="text-button" disabled={busy} onClick={()=>{setPhase('customer');setEntry('');setError(null);}}><ArrowLeft size={14}/>Change customer number</button>}</div>}
        {call?.state==='choosing_case' && !ending && !expired && <div className="inquiry-menu"><div className="section-heading"><h2>Your inquiries</h2><button className="icon-button" aria-label="Refresh inquiries" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/></button></div><p className="muted">Choose what you are calling about.</p>{call.cases.length ? <div className="inquiry-list">{call.cases.map((c,index)=><button className="inquiry-choice" key={c.id} disabled={busy} onClick={()=>void act('select',c.id)}><span className="menu-number">{index+1}</span><span><strong>{c.merchant}</strong><small>{c.reason} · {statuses[c.status]}</small></span><ArrowRight size={16}/></button>)}</div> : <div className="empty-inquiries"><FileText size={24}/><h3>No linked inquiries yet</h3><p>Start an inquiry on web or mobile as this customer, then refresh. An unrelated anonymous web session is not automatically claimed.</p></div>}</div>}
        {call?.state==='in_case' && selected && !ending && !expired && <div className="call-menu"><div className="verified-label"><ShieldCheck size={15}/>Identity verified · {call.customer?.id}</div><h2>How can we help?</h2><p className="muted">We already have your conversation.</p><button className="menu-action" disabled={busy || !online} onClick={()=>void act('status')}><span className="menu-number">1</span><span><strong>Hear inquiry status</strong><small>Read from the shared case history</small></span><Volume2 size={18}/></button><button className="menu-action" disabled={busy || !online || followupSaved} onClick={()=>void act('follow-up')}><span className="menu-number">{followupSaved?<Check size={17}/>:2}</span><span><strong>{followupSaved?'Follow-up requested':'Request a follow-up'}</strong><small>{followupSaved?'Added to this conversation':'Add a request to the existing inquiry'}</small></span><ArrowRight size={18}/></button><button className="text-button" disabled={busy} onClick={()=>void act('menu')}><ArrowLeft size={14}/>0 · Choose another inquiry</button></div>}
        {isEnded && call && <div className="call-summary"><div className="summary-icon"><Check size={24}/></div><h2>{ending?'Call ended locally':'Thanks for calling.'}</h2><p>{ending?'Your call summary is waiting for the shared backend.':'Your conversation is ready to continue on web or mobile.'}</p><dl><div><dt>Customer</dt><dd>{call.customer?.fullName || 'Not verified'}</dd></div><div><dt>Statuses heard</dt><dd>{call.heard_cases.length}</dd></div><div><dt>Follow-up requests</dt><dd>{call.followups.length}</dd></div></dl><button className="button primary full-width" disabled={busy || !!ending} onClick={()=>void start()}><Phone size={17}/>Start another call</button><span className="reference">Call reference {call.id.slice(-8).toUpperCase()}</span></div>}
        {call && !isEnded && !expired && <div className="call-controls"><button className="utility-control" aria-pressed={audio} onClick={()=>{setAudio(!audio);write('audio',audio?'off':'on');}} title={audio?'Turn spoken prompts off':'Turn spoken prompts on'}>{audio?<Volume2 size={20}/>:<VolumeX size={20}/>}<span>Audio {audio?'on':'off'}</span></button><button className="utility-control" disabled={!audio || !voice.supported} onClick={voice.replay}><RotateCcw size={20}/><span>Replay</span></button><button className="end-call" disabled={busy} onClick={()=>void act('end')}><PhoneOff size={20}/><span>End call</span></button></div>}
      </section>
      <section className="conversation-panel" aria-labelledby="transcript-title">
        <header className="conversation-header"><div><h2 id="transcript-title">Call transcript</h2><p>{call ? 'A written record of this call.' : 'Spoken prompts, with a readable record.'}</p></div>{call && <span className={`voice-state ${voice.speaking?'speaking':''}`}><span className="status-dot connected"/>{voice.speaking?'Speaking':!voice.supported || voice.error?'Text mode':audio?'Audio ready':'Audio off'}</span>}</header>
        {selected && <div className="case-context"><div className="context-label"><FileText size={15}/><span>Existing inquiry</span><span className="case-status">{statuses[selected.status]}</span></div><h3>{selected.merchant}</h3><p>{selected.reason}</p><div className="context-meta"><span>{selected.id.slice(-8).toUpperCase()}</span>{selected.transactionId && <span>{selected.currency} {selected.amount.toFixed(2)}</span>}<span>{selected.messages.length} messages</span></div><details className="earlier-messages"><summary>Read the earlier conversation<ChevronDown size={14}/></summary><div>{selected.messages.map(m=><article key={m.id}><header><strong>{m.senderName}</strong><time>{new Date(m.timestamp).toLocaleDateString()}</time></header><p>{m.content}</p></article>)}</div></details></div>}
        <div className="transcript" ref={transcriptRef} role="log" aria-live="polite" aria-label="Call transcript entries" aria-relevant="additions text">{call ? call.transcript.map((line,index)=><article className={`transcript-entry ${line.speaker}`} key={`${call.id}-${index}`}><header><strong>{line.speaker==='assistant'?'Wager support':'You'}</strong><time>{new Date(line.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></header><p>{line.text}</p></article>) : <div className="transcript-empty"><div className="transcript-empty-icon"><Phone size={25} strokeWidth={1.5}/></div><h3>Your call starts here.</h3><p>Once verified, the support line can retrieve inquiries from web and mobile. You will not need to repeat the earlier conversation.</p><div className="channel-path"><span>Web</span><ArrowRight size={13}/><span>Mobile</span><ArrowRight size={13}/><strong>Call</strong></div></div>}</div>
        {voice.error && <p className="audio-error" role="status">{voice.error}</p>}
        {(!call || call.state==='verifying') && <aside className="demo-guide"><ShieldCheck size={19}/><div><h3>Demo verification</h3><p>Customer number: <strong>1041</strong> Alex, <strong>2094</strong> Priya, <strong>3819</strong> David.</p><p>Demo PIN: <strong>1234</strong> for all three. This is simulated verification, not a real banking credential.</p></div></aside>}
        {call?.customer && <footer className="shared-note"><ShieldCheck size={15}/><span>{call.customer.id} · Same customer, same inquiry history. No web-session handoff needed for already linked inquiries.</span></footer>}
      </section>
    </main>
    <footer className="app-footer"><span>Wager · Customer support continuity</span><span><Clock3 size={13}/> Web, mobile and call share one history.</span></footer>
  </div>;
}
