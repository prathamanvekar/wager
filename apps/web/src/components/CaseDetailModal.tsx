import React, { useState } from 'react';
import { Clock, Send, Paperclip, AlertTriangle, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { useSession } from '../context/SessionContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
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
  const { showToast } = useToast();

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!caseItem) return null;

  // Current attribution belongs to the server, independently of whether
  // this particular browser is signed in or was claimed from mobile.
  const isNowBound = caseItem.anonymousOrigin && !!caseItem.associatedCustomerId;
  const effectiveCustomerId = caseItem.associatedCustomerId;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);

    try {
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
      await emitEvent(
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
    } catch (error) {
      setIsSending(false);
      showToast({type:'error',title:'Could not send message',message:error instanceof Error ? error.message : 'Please try again.'});
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Conversation ${caseItem.id.slice(-8).toUpperCase()}`}
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
              ? 'var(--color-primary-light)'
              : caseItem.anonymousOrigin
              ? 'var(--state-orphan-bg)'
              : 'var(--color-primary-light)',
            border: `1px solid ${
              isNowBound
                ? 'var(--color-primary-border)'
                : caseItem.anonymousOrigin
                ? 'var(--state-orphan-border)'
                : 'var(--color-primary-border)'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isNowBound || !caseItem.anonymousOrigin ? (
                <ShieldCheck size={18} color="var(--color-primary)" />
              ) : (
                <AlertTriangle size={18} color="var(--state-orphan)" />
              )}
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isNowBound || !caseItem.anonymousOrigin ? 'var(--color-primary-hover)' : 'var(--state-orphan)' }}>
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
              <Badge identityState={effectiveCustomerId ? 'resolved' : 'orphan'} size="sm">
                Current: {effectiveCustomerId ? 'Resolved' : 'Orphan'}
              </Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Customer ID:</span>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {effectiveCustomerId || 'Unattributed (Orphan)'}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Originating Device:</span>
              <div style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {caseItem.originatingDeviceId}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Thread Classification:</span>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {caseItem.threadHint}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
              <div style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {caseItem.transactionId}
              </div>
            </div>
          </div>

          {/* Quick Login trigger if logged out */}
          {!isLoggedIn && caseItem.anonymousOrigin && !isNowBound && (
            <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid var(--state-orphan-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--state-orphan)' }}>
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
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={15} color="var(--color-primary)" />
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
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ marginTop: '0.125rem' }}>
                  <Badge channel={evt.channel} size="sm" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {evt.title}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {evt.description}
                  </p>

                  <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', fontSize: '0.6875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Identity at emission: <strong style={{ color: evt.identityStateAtEmission === 'orphan' ? 'var(--state-orphan)' : 'var(--color-primary-hover)' }}>{evt.identityStateAtEmission}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Discussion & Follow-Up Messages */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={15} color="var(--color-primary)" />
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
                  backgroundColor: msg.sender === 'customer' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                  border: msg.sender === 'customer' ? '1px solid var(--color-primary-border)' : '1px solid var(--border-subtle)',
                  alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-hover)' }}>
                    {msg.senderName}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {msg.content}
                </p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div style={{ marginTop: '0.375rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {msg.attachments.map((att, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.6875rem',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
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
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                padding: '0.5625rem 0.875rem',
                outline: 'none',
                boxShadow: 'none',
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
