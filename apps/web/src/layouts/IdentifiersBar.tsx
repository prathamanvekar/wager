import React, { useState } from 'react';
import { Smartphone, Hash, Network, CheckCircle2, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';

interface IdentifiersBarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const IdentifiersBar: React.FC<IdentifiersBarProps> = ({
  isOpen = false,
  onClose,
}) => {
  const { session, isLoggedIn, openAuthModal, bindingNotice, dismissBindingNotice } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);

  const showDrawer = isOpen || internalOpen;
  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* 1. Binding Notification Banner (Appears only on successful retroactive binding) */}
      {bindingNotice && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            borderBottom: '1px solid #a7f3d0',
            padding: '0.625rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            color: '#065f46',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>
              <strong>Late Identity Binding Successful:</strong> {bindingNotice}
            </span>
          </div>
          <button
            onClick={dismissBindingNotice}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#047857',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              textDecoration: 'underline',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Slide-Over Drawer for Session Inspector */}
      {showDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-inspector-title"
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 24px -2px rgba(15, 23, 42, 0.12)',
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#2563eb" />
                  <h3 id="session-inspector-title" style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                    Session Signals & Inspector
                  </h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Low-level device, network, and attribution tokens
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close session inspector"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Attribution Status Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isLoggedIn ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${isLoggedIn ? '#a7f3d0' : '#fde68a'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLoggedIn ? '#065f46' : '#92400e' }}>
                    ATTRIBUTION STATE
                  </span>
                  <Badge identityState={session.identityState} size="sm" />
                </div>
                <p style={{ fontSize: '0.8125rem', color: isLoggedIn ? '#047857' : '#78350f', lineHeight: 1.5 }}>
                  {isLoggedIn ? (
                    <>
                      Authenticated as <strong>{session.customer?.fullName}</strong> ({session.customer?.id}). Actions opened in this session resolve deterministically.
                    </>
                  ) : (
                    <>
                      Active as <strong>Anonymous Visitor</strong>. Events emitted are stored in the <code>pending_attribution</code> buffer as ORPHANS until authentication occurs.
                    </>
                  )}
                </p>
              </div>

              {/* Signals Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', letterSpacing: '0.04em' }}>
                  ACTIVE HARDWARE & SESSION SIGNALS
                </span>

                {/* Device Token */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <Smartphone size={13} />
                    <span>Browser Device Fingerprint (Weak Token)</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>
                    {session.deviceId}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Claimed and retroactively stitched upon customer login
                  </div>
                </div>

                {/* Session ID */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <Hash size={13} />
                    <span>Ephemeral Web Session ID</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>
                    {session.sessionId}
                  </div>
                </div>

                {/* Network IP Hash */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <Network size={13} />
                    <span>Salted Network Subnet Hash</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>
                    {session.ipHash}
                  </div>
                </div>
              </div>

              {/* Action */}
              {!isLoggedIn && (
                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <Button
                    variant="primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      handleClose();
                      openAuthModal();
                    }}
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Simulate Mon 10:47 Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

