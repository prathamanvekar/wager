import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Upload, Paperclip, UserCheck } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import type { TransactionItem, DisputeCase } from '../types/cases';

interface DisputeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
  allTransactions?: TransactionItem[];
  onCaseCreated: (newCase: DisputeCase) => void;
}

const DISPUTE_REASONS = [
  {
    id: 'unrecognized_charge',
    label: 'Unrecognized Charge (Flagship Scenario)',
    description: 'I did not initiate or authorize this charge on my card or account.',
  },
  {
    id: 'duplicate_billing',
    label: 'Duplicate Billing',
    description: 'I was charged twice for the same purchase or subscription period.',
  },
  {
    id: 'canceled_subscription',
    label: 'Subscription Cancelled',
    description: 'I previously canceled this service, but the merchant billed me again.',
  },
  {
    id: 'incorrect_amount',
    label: 'Incorrect Amount Billed',
    description: 'The amount charged does not match my receipt or agreed terms.',
  },
];

export const DisputeWizard: React.FC<DisputeWizardProps> = ({
  isOpen,
  onClose,
  transaction,
  allTransactions = [],
  onCaseCreated,
}) => {
  const { session, isLoggedIn } = useSession();
  const { emitEvent } = useEvents();
  const { showToast } = useToast();

  const [activeTxn, setActiveTxn] = useState<TransactionItem | null>(transaction);

  React.useEffect(() => {
    if (transaction) {
      setActiveTxn(transaction);

    }
  }, [transaction]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState(DISPUTE_REASONS[0].id);
  const [customerNotes, setCustomerNotes] = useState(
    'I do not recognise this recurring charge. I checked my email receipts and have no active agreement with this vendor.'
  );
  const [attachments, setAttachments] = useState<string[]>([
    'cancellation_confirmation.pdf',
    'bank_statement_snippet.png',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeTxn) return null;

  const currentReasonObj = DISPUTE_REASONS.find((r) => r.id === selectedReason) || DISPUTE_REASONS[0];

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const caseId = `case_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      const newCase: DisputeCase = {
        id: caseId,
        transactionId: activeTxn.id,
        merchant: activeTxn.merchant,
        amount: activeTxn.amount,
        currency: activeTxn.currency,
        reason: currentReasonObj.label,
        customerNotes,
        attachments,
        status: 'submitted',
        createdAt: now,
        threadHint: 'billing_dispute',
        anonymousOrigin: !isLoggedIn,
        associatedCustomerId: session.customer?.id || null,
        originatingDeviceId: session.deviceId,
        originatingSessionId: session.sessionId,
        timeline: [
          {
            id: `evt_tl_${Date.now()}_init`,
            timestamp: now,
            title: 'Dispute Case Opened (Web Channel)',
            description: `Customer submitted dispute for $${activeTxn.amount.toFixed(2)} at ${activeTxn.merchant}. Origin: ${!isLoggedIn ? 'Anonymous (Orphan)' : 'Authenticated (C1041)'}.`,
            channel: 'web',
            identityStateAtEmission: session.identityState,
            eventType: 'support.dispute.created',
            actor: 'customer',
          },
        ],
        messages: [
          {
            id: `msg_${Date.now()}_init`,
            timestamp: now,
            sender: 'customer',
            senderName: isLoggedIn ? (session.customer?.fullName || 'Customer') : 'Anonymous Visitor',
            content: customerNotes,
            attachments,
            identityStateAtEmission: session.identityState,
          },
        ],
      };

      // Emit canonical CJEP v1 event
      await emitEvent(
        'support.dispute.created',
        {
          case_id: caseId,
          transaction_id: activeTxn.id,
          merchant: activeTxn.merchant,
          amount: activeTxn.amount,
          currency: activeTxn.currency,
          dispute_reason: currentReasonObj.label,
          customer_notes: customerNotes,
          attachment_count: attachments.length,
          attachments,
          anonymous_origin: !isLoggedIn,
          device_token: session.deviceId,
        },
        {
          caseId,
          threadHint: 'billing_dispute',
        }
      );

      setIsSubmitting(false);
      onCaseCreated(newCase);
      onClose();
      setStep(1);
    } catch (error) {
      setIsSubmitting(false);
      showToast({type:'error',title:'Could not save your inquiry',message:error instanceof Error ? error.message : 'Please try again.'});
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Transaction Dispute"
      subtitle={`Case reference: ${activeTxn.id} · ${activeTxn.merchant}`}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step Stepper Header (Workflex clean stepper) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.875rem',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step === 1 ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: step === 1 ? 600 : 500 }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 1 ? 'var(--color-primary)' : 'var(--bg-surface-hover)', color: step === 1 ? 'var(--bg-surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              1
            </span>
            <span>Transaction</span>
          </div>

          <span style={{ color: 'var(--border-medium)' }}>──</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step === 2 ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: step === 2 ? 600 : 500 }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 2 ? 'var(--color-primary)' : 'var(--bg-surface-hover)', color: step === 2 ? 'var(--bg-surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              2
            </span>
            <span>Reason</span>
          </div>

          <span style={{ color: 'var(--border-medium)' }}>──</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step === 3 ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: step === 3 ? 600 : 500 }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 3 ? 'var(--color-primary)' : 'var(--bg-surface-hover)', color: step === 3 ? 'var(--bg-surface)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              3
            </span>
            <span>Evidence</span>
          </div>
        </div>

        {/* STEP 1: Transaction Confirmation */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {allTransactions && allTransactions.length > 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Target Transaction
                </label>
                <select
                  aria-label="Select target transaction to dispute"
                  value={activeTxn.id}
                  onChange={(e) => {
                    const found = allTransactions.find((t) => t.id === e.target.value);
                    if (found) setActiveTxn(found);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5625rem 0.75rem',
                    fontSize: '0.8125rem',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                >
                  {allTransactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.merchant} (${t.amount.toFixed(2)} {t.currency}) {t.status ? `[${t.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Disputed Transaction
                  </span>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.125rem' }}>
                    {activeTxn.merchant}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Category: {activeTxn.category} · {activeTxn.location}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ${activeTxn.amount.toFixed(2)} {activeTxn.currency}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {activeTxn.id}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <span>Posted: {activeTxn.date}</span>
                <span>·</span>
                <span>Payment Method: Apex Premier Debit</span>
              </div>
            </div>

            {/* Late-Binding Context Notice */}
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isLoggedIn ? 'var(--color-primary-light)' : 'var(--state-orphan-bg)',
                border: `1px solid ${isLoggedIn ? 'var(--color-primary-border)' : 'var(--state-orphan-border)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.8125rem',
              }}
            >
              {isLoggedIn ? (
                <UserCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertTriangle size={18} color="var(--state-orphan)" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{ fontWeight: 600, color: isLoggedIn ? 'var(--color-primary-hover)' : 'var(--state-orphan)', marginBottom: '0.2rem' }}>
                  {isLoggedIn
                    ? `Authenticated User: ${session.customer?.fullName} (${session.customer?.id})`
                    : 'Unauthenticated Dispute Submission (Flagship F1)'}
                </div>
                <p style={{ color: isLoggedIn ? 'var(--color-primary-hover)' : 'var(--state-orphan)', lineHeight: 1.45 }}>
                  {isLoggedIn
                    ? 'This dispute will be immediately linked to your customer profile.'
                    : `You are opening this dispute logged out. It will be recorded with identity_state = 'orphan' and weak device token (${session.deviceId}). When you log in later, Wager will stitch this dispute retroactively!`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(2)}>
                Next: Choose Reason
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Dispute Reason */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Select the option that best describes the issue with this charge:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {DISPUTE_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <div
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 1px 3px 0 var(--bg-surface-subtle)' : '0 1px 2px 0 var(--bg-surface-subtle)',
                    }}
                    className="transition-smooth"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: isSelected ? 'var(--color-primary-hover)' : 'var(--text-main)', fontSize: '0.875rem' }}>
                        {reason.label}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color="var(--color-primary)" />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {reason.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <Button variant="ghost" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" rightIcon={<ArrowRight size={14} />} onClick={() => setStep(3)}>
                Next: Add Evidence
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Customer Explanation & Evidence Upload */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                Customer Statement / Explanation
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
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

            {/* Evidence Attachments */}
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                Supporting Evidence & Documentation
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                      <Paperclip size={13} color="var(--color-primary)" />
                      <span>{file}</span>
                    </div>
                    <button
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setAttachments([...attachments, `evidence_receipt_${Date.now().toString().slice(-4)}.pdf`])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-medium)',
                    background: 'var(--bg-surface)',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  <Upload size={13} />
                  <span>Attach Additional Proof / Receipt</span>
                </button>
              </div>
            </div>

            {/* Submission Summary Pill */}
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
              <span style={{ color: 'var(--text-muted)' }}>Attribution Mode:</span>
              <Badge identityState={session.identityState} size="sm">
                {isLoggedIn ? 'RESOLVED (C1041)' : 'ORPHAN BUFFERED'}
              </Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <Button variant="ghost" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant={isLoggedIn ? 'primary' : 'amber'}
                isLoading={isSubmitting}
                leftIcon={<ShieldAlert size={14} />}
                onClick={handleSubmit}
              >
                Submit Dispute Event
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
