import React from 'react';
import { Shield, User, LogIn, LogOut, RefreshCw, KeyRound, Globe, Server, CloudOff, UploadCloud } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';

export const AppHeader: React.FC = () => {
  const { session, isLoggedIn, logout, openAuthModal, rotateDevice } = useSession();
  const { isBackendConnected, offlineQueueCount, flushOfflineQueue } = useEvents();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(8, 13, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.25rem',
          gap: '1rem',
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', color: '#fff' }}>
                APEX
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-accent)',
                  backgroundColor: 'rgba(14, 165, 233, 0.12)',
                  padding: '0.125rem 0.375rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                }}
              >
                Wager Core
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Online Banking & Dispute Portal
            </p>
          </div>
        </div>

        {/* Channel Indicator, Live Backend Status, & Session Context Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Backend Connection Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              padding: '0.3125rem 0.625rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isBackendConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isBackendConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              color: isBackendConnected ? 'var(--state-resolved)' : 'var(--state-orphan)',
            }}
            title={isBackendConnected ? 'FastAPI backend active on port 8000' : 'Backend offline, events buffered in browser'}
          >
            {isBackendConnected ? <Server size={13} /> : <CloudOff size={13} />}
            <span>{isBackendConnected ? 'API Live (8000)' : 'Offline Queue'}</span>
          </div>

          {/* Offline Queue Flush Button if items pending */}
          {offlineQueueCount > 0 && (
            <Button
              size="sm"
              variant="amber"
              leftIcon={<UploadCloud size={13} />}
              onClick={() => flushOfflineQueue()}
              title="Flush buffered events to backend"
            >
              Flush ({offlineQueueCount})
            </Button>
          )}

          {/* Channel Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              padding: '0.3125rem 0.625rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--channel-web)',
            }}
          >
            <Globe size={14} />
            <span>Channel: <strong>Web</strong></span>
          </div>

          {/* Current Visitor / Customer Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
            }}
          >
            {isLoggedIn ? (
              <>
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--state-resolved)',
                  }}
                >
                  <User size={14} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {session.customer?.fullName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {session.customer?.id} · {session.customer?.tier}
                  </div>
                </div>
                <Badge identityState="resolved" size="sm" />
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--state-orphan)',
                  }}
                >
                  <KeyRound size={14} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Anonymous Visitor
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {session.sessionId.substring(0, 14)}...
                  </div>
                </div>
                <Badge identityState="orphan" size="sm" />
              </>
            )}
          </div>

          {/* Auth Action */}
          {isLoggedIn ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={14} />}
              onClick={logout}
              title="Sign out and return to anonymous visitor session"
            >
              Log Out
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<LogIn size={14} />}
              onClick={openAuthModal}
              title="Authenticate as customer (triggers late identity binding)"
            >
              Sign In (C1041)
            </Button>
          )}

          {/* Rotate Device simulation */}
          <button
            onClick={rotateDevice}
            title="Simulate switching to a different physical device"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
