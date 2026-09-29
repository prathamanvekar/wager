import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  FileText,
  LifeBuoy,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  LogOut,
  LogIn,
  Sliders,
  Clock,
  GitMerge,
  Database,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import { Button } from '../design-system/Button';
import { LoginModal } from './LoginModal';
import { IdentifiersBar } from './IdentifiersBar';
import type { ActiveTab } from './Navigation';

interface ShellProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNavigateToLanding?: () => void;
}

export const Shell: React.FC<ShellProps> = ({
  children,
  activeTab,
  onTabChange,
  onNavigateToLanding,
}) => {
  const { session, isLoggedIn, logout, openAuthModal } = useSession();
  const { isBackendConnected, orphanCount, events } = useEvents();
  const [isInspectorDrawerOpen, setIsInspectorDrawerOpen] = useState(false);
  const [isArchSpecsExpanded, setIsArchSpecsExpanded] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Home',
      description: 'Overview & Accounts',
      icon: <LayoutDashboard size={18} />,
      badge: null,
    },
    {
      id: 'cases' as ActiveTab,
      label: 'My Inquiries',
      description: 'Disputes & Timelines',
      icon: <FileText size={18} />,
      badge: (
        <span
          style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            fontSize: '0.6875rem',
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            fontWeight: 600,
            border: '1px solid #a7f3d0',
          }}
        >
          Active
        </span>
      ),
    },
    {
      id: 'support' as ActiveTab,
      label: 'Support Center',
      description: 'Multi-Intent Requests',
      icon: <LifeBuoy size={18} />,
      badge: null,
    },
    {
      id: 'inspector' as ActiveTab,
      label: 'Event Stream',
      description: 'CJEP Ingestion Feed',
      icon: <Layers size={18} />,
      badge: (
        <span
          style={{
            backgroundColor: orphanCount > 0 ? '#fffbeb' : '#ecfdf5',
            color: orphanCount > 0 ? '#b45309' : '#047857',
            fontSize: '0.6875rem',
            padding: '0.125rem 0.45rem',
            borderRadius: '9999px',
            fontWeight: 600,
            border: `1px solid ${orphanCount > 0 ? '#fde68a' : '#a7f3d0'}`,
          }}
        >
          {events.length}
        </span>
      ),
    },
  ];

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Home';
      case 'cases':
        return 'My inquiries';
      case 'support':
        return 'Support center';
      case 'inspector':
        return 'CJEP event stream';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 1. Left Sidebar Navigation (Workflex Style) */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
          flexShrink: 0,
        }}
        className="hidden-mobile"
      >
        {/* Brand header */}
        <div
          style={{
            padding: '1.5rem 1.25rem 1.25rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '8px',
              backgroundColor: '#059669', // Workflex emerald
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(5, 150, 105, 0.2)',
            }}
          >
            <Shield size={17} strokeWidth={2.4} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Wager
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Apex Customer Portal</div>
          </div>
        </div>

        {/* Navigation list */}
        <div style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', padding: '0.375rem 0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workspaces
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? '#ecfdf5' : 'transparent', // Workflex active green pill
                  color: isActive ? '#065f46' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ color: isActive ? '#059669' : '#64748b' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                    {item.label}
                  </span>
                </div>
                {item.badge}
              </button>
            );
          })}

          {/* Secondary Utilities Section */}
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', padding: '1rem 0.625rem 0.375rem 0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Tools
          </div>

          {/* Session Inspector Trigger */}
          <button
            onClick={() => setIsInspectorDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: '#475569',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Sliders size={16} color="#64748b" />
              <span>Session Inspector</span>
            </div>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isLoggedIn ? '#10b981' : '#f59e0b',
              }}
            />
          </button>

          {/* Architecture Specs Toggle */}
          <button
            onClick={() => setIsArchSpecsExpanded(!isArchSpecsExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: '#475569',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Database size={16} color="#64748b" />
              <span>Engine Specs</span>
            </div>
            {isArchSpecsExpanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
          </button>
        </div>

        {/* Sidebar Footer User Card */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '50%',
                  backgroundColor: isLoggedIn ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${isLoggedIn ? '#a7f3d0' : '#fde68a'}`,
                  color: isLoggedIn ? '#059669' : '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                }}
              >
                {isLoggedIn ? (session.customer?.fullName.charAt(0) || 'P') : <User size={15} />}
              </div>
              <div style={{ overflow: 'hidden', lineHeight: 1.2 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {isLoggedIn ? session.customer?.fullName : 'Anonymous Visitor'}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {isLoggedIn ? `${session.customer?.id} · ${session.customer?.tier}` : 'Device: tok_dev_...'}
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <button
                onClick={logout}
                title="Log Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.375rem',
                  borderRadius: '4px',
                }}
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                title="Sign In (C1041)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#059669',
                  cursor: 'pointer',
                  padding: '0.375rem',
                  borderRadius: '4px',
                }}
              >
                <LogIn size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Breadcrumb & Status Bar */}
        <header
          className="shell-top-header"
          style={{
            height: '60px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          {/* Left section: Mobile menu toggle & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open mobile navigation menu"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.375rem',
                cursor: 'pointer',
                color: '#0f172a',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs (Workflex style with Landing navigation) */}
            <nav aria-label="Breadcrumb">
              <ol style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', listStyle: 'none', margin: 0, padding: 0 }}>
                <li>
                  <span
                    style={{ color: '#64748b', cursor: 'pointer', transition: 'color 0.15s ease' }}
                    onClick={onNavigateToLanding || (() => onTabChange('overview'))}
                    title="Return to Landing Page"
                  >
                    Home
                  </span>
                </li>
                <li style={{ color: '#cbd5e1' }} aria-hidden="true">/</li>
                <li>
                  <span
                    style={{ color: '#64748b', cursor: 'pointer' }}
                    onClick={() => onTabChange('overview')}
                  >
                    Portal
                  </span>
                </li>
                <li style={{ color: '#cbd5e1' }} aria-hidden="true">/</li>
                <li>
                  <span style={{ color: '#0f172a', fontWeight: 600 }} aria-current="page">
                    {getBreadcrumbTitle()}
                  </span>
                </li>
              </ol>
            </nav>
          </div>

          {/* Right Header Utility Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {/* Live Backend Connection Indicator (Minimal Micro-Indicator) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#475569',
              }}
              title={isBackendConnected ? 'FastAPI bitemporal store running at 127.0.0.1:8000' : 'Backend offline, events buffered in memory'}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
                  flexShrink: 0,
                }}
              />
              <span>{isBackendConnected ? 'API Live (8000)' : 'Offline Queue'}</span>
            </div>

            {/* Session Inspector Trigger */}
            <button
              onClick={() => setIsInspectorDrawerOpen(true)}
              aria-label="Open Session Inspector drawer"
              aria-expanded={isInspectorDrawerOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer',
              }}
              title="Inspect hardware tokens and late identity binding state"
            >
              <Sliders size={13} color="#64748b" />
              <span>Session Inspector</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: session.identityState === 'resolved' ? '#10b981' : '#f59e0b',
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Primary Action Button (Workflex + Create Inquiry style) */}
            {!isLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LogIn size={14} />}
                onClick={openAuthModal}
              >
                Sign In (C1041)
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LogOut size={14} />}
                onClick={logout}
              >
                Log Out
              </Button>
            )}
          </div>
        </header>

        {/* Late Identity Binding Notification Toast / Bar */}
        <IdentifiersBar
          isOpen={isInspectorDrawerOpen}
          onClose={() => setIsInspectorDrawerOpen(false)}
        />

        {/* Page Content Container */}
        <main className="shell-main-canvas" style={{ flex: 1, padding: '2rem' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {children}
          </div>
        </main>

        {/* Expandable Architecture & Engine Specifications Drawer */}
        {isArchSpecsExpanded && (
          <section
            style={{
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              padding: '2rem',
              animation: 'slideUp 0.2s ease',
            }}
          >
            <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                    Wager Bitemporal Engine Specifications (CJEP v1)
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Production-grade event envelope architecture supporting out-of-order ingestion and immutable journey stitching.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsArchSpecsExpanded(false)}>
                  Close Specs
                </Button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                    <Clock size={16} color="#2563eb" />
                    <span>Two Time Dimensions</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                    Tracks <code>valid_time</code> (when customer experienced the event) and <code>system_time</code> (when learned). Retractions append negative/positive pairs without in-place edits.
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                    <GitMerge size={16} color="#d97706" />
                    <span>Late Identity Binding (F1)</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                    Actions performed while logged out are stored in the pending orphan buffer. Subsequent customer authentication triggers retroactive claim of previous weak device tokens.
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                    <Layers size={16} color="#059669" />
                    <span>Cross-Channel Unification</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                    Envelopes from Web, Mobile, Call Simulator, and Branch are ingested into a unified timeline with thread hint partitioning and intent classification.
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                    <Database size={16} color="#7c3aed" />
                    <span>Zero-Cloud Local Stack</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                    FastAPI ASGI backend running with in-memory fallback, live event streaming, and 100% reproducible cross-channel journey stitching.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Minimalist Footer */}
        <footer
          style={{
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            padding: '1rem 2rem',
            fontSize: '0.75rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <strong>Wager Portal</strong> · Cross-Channel Customer Journey System · Web Experience
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: 'var(--font-mono)' }}>
            <span>protocol: CJEP/1.0</span>
            <span>channel: web</span>
            <button
              onClick={() => setIsArchSpecsExpanded(!isArchSpecsExpanded)}
              aria-expanded={isArchSpecsExpanded}
              aria-label={isArchSpecsExpanded ? 'Hide Architecture Specifications drawer' : 'View Architecture Specifications drawer'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{isArchSpecsExpanded ? 'Hide Specs' : 'View Architecture Specs'}</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </footer>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileNavOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
          }}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            style={{
              width: '280px',
              maxWidth: '85%',
              height: '100%',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '8px',
                    backgroundColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Shield size={17} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Wager</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Apex Customer Portal</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Items */}
            <div style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', padding: '0.375rem 0.625rem', textTransform: 'uppercase' }}>
                Workspaces
              </div>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                      color: isActive ? '#065f46' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span style={{ color: isActive ? '#059669' : '#64748b' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge}
                  </button>
                );
              })}

              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', padding: '1rem 0.625rem 0.375rem 0.625rem', textTransform: 'uppercase' }}>
                System Tools
              </div>
              <button
                onClick={() => {
                  setIsInspectorDrawerOpen(true);
                  setIsMobileNavOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  color: '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Sliders size={16} color="#64748b" />
                  <span>Session Inspector</span>
                </div>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isLoggedIn ? '#10b981' : '#f59e0b',
                  }}
                />
              </button>
            </div>

            {/* Mobile Drawer Auth Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
              {!isLoggedIn ? (
                <Button
                  variant="primary"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  leftIcon={<LogIn size={14} />}
                  onClick={() => {
                    openAuthModal();
                    setIsMobileNavOpen(false);
                  }}
                >
                  Sign In (C1041)
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  leftIcon={<LogOut size={14} />}
                  onClick={() => {
                    logout();
                    setIsMobileNavOpen(false);
                  }}
                >
                  Sign Out ({session.customer?.id})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Phones <= 768px) */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          alignItems: 'center',
          zIndex: 35,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.15rem',
                height: '100%',
                background: 'none',
                border: 'none',
                color: isActive ? '#059669' : '#64748b',
                cursor: 'pointer',
                padding: '0.25rem',
                position: 'relative',
              }}
            >
              <span style={{ display: 'inline-flex', position: 'relative' }}>
                {item.icon}
                {item.id === 'inspector' && orphanCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-6px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                    }}
                  />
                )}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Customer Login Modal */}
      <LoginModal />
    </div>
  );
};

