import React, { useState } from 'react';
import { Clock, Send, Paperclip, AlertTriangle, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import type { DisputeCase, CaseMessage, CaseTimelineEvent } from '../types/cases';

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: DisputeCase | null;
  onUpdateCase: (updatedCase: DisputeCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onUpdateCase,
}) => {
  const { session, isLoggedIn, openAuthModal } = useSession();
  const { emitEvent } = useEvents();

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!caseItem) return null;

  // Check if case was opened anonymously but current session is authenticated
  const isNowBound =
    caseItem.anonymousOrigin &&
    isLoggedIn &&
    (!caseItem.associatedCustomerId || caseItem.associatedCustomerId === session.customer?.id);

  const effectiveCustomerId = isLoggedIn ? session.customer?.id : caseItem.associatedCustomerId;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);

    setTimeout(() => {
      const now = new Date().toISOString();
      const messageId = `msg_${Date.now()}`;

      const messageObj: CaseMessage = {
        id: messageId,
        timestamp: now,
        sender: 'customer',
        senderName: isLoggedIn ? (session.customer?.fullName || 'Customer') : 'Anonymous Visitor',
        content: newMessage.trim(),
        identityStateAtEmission: session.identityState,
      };

      const timelineObj: CaseTimelineEvent = {
        id: `tl_${Date.now()}`,
        timestamp: now,
        title: 'Customer Message Sent',
        description: newMessage.trim(),
        channel: 'web',
        identityStateAtEmission: session.identityState,
        eventType: 'support.case.message_sent',
        actor: 'customer',
      };

      const updated: DisputeCase = {
        ...caseItem,
        messages: [...caseItem.messages, messageObj],
        timeline: [...caseItem.timeline, timelineObj],
        associatedCustomerId: effectiveCustomerId || null,
      };

      // Emit canonical event
      emitEvent(
        'support.case.message_sent',
        {
          case_id: caseItem.id,
          message_id: messageId,
          content: newMessage.trim(),
          sender_type: 'customer',
        },
        {
          caseId: caseItem.id,
          threadHint: caseItem.threadHint,
        }
      );

      onUpdateCase(updated);
      setNewMessage('');
      setIsSending(false);
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inquiry Details: ${caseItem.id}`}
      subtitle={`${caseItem.merchant} · $${caseItem.amount.toFixed(2)} ${caseItem.currency}`}
      maxWidth="700px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Identity Provenance & Binding Status Card */}
        <div
          style={{
            padding: '1.125rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isNowBound
              ? '#ecfdf5'
              : caseItem.anonymousOrigin
              ? '#fffbeb'
              : '#eff6ff',
            border: `1px solid ${
              isNowBound
                ? '#a7f3d0'
                : caseItem.anonymousOrigin
                ? '#fde68a'
                : '#bfdbfe'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isNowBound || !caseItem.anonymousOrigin ? (
                <ShieldCheck size={18} color="#059669" />
              ) : (
                <AlertTriangle size={18} color="#d97706" />
              )}
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isNowBound || !caseItem.anonymousOrigin ? '#065f46' : '#92400e' }}>
                {isNowBound
                  ? 'Retroactively Bound via Late Identity Engine'
                  : caseItem.anonymousOrigin
                  ? 'Orphan Attribution (Awaiting Customer Binding)'
                  : 'Authenticated Origin (Resolved)'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <Badge variant={caseItem.anonymousOrigin ? 'orphan' : 'resolved'} size="sm">
                Origin: {caseItem.anonymousOrigin ? 'Anonymous' : 'Authenticated'}
              </Badge>
              <Badge identityState={isLoggedIn ? 'resolved' : 'orphan'} size="sm">
                Current: {isLoggedIn ? 'Resolved' : 'Orphan'}
              </Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Customer ID:</span>
              <div style={{ color: '#0f172a', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {effectiveCustomerId || 'Unattributed (Orphan)'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Originating Device:</span>
              <div style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                {caseItem.originatingDeviceId}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Thread Classification:</span>
              <div style={{ color: '#0f172a', fontWeight: 600 }}>
                {caseItem.threadHint}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b' }}>Transaction Reference:</span>
              <div style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                {caseItem.transactionId}
              </div>
            </div>
          </div>

          {/* Quick Login trigger if logged out */}
          {!isLoggedIn && caseItem.anonymousOrigin && (
            <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#78350f' }}>
                Want to claim this dispute into your permanent customer record?
              </span>
              <Button size="sm" variant="primary" rightIcon={<ArrowRight size={13} />} onClick={openAuthModal}>
                Log In (Simulate Binding)
              </Button>
            </div>
          )}
        </div>

        {/* Multi-Channel Case Timeline */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={15} color="#2563eb" />
            <span>Case Progression & Event Timeline</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {caseItem.timeline.map((evt, idx) => (
              <div
                key={evt.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ marginTop: '0.125rem' }}>
                  <Badge channel={evt.channel} size="sm" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {evt.title}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p style={{ color: '#475569', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {evt.description}
                  </p>

                  <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', fontSize: '0.6875rem' }}>
                    <span style={{ color: '#64748b' }}>
                      Identity at emission: <strong style={{ color: evt.identityStateAtEmission === 'orphan' ? '#b45309' : '#047857' }}>{evt.identityStateAtEmission}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Discussion & Follow-Up Messages */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={15} color="#2563eb" />
            <span>Customer Messages & Communications</span>
          </h4>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              maxHeight: '180px',
              overflowY: 'auto',
              marginBottom: '0.875rem',
              paddingRight: '0.25rem',
            }}
          >
            {caseItem.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.sender === 'customer' ? '#eff6ff' : '#f8fafc',
                  border: msg.sender === 'customer' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8' }}>
                    {msg.senderName}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#0f172a', lineHeight: 1.4 }}>
                  {msg.content}
                </p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div style={{ marginTop: '0.375rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {msg.attachments.map((att, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.6875rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#475569',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Paperclip size={10} />
                        <span>{att}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* New message input */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a follow-up message to the support specialist..."
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                color: '#0f172a',
                fontSize: '0.875rem',
                padding: '0.5625rem 0.875rem',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isSending}
              leftIcon={<Send size={14} />}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
