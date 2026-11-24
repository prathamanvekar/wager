import React, { useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
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
  const { showToast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const caseId = `case_inq_${crypto.randomUUID()}`;

      const newCase: DisputeCase = {
        id: caseId,
        transactionId: isCreditLimit ? 'credit_line_8821' : isCardReplacement ? 'card_token_9941' : 'general_support',
        merchant: isCreditLimit ? 'Apex Credit Operations' : isCardReplacement ? 'Card Operations Support' : 'Apex Customer Support',
        amount: isCreditLimit ? parseFloat(requestedAmount) : 0,
        currency: 'USD',
        reason: isCreditLimit
          ? `Requested credit line increase to $${requestedAmount}`
          : isCardReplacement ? 'Expedited replacement card requested' : 'General assistance requested',
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
      await emitEvent(
        'support.inquiry.created',
        {
          case_id: caseId,
          intent_type: intentType,
          transaction_id: newCase.transactionId,
          merchant: newCase.merchant,
          dispute_reason: newCase.reason,
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
    } catch (error) {
      setIsSubmitting(false);
      showToast({type:'error',title:'Could not save your inquiry',message:error instanceof Error ? error.message : 'Please try again.'});
    }
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
            backgroundColor: 'var(--state-late-bg)',
            border: '1px solid var(--state-late-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--state-late)', fontWeight: 600, marginBottom: '0.25rem' }}>
            <Layers size={16} />
            <span>Independent Intent Thread</span>
          </div>
          <p style={{ lineHeight: 1.45 }}>
            This inquiry creates a distinct thread (<code>{threadHint}</code>) using its own case reference and intent classification. It will not be conflated with billing disputes on your account timeline.
          </p>
        </div>

        {/* Dynamic Fields */}
        {isCreditLimit ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                  Requested Total Limit (USD)
                </label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    padding: '0.5625rem 0.875rem',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                  Declared Annual Income (USD)
                </label>
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    padding: '0.5625rem 0.875rem',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                  required
                />
              </div>
            </div>
          </>
        ) : null}

        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
            Inquiry Details & Justification
          </label>
          <textarea
            value={inquiryNotes}
            onChange={(e) => setInquiryNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              padding: '0.625rem 0.75rem',
              outline: 'none',
              resize: 'vertical',
              boxShadow: 'none',
            }}
            required
          />
        </div>

        {/* Identity Context */}
        <div
          style={{
            backgroundColor: 'var(--bg-app)',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Customer Context:</span>
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
