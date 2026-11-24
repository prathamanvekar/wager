import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Key, ArrowRight, Lock } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { useSession, FLAGSHIP_CUSTOMER } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
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
  const { showToast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile>(FLAGSHIP_CUSTOMER);
  const [otpCode, setOtpCode] = useState('882149');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try { await login(selectedCustomer); }
    catch (error) { showToast({type: 'error', title: 'Could not sign in', message: error instanceof Error ? error.message : 'Reconnect and try again.'}); }
    finally { setIsSubmitting(false); }
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
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            color: 'var(--color-primary-hover)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-hover)', fontWeight: 600, marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} color="var(--color-primary)" />
            <span>Mon 10:47 Identity Binding Simulation</span>
          </div>
          <p style={{ lineHeight: 1.5 }}>
            Authenticating will bind this browser device (<code>{session.deviceId}</code>) and session (<code>{session.sessionId}</code>) to the selected customer, demonstrating how Wager retroactively claims prior orphan disputes.
          </p>
        </div>

        {/* Customer Profile Picker */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Select Customer Persona
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ALTERNATIVE_CUSTOMERS.map((cust) => {
              const isSelected = selectedCustomer.id === cust.id;
              return (
                <div
                  key={cust.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedCustomer(cust); } }}
                  onClick={() => setSelectedCustomer(cust)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 1px 3px 0 var(--bg-surface-subtle)' : '0 1px 2px 0 var(--bg-surface-subtle)',
                  }}
                  className="transition-smooth"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--channel-web-border)' : 'var(--bg-surface-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                      }}
                    >
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {cust.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {cust.id} · {cust.accountNumber} · phone: ···{cust.phoneSuffix}
                      </div>
                    </div>
                  </div>

                  {cust.id === 'C1041' && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary-hover)',
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        border: '1px solid var(--color-primary-border)',
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
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
            Two-Factor One-Time Password
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '0.875rem', color: 'var(--text-subtle)' }}>
              <Key size={16} />
            </div>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                letterSpacing: '0.2em',
                padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                outline: 'none',
                boxShadow: 'none',
              }}
              required
            />
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
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

