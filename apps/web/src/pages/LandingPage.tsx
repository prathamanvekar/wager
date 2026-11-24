import React, { useRef, useState } from 'react';
import { ThemeControl } from '../design-system/ThemeControl';
import { ArrowRight, Check, Copy, Database, GitMerge, Globe, PhoneCall, Shield, Smartphone, Split } from 'lucide-react';
import { useEvents } from '../context/EventContext';
import { Button } from '../design-system/Button';
import { Modal } from '../design-system/Modal';

interface LandingPageProps { onLaunchDashboard: () => void }
const specimen = {
  protocol_version: '1.0', event_id: 'evt_99b41a-281c', event_type: 'dispute.submitted',
  source: { channel: 'web', client_timestamp: '2026-09-27T10:02:14.201Z' },
  valid_time: '2026-09-27T10:00:00.000Z', ingest_time: '2026-09-27T10:02:14.288Z',
  identifiers: { device_fingerprint: 'tok_dev_4492a8', session_id: 'sess_9918bc' },
  subject: { identity_state: 'orphan', primary_customer_id: null },
  payload: { case_id: 'DSP-88213', transaction_id: 'txn_88213', amount: 142.5, currency: 'USD' },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchDashboard }) => {
  const pillarsRef = useRef<HTMLElement>(null);
  const [activePreviewMode, setActivePreviewMode] = useState<'stitched' | 'fragmented'>('stitched');
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { isBackendConnected } = useEvents();
  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(specimen, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  return (
    <div className="landing">
      <header className="landing-header"><div className="landing-container landing-nav">
        <button className="brand" onClick={onLaunchDashboard} aria-label="Wager - launch portal"><span className="brand-mark"><Shield size={19} strokeWidth={1.8} /></span><span>Wager<span className="brand-period">.</span></span></button>
        <nav className="landing-links" aria-label="Main navigation"><button onClick={() => pillarsRef.current?.scrollIntoView({ behavior: 'smooth' })}>Architecture</button><button onClick={() => setShowSpecModal(true)}>CJEP specification</button></nav>
        <ThemeControl />
        <Button onClick={onLaunchDashboard} rightIcon={<ArrowRight size={15} />}>Launch Interactive Portal</Button>
      </div></header>
      <main>
        <section className="landing-container landing-hero">
          <h1>Seamless customer journeys.<br /><span>Zero lost touchpoints.</span></h1>
          <div className="landing-hero-copy"><p>Stitch events across web, mobile, and voice into one customer journey. Retroactively connect anonymous sessions to known customers, with append-only bitemporal precision.</p><div className="landing-actions"><Button size="lg" onClick={onLaunchDashboard} rightIcon={<ArrowRight size={16} />}>Launch Interactive Portal</Button><Button size="lg" variant="outline" onClick={() => setShowSpecModal(true)}>Read CJEP Spec</Button></div></div>
        </section>
        <section className="landing-container journey-preview" aria-label="Interactive journey simulation">
          <div className="preview-heading"><div><h2>One customer. One continuous story.</h2><p>Cross-channel flagship thread <span className="inline-divider">/</span> Customer C1041</p></div><div className="segmented-control" aria-label="Journey comparison"><button aria-pressed={activePreviewMode === 'stitched'} onClick={() => setActivePreviewMode('stitched')}>With Wager (Stitched)</button><button aria-pressed={activePreviewMode === 'fragmented'} onClick={() => setActivePreviewMode('fragmented')}>Without Wager (Siloed)</button></div></div>
          {activePreviewMode === 'stitched' ? <div className="journey-touchpoints">
            <article className="touchpoint"><div className="touchpoint-channel"><Globe size={18} /><span>Web session</span><time>10:02 AM</time></div><div className="touchpoint-track"><span /><i /></div><h3>Anonymous dispute opened</h3><p>Dispute on <code>txn_88213</code> ($142.50) buffered under device token <code>tok_dev_4492a8</code> as an orphan event.</p><span className="preview-state state-pending">Orphan retained</span></article>
            <article className="touchpoint"><div className="touchpoint-channel"><Smartphone size={18} /><span>Mobile app</span><time>10:14 AM</time></div><div className="touchpoint-track"><span /><i /></div><h3>Late identity binding claim</h3><p>Biometric login executes. Wager emits retraction pair <code>(−) orphan / (+) C1041</code> to bind the web dispute retroactively.</p><span className="preview-state">Identity connected</span></article>
            <article className="touchpoint"><div className="touchpoint-channel"><PhoneCall size={18} /><span>Voice call</span><time>10:19 AM</time></div><div className="touchpoint-track"><span /><i /></div><h3>Full context inherited</h3><p>The voice assistant acknowledges: <em>“Calling about your $142.50 CloudScale dispute?”</em> No need to repeat the story.</p><span className="preview-state">Context preserved</span></article>
          </div> : <div className="fragmented-preview"><h3>The legacy reality: three disconnected tickets</h3><p>Without bitemporal stitching, the web dispute vanishes into an unlinked orphan bin. On mobile, the customer sees no inquiry and files a duplicate. The voice agent has no context and asks: <em>“Can you please explain your problem from the beginning?”</em></p><Button variant="outline" onClick={() => setActivePreviewMode('stitched')}>Switch back to Wager Stitched View</Button></div>}
          <div className="preview-summary"><div><span className={`connection-dot ${isBackendConnected ? 'connected' : 'pending'}`} /><span>{isBackendConnected ? 'Live bitemporal store' : 'Local demonstration'}</span></div><span>1 disputed charge · 3 touchpoints stitched · 0 data collisions</span><button className="text-action" onClick={onLaunchDashboard}>Explore the portal <ArrowRight size={14} /></button></div>
        </section>
        <section ref={pillarsRef} className="landing-container architecture-section">
          <div className="architecture-intro"><h2>Architectural precision<br />by design.</h2><p>Three guarantees that eliminate cross-channel amnesia.</p></div>
          <div className="architecture-list">
            <button className="architecture-row" onClick={onLaunchDashboard}><Database size={21} /><span><strong>Bitemporal store</strong><span>Decouples <code>valid_time</code> (customer reality) from <code>system_time</code> (store ingest). Append-only retraction pairs preserve the audit trail without overwriting records.</span></span><ArrowRight size={17} /></button>
            <button className="architecture-row" onClick={onLaunchDashboard}><GitMerge size={21} /><span><strong>Late identity binding</strong><span>Captures anonymous touchpoints under device fingerprints. Subsequent authentication retroactively claims and connects the orphan event chain.</span></span><ArrowRight size={17} /></button>
            <button className="architecture-row" onClick={onLaunchDashboard}><Split size={21} /><span><strong>Multi-intent partitioning</strong><span>Keeps concurrent journeys, such as billing disputes and credit limit requests, in isolated threads to prevent false repeat-contact alerts and timeline pollution.</span></span><ArrowRight size={17} /></button>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><div className="landing-container"><span><strong>Wager</strong> <span className="inline-divider">/</span> Canonical Customer Journey Event Protocol · CJEP v1</span><div><button onClick={() => setShowSpecModal(true)}>Specification</button><button className="text-action" onClick={onLaunchDashboard}>Launch Interactive Portal <ArrowRight size={14} /></button></div></div></footer>
      <Modal isOpen={showSpecModal} onClose={() => setShowSpecModal(false)} title="Canonical Event Envelope (CJEP v1)" maxWidth="720px" footer={<><Button variant="outline" onClick={() => setShowSpecModal(false)}>Close</Button><Button onClick={() => { setShowSpecModal(false); onLaunchDashboard(); }}>Launch Interactive Portal</Button></>}>
        <p className="spec-description">CJEP envelopes enforce decoupled bitemporality and cross-channel identity graph stitching across web, mobile apps, telephony voice bots, and agent dashboards.</p>
        <div className="spec-code"><Button variant="secondary" size="sm" onClick={handleCopySpec} leftIcon={copiedCode ? <Check size={13} /> : <Copy size={13} />}>{copiedCode ? 'Copied' : 'Copy'}</Button><pre>{JSON.stringify(specimen, null, 2)}</pre></div>
      </Modal>
    </div>
  );
};
