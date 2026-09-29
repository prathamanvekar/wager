import React from 'react';
import { Layers, ArrowRight, CreditCard, ShieldAlert, MessageSquare } from 'lucide-react';
import { Card } from '../design-system/Card';

interface SupportPageProps {
  onStartInquiry: (intentType: 'credit_limit' | 'general' | 'card_replacement') => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ onStartInquiry }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Support Center
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
          Initiate new account inquiries and support communications across partitioned intent threads.
        </p>
      </div>

      {/* Concurrent Intent / Threading Note - Muted Clean Alert */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div style={{ padding: '0.375rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569' }}>
          <Layers size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
            Multi-Intent Disentanglement Engine
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.5 }}>
            In traditional systems, filing a dispute and contacting support simultaneously collapses both into one issue, triggering false repeat-contact alerts. Wager partitions concurrent user intents into isolated thread streams without crosstalk.
          </p>
        </div>
      </div>

      {/* Support Actions Grid: Interactive Card Surfaces without Repeated Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Credit Limit Increase */}
        <Card
          interactive
          onClick={() => onStartInquiry('credit_limit')}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Credit Line
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                    Credit Limit Request
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>
          }
          subtitle="Intent: credit_inquiry · Entity: account_credit"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Independent thread</span>
              <span style={{ fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Open inquiry →
              </span>
            </div>
          }
        >
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
            Submit a request to adjust your credit card limit from $10,000 to $25,000. Creates a concurrent thread separate from any billing disputes.
          </p>
        </Card>

        {/* Card 2: Lost or Damaged Card */}
        <Card
          interactive
          onClick={() => onStartInquiry('card_replacement')}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldAlert size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Card Services
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                    Card Replacement
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>
          }
          subtitle="Intent: card_replacement · Entity: card_token"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Expedited mailing</span>
              <span style={{ fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Request card →
              </span>
            </div>
          }
        >
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
            Report physical debit or credit card issues and request an expedited replacement to your registered mailing address.
          </p>
        </Card>

        {/* Card 3: General Support Chat */}
        <Card
          interactive
          onClick={() => onStartInquiry('general')}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageSquare size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Live Support
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                    General Assistance
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </div>
          }
          subtitle="Intent: general_support · Interactive Chat"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Real-time channel</span>
              <span style={{ fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Start chat →
              </span>
            </div>
          }
        >
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.55 }}>
            Open a direct secure chat channel with an Apex support specialist. Emits real-time support message events into the CJEP stream.
          </p>
        </Card>
      </div>
    </div>
  );
};
