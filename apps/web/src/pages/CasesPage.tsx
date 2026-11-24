import React from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  Paperclip,
  Store,
  Layers,
} from 'lucide-react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { useSession } from '../context/SessionContext';
import type { DisputeCase } from '../types/cases';

interface CasesPageProps {
  cases: DisputeCase[];
  onSelectCase: (caseItem: DisputeCase) => void;
  onNewDispute: () => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({ cases, onSelectCase, onNewDispute }) => {
  const { session, isLoggedIn } = useSession();
  const hasLinkedCase = cases.some(c => !!c.associatedCustomerId);

  return (
    <div className="portal-page cases-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header and Primary Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            My Inquiries & Disputes
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            View all ongoing dispute cases, late identity binding statuses, and multi-channel journeys.
          </p>
        </div>

        <Button variant="primary" leftIcon={<FileText size={15} />} onClick={onNewDispute}>
          + File New Dispute
        </Button>
      </div>

      {/* Origin Status Notice Banner (Muted Alert Row) */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isLoggedIn ? (
            <ShieldCheck size={18} color="var(--color-primary)" />
          ) : (
            <AlertTriangle size={18} color="var(--state-orphan)" />
          )}
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
              {isLoggedIn
                ? `Customer Records Synchronized (${session.customer?.fullName})`
                : hasLinkedCase ? 'Earlier web inquiries connected from mobile' : 'Anonymous session - your inquiries are retained'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              {isLoggedIn
                ? `All cases in this session are associated with customer ID ${session.customer?.id} with full bitemporal audit history.`
                : hasLinkedCase ? 'Your linked conversations are available on mobile. This browser remains anonymous until you sign in.' : 'Start an inquiry here, then sign in or link this session from the mobile app to continue.'}
            </div>
          </div>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '9999px',
              backgroundColor: isLoggedIn ? 'var(--state-resolved-dot)' : 'var(--state-orphan-dot)',
              flexShrink: 0,
            }}
          />
          <span>{isLoggedIn ? `Synchronized (${session.customer?.id})` : hasLinkedCase ? 'Linked across channels' : 'Pending identity'}</span>
        </span>
      </div>

      {/* Cases List: ThePackengers Clean 3-Column Card Design */}
      {cases.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: 'var(--text-muted)',
              }}
            >
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
              No inquiries or disputes filed yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Select an unrecognized transaction from your account overview or launch a new dispute to emit your first canonical CJEP event.
            </p>
            <Button variant="primary" leftIcon={<FileText size={15} />} onClick={onNewDispute}>
              File a Transaction Dispute
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {cases.map((c) => {
            const isBound = !!c.associatedCustomerId;

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'none',
                  overflow: 'hidden',
                }}
              >
                {/* 1. Card Top Bar (ThePackengers Header) */}
                <div
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--bg-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Inquiry #{c.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: c.status === 'resolved' ? 'var(--color-primary-hover)' : 'var(--color-primary-hover)',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: c.status === 'resolved' ? 'var(--state-resolved-dot)' : 'var(--state-provisional-dot)',
                          flexShrink: 0,
                        }}
                      />
                      <span>{c.status === 'submitted' ? 'Processing' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
                    </span>
                    {c.anonymousOrigin && !isBound && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--state-orphan)', fontWeight: 500 }}>
                        · Device origin
                      </span>
                    )}
                    {isBound && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-hover)', fontWeight: 500 }}>
                        · Bound ({c.associatedCustomerId})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Thread: {c.threadHint}
                    </span>
                    <button
                      aria-label={`Actions for inquiry ${c.id}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Case actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* 2. 3-Column Body (ThePackengers Layout) */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.5rem',
                    borderBottom: '1px solid var(--bg-surface-hover)',
                  }}
                >
                  {/* Column 1: Journey Stepper & Valid Time */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <Clock size={13} />
                      <span>Submitted: {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>· Web Channel</span>
                    </div>

                    {/* Progress Stepper Visual Bar */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.375rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                        <span style={{ height: '2px', flex: 1, backgroundColor: 'var(--color-primary-border)' }} />
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isBound ? 'var(--color-primary)' : 'var(--state-orphan-dot)' }} />
                        <span style={{ height: '2px', flex: 1, backgroundColor: isBound ? 'var(--color-primary-border)' : 'var(--border-subtle)' }} />
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--border-medium)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        <span>Logged</span>
                        <span>{isBound ? 'Bound' : 'Pending Claim'}</span>
                        <span>Resolved</span>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-app)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {isBound ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-primary-hover)' }}>
                          <CheckCircle2 size={13} />
                          <span>Bound to customer {c.associatedCustomerId}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--state-orphan)' }}>
                          <Clock size={13} />
                          <span>Buffered under {c.originatingDeviceId.substring(0, 15)}...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Order Information */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Dispute Details
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                      <div
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-surface-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        <Store size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {c.merchant}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          Reason: {c.reason}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', marginTop: '0.125rem' }}>
                          txn: {c.transactionId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Amount & Event Journey Signals */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Financial Impact & Journey
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      ${c.amount.toFixed(2)} {c.currency}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Layers size={13} />
                        {c.timeline.length} timeline events
                      </span>
                      {c.attachments && c.attachments.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Paperclip size={13} />
                          {c.attachments.length} proofs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Card Footer Action Bar (ThePackengers style buttons) */}
                <div
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<FileText size={14} />}
                      onClick={() => onSelectCase(c)}
                    >
                      Review Case Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Clock size={14} />}
                      onClick={() => onSelectCase(c)}
                    >
                      View Timeline ({c.timeline.length})
                    </Button>
                  </div>

                  <button
                    onClick={() => onSelectCase(c)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>Open Thread</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

