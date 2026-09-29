import React, { useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import type { DisputeCase } from '../types/cases';

interface SupportInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  intentType: 'credit_limit' | 'general' | 'card_replacement' | null;
  onCaseCreated: (newCase: DisputeCase) => void;
}

export const SupportInquiryModal: React.FC<SupportInquiryModalProps> = ({
  isOpen,
  onClose,
  intentType,
  onCaseCreated,
}) => {
  const { session, isLoggedIn } = useSession();
  const { emitEvent } = useEvents();

  const [requestedAmount, setRequestedAmount] = useState('25000');
  const [annualIncome, setAnnualIncome] = useState('185000');
  const [inquiryNotes, setInquiryNotes] = useState(
    'Requesting an increase to $25,000 for upcoming business travel expenses.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !intentType) return null;

  const isCreditLimit = intentType === 'credit_limit';
  const isCardReplacement = intentType === 'card_replacement';

  const title = isCreditLimit
    ? 'Credit Limit Increase Request'
    : isCardReplacement
    ? 'Card Replacement Request'
    : 'Direct Banking Inquiry';

  const threadHint = isCreditLimit
    ? 'credit_inquiry'
    : isCardReplacement
    ? 'card_replacement'
    : 'general_support';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date().toISOString();
      const caseId = `case_inq_${Date.now().toString(36).substring(2, 7)}`;

      const newCase: DisputeCase = {
        id: caseId,
        transactionId: isCreditLimit ? 'credit_line_8821' : 'card_token_9941',
        merchant: isCreditLimit ? 'Apex Credit Operations' : 'Card Operations Support',
        amount: isCreditLimit ? parseFloat(requestedAmount) : 0,
        currency: 'USD',
        reason: isCreditLimit
          ? `Requested credit line increase to $${requestedAmount}`
          : 'Expedited replacement card requested',
        customerNotes: inquiryNotes,
        status: 'under_review',
        createdAt: now,
        threadHint,
        anonymousOrigin: !isLoggedIn,
        associatedCustomerId: session.customer?.id || null,
        originatingDeviceId: session.deviceId,
        originatingSessionId: session.sessionId,
        timeline: [
          {
            id: `evt_tl_${Date.now()}_init`,
            timestamp: now,
            title: `${title} Created`,
            description: `Customer submitted inquiry under thread classification: ${threadHint}. Origin: ${session.identityState}.`,
            channel: 'web',
            identityStateAtEmission: session.identityState,
            eventType: 'support.inquiry.created',
            actor: 'customer',
          },
        ],
        messages: [
          {
            id: `msg_${Date.now()}_init`,
            timestamp: now,
            sender: 'customer',
            senderName: isLoggedIn ? (session.customer?.fullName || 'Customer') : 'Anonymous Visitor',
            content: inquiryNotes,
            identityStateAtEmission: session.identityState,
          },
        ],
      };

      // Emit CJEP v1 event
      emitEvent(
        'support.inquiry.created',
        {
          case_id: caseId,
          intent_type: intentType,
          requested_limit: isCreditLimit ? parseFloat(requestedAmount) : undefined,
          annual_income: isCreditLimit ? parseFloat(annualIncome) : undefined,
          description: inquiryNotes,
          thread_hint: threadHint,
        },
        {
          caseId,
          threadHint,
        }
      );

      setIsSubmitting(false);
      onCaseCreated(newCase);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Intent: ${threadHint} · Entity: ${isCreditLimit ? 'credit_line' : 'card_token'}`}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Intent Threading Callout */}
        <div
          style={{
            backgroundColor: '#f5f3ff',
            border: '1px solid #ddd6fe',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            color: '#475569',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6d28d9', fontWeight: 600, marginBottom: '0.25rem' }}>
            <Layers size={16} />
            <span>Independent Intent Thread</span>
          </div>
          <p style={{ lineHeight: 1.45 }}>
            This inquiry creates a distinct thread (<code>{threadHint}</code>) using entity signals and sentence embeddings. It will not be conflated with billing disputes on your account timeline.
          </p>
        </div>

        {/* Dynamic Fields */}
        {isCreditLimit ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                  Requested Total Limit (USD)
                </label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    padding: '0.5625rem 0.875rem',
                    outline: 'none',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                  Declared Annual Income (USD)
                </label>
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    color: '#0f172a',
                    fontSize: '0.875rem',
                    padding: '0.5625rem 0.875rem',
                    outline: 'none',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
                  }}
                  required
                />
              </div>
            </div>
          </>
        ) : null}

        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
            Inquiry Details & Justification
          </label>
          <textarea
            value={inquiryNotes}
            onChange={(e) => setInquiryNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              color: '#0f172a',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              padding: '0.625rem 0.75rem',
              outline: 'none',
              resize: 'vertical',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
            }}
            required
          />
        </div>

        {/* Identity Context */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#64748b' }}>Customer Context:</span>
          <Badge identityState={session.identityState} size="sm">
            {isLoggedIn ? `Authenticated (${session.customer?.id})` : 'Anonymous (Orphan)'}
          </Badge>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight size={14} />}
          >
            Submit Inquiry Thread
          </Button>
        </div>
      </form>
    </Modal>
  );
};
