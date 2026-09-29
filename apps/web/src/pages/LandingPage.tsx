import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  GitMerge,
  Split,
  Database,
  ExternalLink,
  ChevronRight,
  Lock,
  Compass,
  PhoneCall,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useEvents } from '../context/EventContext';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onLaunchDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchDashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroActionsRef = useRef<HTMLDivElement>(null);
  const heroGuaranteesRef = useRef<HTMLDivElement>(null);
  const previewWindowRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);

  const [activePreviewMode, setActivePreviewMode] = useState<'stitched' | 'fragmented'>('stitched');
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { isBackendConnected } = useEvents();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Page Load Stagger with Exponential Out Easing
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(navRef.current, {
        y: -16,
        opacity: 0,
        duration: 0.7,
      })
        .from(
          heroHeadingRef.current,
          {
            y: 28,
            opacity: 0,
            duration: 0.85,
          },
          '-=0.35'
        )
        .from(
          heroDescRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.75,
          },
          '-=0.55'
        )
        .from(
          heroActionsRef.current,
          {
            y: 18,
            opacity: 0,
            duration: 0.7,
          },
          '-=0.5'
        )
        .from(
          heroGuaranteesRef.current,
          {
            y: 14,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.45'
        )
        .from(
          previewWindowRef.current,
          {
            y: 36,
            opacity: 0,
            scale: 0.985,
            duration: 0.9,
          },
          '-=0.4'
        )
        .from(
          pillarsRef.current?.children || [],
          {
            y: 24,
            opacity: 0,
            duration: 0.65,
            stagger: 0.12,
          },
          '-=0.3'
        );

      // 2. Parallax Depth on Dashboard Preview with ScrollTrigger
      if (previewWindowRef.current) {
        gsap.to(previewWindowRef.current, {
          yPercent: -4,
          ease: 'none',
          scrollTrigger: {
            trigger: previewWindowRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const scrollToPillars = () => {
    pillarsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopySpec = () => {
    const jsonSample = JSON.stringify(
      {
        protocol_version: '1.0',
        event_id: 'evt_99b41a-281c',
        event_type: 'dispute.submitted',
        source: { channel: 'web', client_timestamp: '2026-09-27T10:02:14.201Z' },
        valid_time: '2026-09-27T10:00:00.000Z',
        ingest_time: '2026-09-27T10:02:14.288Z',
        identifiers: { device_fingerprint: 'tok_dev_4492a8', session_id: 'sess_9918bc' },
        subject: { identity_state: 'orphan', primary_customer_id: null },
        payload: { case_id: 'DSP-88213', transaction_id: 'txn_88213', amount: 142.5, currency: 'USD' },
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonSample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        color: '#0f172a',
        fontFamily: 'var(--font-sans)',
        background: 'linear-gradient(180deg, #dcfce7 0%, #f0fdf4 16%, #f8fafc 42%, #ffffff 100%)',
      }}
    >
      {/* 1. Luminous Atmospheric Sky & Horizon Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '660px',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Soft Radial Ambient Sunlight Bloom */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92vw',
            maxWidth: '1280px',
            height: '520px',
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(167, 243, 208, 0.42) 0%, rgba(209, 250, 229, 0.22) 45%, rgba(248, 250, 252, 0) 75%)',
            filter: 'blur(45px)',
          }}
        />

        {/* Delicate Organic Horizon Silhouette */}
        <svg
          viewBox="0 0 1440 320"
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '260px',
            opacity: 0.22,
            transform: 'scaleY(1.25)',
          }}
          preserveAspectRatio="none"
        >
          <path
            fill="#059669"
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,192C960,203,1056,181,1152,160C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* 2. Floating Frosted Navigation Bar */}
      <div
        style={{
          position: 'sticky',
          top: '1.25rem',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 1.25rem',
        }}
      >
        <nav
          ref={navRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            width: '100%',
            maxWidth: '920px',
            padding: '0.5rem 0.75rem 0.5rem 1.25rem',
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            borderRadius: '9999px',
            boxShadow:
              '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Bespoke Geometric Nexus Logo & Brand */}
          <div
            onClick={onLaunchDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#090d16',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(9, 13, 22, 0.25)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M4.93 4.93l2.83 2.83" />
                <path d="M16.24 16.24l2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="M4.93 19.07l2.83-2.83" />
                <path d="M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.0625rem',
                letterSpacing: '-0.025em',
                color: '#0f172a',
              }}
            >
              Wager
            </span>
          </div>

          {/* Navigation Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#475569',
            }}
            className="hidden-mobile"
          >
            <button
              onClick={scrollToPillars}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              Architecture
            </button>
            <button
              onClick={scrollToPillars}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              Late Binding
            </button>
            <button
              onClick={scrollToPillars}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              Multi-Intent
            </button>
            <button
              onClick={() => setShowSpecModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              CJEP Spec
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onLaunchDashboard}
            style={{
              backgroundColor: '#090d16',
              color: '#ffffff',
              padding: '0.55rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 2px 10px -1px rgba(9, 13, 22, 0.3)',
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#090d16';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Launch Interactive Portal</span>
            <ArrowRight size={13} />
          </button>
        </nav>
      </div>

      {/* 3. Hero Section (Craft Floor: No Eyebrow Kicker, Pure Typographic Power) */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '5rem 1.5rem 3.25rem 1.5rem',
          maxWidth: '980px',
          margin: '0 auto',
        }}
      >
        {/* Editorial Serif Display Heading */}
        <h1
          ref={heroHeadingRef}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.75rem, 6vw, 4.75rem)',
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            color: '#0f172a',
            margin: '0 auto 1.5rem auto',
          }}
        >
          Seamless Customer Journeys.
          <br />
          Zero Lost Touchpoints.
        </h1>

        {/* Balanced, concise 2-sentence description */}
        <p
          ref={heroDescRef}
          style={{
            fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)',
            lineHeight: 1.6,
            color: '#475569',
            maxWidth: '680px',
            margin: '0 auto 2.25rem auto',
          }}
        >
          Stitch cross-channel events across web, mobile, and voice calls into unified customer journeys. Retroactively claim anonymous sessions with append-only bitemporal precision.
        </p>

        {/* Hero CTA Button Pair */}
        <div
          ref={heroActionsRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onLaunchDashboard}
            style={{
              backgroundColor: '#090d16',
              color: '#ffffff',
              padding: '0.875rem 2rem',
              borderRadius: '9999px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow:
                '0 1px 2px rgba(9, 13, 22, 0.1), 0 10px 28px -4px rgba(9, 13, 22, 0.3)',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#090d16';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Launch Interactive Portal</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => setShowSpecModal(true)}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              padding: '0.875rem 1.625rem',
              borderRadius: '9999px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <span>Read CJEP Spec</span>
            <ExternalLink size={14} color="#64748b" />
          </button>
        </div>

        {/* Telemetry & Architecture Guarantees Micro-Strip */}
        <div
          ref={heroGuaranteesRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '2rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#64748b',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
            Append-only Bitemporal Store
          </span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            Retroactive Device Claiming
          </span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
            Zero In-Place Overwrites
          </span>
        </div>
      </section>

      {/* 4. Interactive Workstation Preview Window */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 1.25rem 4.5rem 1.25rem',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        <div
          ref={previewWindowRef}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid rgba(226, 232, 240, 0.95)',
            boxShadow:
              '0 1px 3px rgba(15, 23, 42, 0.04), 0 20px 48px -12px rgba(15, 23, 42, 0.12), 0 32px 64px -24px rgba(5, 150, 105, 0.08)',
            overflow: 'hidden',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {/* macOS Browser Chrome Bar */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            </div>

            {/* Address Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
                padding: '0.25rem 1rem',
                fontSize: '0.75rem',
                color: '#64748b',
                width: '100%',
                maxWidth: '400px',
                justifyContent: 'center',
              }}
            >
              <Lock size={11} color="#059669" />
              <span style={{ fontFamily: 'var(--font-mono)' }}>wager.internal/journeys/C1041</span>
            </div>

            {/* Live Backend Telemetry Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#475569' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
                }}
              />
              <span className="hidden-mobile">
                {isBackendConnected ? '127.0.0.1:8000 · Live' : 'Buffer Mode'}
              </span>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div style={{ padding: '1.75rem' }}>
            {/* Preview Toolbar: Stitched Journey vs Fragmented Silos Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Journey Intelligence Simulation
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.015em' }}>
                  Cross-Channel Flagship Thread · Customer C1041
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9',
                  padding: '0.25rem',
                  borderRadius: '10px',
                  gap: '0.25rem',
                }}
              >
                <button
                  onClick={() => setActivePreviewMode('stitched')}
                  style={{
                    border: 'none',
                    padding: '0.4rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activePreviewMode === 'stitched' ? '#ffffff' : 'transparent',
                    color: activePreviewMode === 'stitched' ? '#0f172a' : '#64748b',
                    boxShadow: activePreviewMode === 'stitched' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <CheckCircle2 size={13} color="#059669" />
                  <span>With Wager (Stitched)</span>
                </button>

                <button
                  onClick={() => setActivePreviewMode('fragmented')}
                  style={{
                    border: 'none',
                    padding: '0.4rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activePreviewMode === 'fragmented' ? '#ffffff' : 'transparent',
                    color: activePreviewMode === 'fragmented' ? '#b45309' : '#64748b',
                    boxShadow: activePreviewMode === 'fragmented' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <AlertCircle size={13} color="#d97706" />
                  <span>Without Wager (Siloed)</span>
                </button>
              </div>
            </div>

            {/* Mode A: Stitched Bitemporal Journey */}
            {activePreviewMode === 'stitched' ? (
              <div>
                {/* 3 Unified Cross-Channel Milestones */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {/* Step 1: Web Touchpoint */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: '#0369a1' }}>
                        <Globe size={14} /> Web Session
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>10:02 AM</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                      Anonymous Dispute Opened
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.45 }}>
                      Dispute on <code>txn_88213</code> ($142.50) buffered under device token <code>tok_dev_4492a8</code> as an orphan event.
                    </div>
                  </div>

                  {/* Step 2: Mobile App Login */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: '#6d28d9' }}>
                        <Smartphone size={14} /> Mobile App
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>10:14 AM</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                      Late Identity Binding Claim
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.45 }}>
                      Biometric login executes. Wager emits retraction pair <code>(-) orphan</code> / <code>(+) C1041</code> to bind the web dispute retroactively.
                    </div>
                  </div>

                  {/* Step 3: Voice Call Context */}
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '1.125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: '#047857' }}>
                        <PhoneCall size={14} /> Voice Call
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#047857', fontFamily: 'var(--font-mono)' }}>10:19 AM</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#065f46' }}>
                      Full Context Inherited
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem', lineHeight: 1.45 }}>
                      Voice IVR assistant acknowledges: <em>"Calling about your $142.50 CloudScale dispute?"</em> Customer zero repetition.
                    </div>
                  </div>
                </div>

                {/* Stitched Journey Resolution Banner */}
                <div
                  style={{
                    padding: '1.125rem 1.25rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Database size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        Cross-Channel Journey Ready: Flagship Scenario
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        1 Disputed Charge ($142.50) · 3 Cross-Channel Touchpoints Stitched · 0 Data Collisions
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onLaunchDashboard}
                    style={{
                      padding: '0.55rem 1.125rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#090d16',
                      color: '#ffffff',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span>Launch Interactive Portal</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              /* Mode B: Fragmented Silos Illustration */
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  color: '#92400e',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.375rem' }}>
                  The Legacy Reality: 3 Disconnected Tickets & Frustrated Customers
                </div>
                <p style={{ fontSize: '0.8125rem', lineHeight: 1.55, maxWidth: '780px' }}>
                  Without bitemporal stitching, the web dispute vanishes into an unlinked orphan bin. When the customer logs into mobile, they see no open inquiry and file a duplicate. When they call support, the IVR agent has zero context and asks: <em>"Can you please explain your problem from the beginning?"</em>
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => setActivePreviewMode('stitched')}
                    style={{
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.875rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Switch back to Wager Stitched View
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Window Footer Prompt */}
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <span>Live bitemporal state hydrated in active memory</span>
            <span
              onClick={onLaunchDashboard}
              style={{
                fontWeight: 600,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Launch Interactive Portal <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </section>

      {/* 5. Three Core Pillars (Brevity & Substantive Technical Depth) */}
      <section
        ref={pillarsRef}
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '2rem 1.25rem 5.5rem 1.25rem',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.25rem',
              fontWeight: 500,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            Architectural Precision by Design
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.375rem' }}>
            Three non-negotiable guarantees that eliminate cross-channel amnesia.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Pillar 1: Bitemporal Store */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="card-interactive"
            onClick={onLaunchDashboard}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Database size={20} />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
              Bitemporal Store
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
              Decouples <code>valid_time</code> (customer reality) from <code>system_time</code> (store ingest). Never mutates past records; emits negative/positive retraction pairs for append-only auditability.
            </p>
          </div>

          {/* Pillar 2: Late Identity Binding */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="card-interactive"
            onClick={onLaunchDashboard}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <GitMerge size={20} />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
              Late Identity Binding
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
              Captures anonymous web touchpoints under hardware device fingerprints. Upon subsequent authentication via mobile or voice, orphan event chains are automatically claimed and bound.
            </p>
          </div>

          {/* Pillar 3: Multi-Intent Partitioning */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="card-interactive"
            onClick={onLaunchDashboard}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Split size={20} />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
              Multi-Intent Partitioning
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
              Disentangles concurrent user journeys (such as billing disputes alongside card limit requests) into isolated threads to prevent false repeat-contact alerts and timeline pollution.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Minimal High-End Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '2.5rem 1.5rem',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Wager Platform</span>
            <span style={{ color: '#cbd5e1' }}>·</span>
            <span>Canonical Customer Journey Event Protocol (CJEP v1)</span>
          </div>

          <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            <button
              onClick={onLaunchDashboard}
              style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Launch Interactive Portal →
            </button>
            <button
              onClick={() => setShowSpecModal(true)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Specification
            </button>
          </div>
        </div>
      </footer>

      {/* 7. CJEP Specification Modal with Syntax Highlighted Preview */}
      {showSpecModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setShowSpecModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Compass size={20} color="#059669" />
                <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#0f172a' }}>
                  Canonical Event Envelope (CJEP v1)
                </h3>
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>
                CJEP envelopes enforce complete decoupled bitemporality and cross-channel identity graph stitching across web, mobile apps, telephony voice bots, and agent dashboards.
              </p>

              {/* Code Preview Block with Copy Button */}
              <div style={{ position: 'relative' }}>
                <pre
                  style={{
                    backgroundColor: '#090d16',
                    color: '#e2e8f0',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(
                    {
                      protocol_version: '1.0',
                      event_id: 'evt_99b41a-281c',
                      event_type: 'dispute.submitted',
                      source: { channel: 'web', client_timestamp: '2026-09-27T10:02:14.201Z' },
                      valid_time: '2026-09-27T10:00:00.000Z',
                      ingest_time: '2026-09-27T10:02:14.288Z',
                      identifiers: { device_fingerprint: 'tok_dev_4492a8', session_id: 'sess_9918bc' },
                      subject: { identity_state: 'orphan', primary_customer_id: null },
                      payload: { case_id: 'DSP-88213', transaction_id: 'txn_88213', amount: 142.5, currency: 'USD' },
                    },
                    null,
                    2
                  )}
                </pre>
                <button
                  onClick={handleCopySpec}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {copiedCode ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowSpecModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSpecModal(false);
                    onLaunchDashboard();
                  }}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#090d16',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Launch Interactive Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
