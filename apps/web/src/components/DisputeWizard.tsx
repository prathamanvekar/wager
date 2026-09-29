import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Upload, Paperclip, UserCheck } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
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

  const [activeTxn, setActiveTxn] = useState<TransactionItem | null>(transaction);

  React.useEffect(() => {
    if (transaction) {
      setActiveTxn(transaction);
    } else if (allTransactions && allTransactions.length > 0) {
      setActiveTxn(allTransactions[0]);
    }
  }, [transaction, allTransactions]);

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

  const handleSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const caseId = `case_${activeTxn.id.replace('txn_', '')}`;
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
      emitEvent(
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
    }, 400);
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
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '0.875rem',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step === 1 ? '#059669' : '#64748b', fontWeight: step === 1 ? 600 : 500 }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 1 ? '#059669' : '#f1f5f9', color: step === 1 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              1
            </span>
            <span>Transaction</span>
          </div>

          <span style={{ color: '#cbd5e1' }}>──</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step === 2 ? '#059669' : '#64748b', fontWeight: step === 2 ? 600 : 500 }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 2 ? '#059669' : '#f1f5f9', color: step === 2 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
              2
            </span>
            <span>Reason</span>
          </div>

          <span style={{ color: '#cbd5e1' }}>──</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step === 3 ? '#059669' : '#64748b', fontWeight: step === 3 ? 600 : 500 }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 3 ? '#059669' : '#f1f5f9', color: step === 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
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
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
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
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                >
                  {allTransactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {t.merchant} (${t.amount.toFixed(2)} {t.currency}) {t.status ? `[${t.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Disputed Transaction
                  </span>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', marginTop: '0.125rem' }}>
                    {activeTxn.merchant}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Category: {activeTxn.category} · {activeTxn.location}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    ${activeTxn.amount.toFixed(2)} {activeTxn.currency}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {activeTxn.id}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
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
                backgroundColor: isLoggedIn ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${isLoggedIn ? '#a7f3d0' : '#fde68a'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.8125rem',
              }}
            >
              {isLoggedIn ? (
                <UserCheck size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{ fontWeight: 600, color: isLoggedIn ? '#065f46' : '#92400e', marginBottom: '0.2rem' }}>
                  {isLoggedIn
                    ? `Authenticated User: ${session.customer?.fullName} (${session.customer?.id})`
                    : 'Unauthenticated Dispute Submission (Flagship F1)'}
                </div>
                <p style={{ color: isLoggedIn ? '#047857' : '#78350f', lineHeight: 1.45 }}>
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
            <p style={{ fontSize: '0.875rem', color: '#475569' }}>
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
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 1px 3px 0 rgba(37,99,235,0.08)' : '0 1px 2px 0 rgba(0,0,0,0.02)',
                    }}
                    className="transition-smooth"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: isSelected ? '#1d4ed8' : '#0f172a', fontSize: '0.875rem' }}>
                        {reason.label}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color="#2563eb" />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
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
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                Customer Statement / Explanation
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
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

            {/* Evidence Attachments */}
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
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
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                      <Paperclip size={13} color="#2563eb" />
                      <span>{file}</span>
                    </div>
                    <button
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
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
                    border: '1px dashed #cbd5e1',
                    background: '#ffffff',
                    color: '#2563eb',
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
              <span style={{ color: '#64748b' }}>Attribution Mode:</span>
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
