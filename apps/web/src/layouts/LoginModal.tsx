import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Key, ArrowRight, Lock } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { useSession, FLAGSHIP_CUSTOMER } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import type { CustomerProfile } from '../types/session';

const ALTERNATIVE_CUSTOMERS: CustomerProfile[] = [
  FLAGSHIP_CUSTOMER,
  {
    id: 'C2094',
    fullName: 'Priya Sharma (Household Collision)',
    email: 'priya.sharma@apex.bank',
    phoneSuffix: '4410',
    tier: 'Standard',
    accountNumber: 'APEX-4410-1092',
    linkedDevicesCount: 1,
  },
  {
    id: 'C3819',
    fullName: 'David Vance',
    email: 'david.vance@apex.bank',
    phoneSuffix: '9920',
    tier: 'Private Client',
    accountNumber: 'APEX-9920-8801',
    linkedDevicesCount: 3,
  },
];

export const LoginModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, session } = useSession();
  const { emitEvent } = useEvents();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile>(FLAGSHIP_CUSTOMER);
  const [otpCode, setOtpCode] = useState('882149');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Emit CJEP v1 login event
      emitEvent(
        'web.login.completed',
        {
          customer_id: selectedCustomer.id,
          auth_method: 'password_otp',
          previous_anonymous_session_id: session.sessionId,
          device_fingerprint_claimed: session.deviceId,
        },
        {
          threadHint: 'customer_authentication',
        }
      );

      // 2. Transition session context to authenticated
      login(selectedCustomer);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title="Customer Authentication"
      subtitle="Sign in to simulate customer identity discovery and retroactive session binding (Flagship F1)"
      maxWidth="540px"
    >
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Scenario Info Box */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            color: '#1e40af',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8', fontWeight: 600, marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} color="#2563eb" />
            <span>Mon 10:47 Identity Binding Simulation</span>
          </div>
          <p style={{ lineHeight: 1.5 }}>
            Authenticating will bind this browser device (<code>{session.deviceId}</code>) and session (<code>{session.sessionId}</code>) to the selected customer, demonstrating how Wager retroactively claims prior orphan disputes.
          </p>
        </div>

        {/* Customer Profile Picker */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
            Select Customer Persona
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ALTERNATIVE_CUSTOMERS.map((cust) => {
              const isSelected = selectedCustomer.id === cust.id;
              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 1px 3px 0 rgba(37, 99, 235, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                  }}
                  className="transition-smooth"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#2563eb' : '#64748b',
                      }}
                    >
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                        {cust.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {cust.id} · {cust.accountNumber} · phone: ···{cust.phoneSuffix}
                      </div>
                    </div>
                  </div>

                  {cust.id === 'C1041' && (
                    <span
                      style={{
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      Flagship
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification OTP (Pre-filled for fast test execution) */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
            Two-Factor One-Time Password
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '0.875rem', color: '#94a3b8' }}>
              <Key size={16} />
            </div>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                color: '#0f172a',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                letterSpacing: '0.2em',
                padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
              }}
              required
            />
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
            Simulated OTP auto-filled for customer phone token (···{selectedCustomer.phoneSuffix})
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="ghost" onClick={closeAuthModal} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Lock size={15} />}
            rightIcon={<ArrowRight size={15} />}
          >
            Authenticate & Bind Identity
          </Button>
        </div>
      </form>
    </Modal>
  );
};

