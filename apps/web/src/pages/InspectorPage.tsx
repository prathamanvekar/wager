import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Trash2,
  Clock,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  Activity,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { useEvents } from '../context/EventContext';
import { useSession } from '../context/SessionContext';
import { EnvelopeInspector } from '../components/EnvelopeInspector';
import type { EventEnvelope, ChannelType, IdentityState } from '../types/protocol';

export const InspectorPage: React.FC = () => {
  const {
    events,
    emitEvent,
    clearEvents,
    orphanCount,
    resolvedCount,
    isBackendConnected,
    backendHealth,
    checkBackendConnection,
    flushOfflineQueue,
    offlineQueueCount,
  } = useEvents();
  const { session } = useSession();

  const [selectedEvent, setSelectedEvent] = useState<EventEnvelope | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'healthy' | 'offline'>('idle');

  const simulateMenuRef = useRef<HTMLDivElement>(null);
  const healthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [identityFilter, setIdentityFilter] = useState<'all' | IdentityState>('all');

  useEffect(() => {
    return () => {
      if (healthTimeoutRef.current) {
        clearTimeout(healthTimeoutRef.current);
      }
    };
  }, []);

  // Close simulate menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (simulateMenuRef.current && !simulateMenuRef.current.contains(e.target as Node)) {
        setShowSimulateMenu(false);
      }
    };
    if (showSimulateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSimulateMenu]);

  const handleRefresh = async () => {
    if (healthTimeoutRef.current) {
      clearTimeout(healthTimeoutRef.current);
    }
    setIsRefreshing(true);
    setHealthStatus('checking');

    try {
      const isOnline = await checkBackendConnection();
      await flushOfflineQueue();
      setHealthStatus(isOnline ? 'healthy' : 'offline');
    } catch {
      setHealthStatus('offline');
    } finally {
      setIsRefreshing(false);
      healthTimeoutRef.current = setTimeout(() => {
        setHealthStatus('idle');
      }, 2500);
    }
  };

  // Keyboard shortcut: Escape closes inspector / modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsExpanded(false);
        } else if (selectedEvent) {
          setSelectedEvent(null);
        }
        setShowSimulateMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, selectedEvent]);

  // Quick Simulation emitters
  const handleSimulateDispute = async () => {
    setShowSimulateMenu(false);
    const caseNum = Math.floor(1000 + Math.random() * 9000);
    const envelope = await emitEvent(
      'dispute_submitted',
      {
        case_id: `DISP-2026-${caseNum}`,
        transaction_id: `tx_${Math.random().toString(36).substring(2, 9)}`,
        transaction_date: new Date().toISOString(),
        amount: 189.5,
        currency: 'USD',
        merchant: 'Uber Technologies Inc',
        category: 'Rideshare & Dining',
        dispute_reason: 'Duplicate billing on digital receipt',
        customer_notes: 'Was debited twice for the same ride home from downtown.',
        status: 'submitted',
      },
      {
        caseId: `DISP-2026-${caseNum}`,
        threadHint: `thread_dispute_${caseNum}`,
      }
    );
    setSelectedEvent(envelope);
  };

  const handleSimulatePageview = async () => {
    setShowSimulateMenu(false);
    const envelope = await emitEvent('portal_viewed', {
      route: '/inspector',
      navigation_source: 'dashboard_sidebar',
      viewport: '1440x900',
      client_timestamp: new Date().toISOString(),
    });
    setSelectedEvent(envelope);
  };

  const handleSimulateLateArrival = async () => {
    setShowSimulateMenu(false);
    // Backdated 2.5 hours ago to demonstrate bitemporal valid_time vs ingest_time difference
    const pastTime = new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString();
    const envelope = await emitEvent(
      'card_swipe_attempted',
      {
        pos_terminal: 'POS-TERM-NY-991',
        terminal_city: 'New York, NY',
        auth_result: 'declined_suspected_fraud',
        offline_buffered_duration_seconds: 9000,
        merchant: 'Luxury Boutiques NYC',
      },
      {
        customValidTime: pastTime,
        threadHint: 'late_telemetry_batch',
      }
    );
    setSelectedEvent(envelope);
  };

  const handleSimulateInquiry = async () => {
    setShowSimulateMenu(false);
    const envelope = await emitEvent(
      'support_inquiry_sent',
      {
        case_id: 'CASE-2026-4401',
        message_id: `msg_${Math.random().toString(36).substring(2, 8)}`,
        sender_type: 'customer',
        content: 'Could you please confirm if the provisional credit was applied to my balance?',
      },
      {
        caseId: 'CASE-2026-4401',
        threadHint: 'support_chat_thread',
      }
    );
    setSelectedEvent(envelope);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const env = evt.envelope;

      // Channel filter
      if (channelFilter !== 'all' && env.source.channel !== channelFilter) {
        return false;
      }

      // Identity state filter
      if (identityFilter !== 'all' && env.subject.identity_state !== identityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesType = env.event_type.toLowerCase().includes(q);
        const matchesId = env.event_id.toLowerCase().includes(q);
        const matchesCase = env.journey?.case_id?.toLowerCase().includes(q) || false;
        const matchesCustomer = env.subject.customer_id?.toLowerCase().includes(q) || false;
        const matchesDevice = env.identifiers.device_id.toLowerCase().includes(q);
        const matchesPayload = JSON.stringify(env.payload).toLowerCase().includes(q);

        if (!matchesType && !matchesId && !matchesCase && !matchesCustomer && !matchesDevice && !matchesPayload) {
          return false;
        }
      }

      return true;
    });
  }, [events, channelFilter, identityFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Page Header & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
              CJEP Event Stream & Inspector
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#475569',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
                  flexShrink: 0,
                }}
              />
              <span>{isBackendConnected ? 'API Live (8000)' : 'Local Buffer Mode'}</span>
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Deep inspection of canonical Customer Journey Event Protocol (CJEP v1) envelopes with bitemporal dual-clock telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', position: 'relative' }}>
          {/* Simulate Event Menu */}
          <div ref={simulateMenuRef} style={{ position: 'relative' }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              rightIcon={<ChevronDown size={13} />}
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
              aria-expanded={showSimulateMenu}
            >
              Simulate Event
            </Button>

            {showSimulateMenu && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 'calc(100% + 0.5rem)',
                  width: '260px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
                  zIndex: 50,
                  padding: '0.375rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#64748b',
                    padding: '0.375rem 0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Quick Envelopes
                </div>
                <button
                  type="button"
                  onClick={handleSimulateDispute}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: '#0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                  }}
                  className="hover:bg-slate-50"
                >
                  <span style={{ fontWeight: 600 }}>Dispute Submission</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    $189.50 Uber Eats transaction
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateLateArrival}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: '#0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                  }}
                  className="hover:bg-slate-50"
                >
                  <span style={{ fontWeight: 600 }}>Late-Arriving Event (2.5h)</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    Demonstrates bitemporal clock delta
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulatePageview}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: '#0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                  }}
                  className="hover:bg-slate-50"
                >
                  <span style={{ fontWeight: 600 }}>Web Interaction</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    Anonymous portal pageview
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateInquiry}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: '#0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                  }}
                  className="hover:bg-slate-50"
                >
                  <span style={{ fontWeight: 600 }}>Support Message</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    Case message payload
                  </span>
                </button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            style={
              healthStatus === 'healthy'
                ? { borderColor: '#86efac', backgroundColor: '#f0fdf4', color: '#166534', transition: 'all 0.2s ease' }
                : healthStatus === 'offline'
                ? { borderColor: '#fde68a', backgroundColor: '#fffbeb', color: '#b45309', transition: 'all 0.2s ease' }
                : { transition: 'all 0.2s ease' }
            }
            leftIcon={
              healthStatus === 'checking' ? (
                <RefreshCw size={14} className="animate-spin text-slate-500" />
              ) : healthStatus === 'healthy' ? (
                <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
              ) : healthStatus === 'offline' ? (
                <AlertCircle size={14} style={{ color: '#d97706' }} />
              ) : (
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              )
            }
            onClick={handleRefresh}
            disabled={healthStatus === 'checking'}
          >
            {healthStatus === 'checking'
              ? 'Checking Health...'
              : healthStatus === 'healthy'
              ? 'API Live (8000)'
              : healthStatus === 'offline'
              ? 'Local Buffer Mode'
              : 'Check API Health'}
          </Button>

          {offlineQueueCount > 0 && (
            <Button
              variant="amber"
              size="sm"
              leftIcon={<UploadCloud size={14} />}
              onClick={() => flushOfflineQueue()}
            >
              Flush Offline Queue ({offlineQueueCount})
            </Button>
          )}

          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={clearEvents}
            >
              Clear Feed
            </Button>
          )}
        </div>
      </div>

      {/* 2. Metrics & Telemetry Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Client Events Logged</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
            {events.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Canonical CJEP envelopes emitted
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#b45309', fontWeight: 500 }}>Pending Orphan Buffer</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b45309', marginTop: '0.25rem' }}>
            {backendHealth ? backendHealth.buffered_orphans : orphanCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem' }}>
            Awaiting late identity binding
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#047857', fontWeight: 500 }}>Resolved Attributions</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857', marginTop: '0.25rem' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.5rem' }}>
            Canonical customer graph bound
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Active Weak Token</div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0f172a',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.625rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={session.deviceId}
          >
            {session.deviceId}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Hardware fingerprint token
          </div>
        </div>
      </div>

      {/* 3. Search & Channel Filtering Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1rem',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search by event type, ID, case, or payload..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 2rem 0.45rem 2.25rem',
              fontSize: '0.8125rem',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Channel Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginRight: '0.25rem' }}>
              Channel:
            </span>
            {(['all', 'web', 'mobile', 'call'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: channelFilter === ch ? '#0f172a' : '#f8fafc',
                  borderColor: channelFilter === ch ? '#0f172a' : '#e2e8f0',
                  color: channelFilter === ch ? '#ffffff' : '#64748b',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {ch}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#e2e8f0', margin: '0 0.25rem' }} />

          {/* Identity State Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginRight: '0.25rem' }}>
              Identity:
            </span>
            {(['all', 'orphan', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setIdentityFilter(st)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: identityFilter === st ? '#0f172a' : '#f8fafc',
                  borderColor: identityFilter === st ? '#0f172a' : '#e2e8f0',
                  color: identityFilter === st ? '#ffffff' : '#64748b',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Result Count */}
          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
            }}
          >
            {filteredEvents.length} of {events.length}
          </span>
        </div>
      </div>

      {/* 4. Table & Side-by-Side Envelope Inspector Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedEvent && !isExpanded ? 'minmax(0, 1fr) 500px' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Table Container */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="#059669" />
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>
                Event Log Feed
              </span>
              <span
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '0.125rem 0.45rem',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}
              >
                {filteredEvents.length} items
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                POST /api/v1/events
              </span>
            </div>
          </div>

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b' }}>
              <Layers size={36} style={{ margin: '0 auto 0.75rem auto', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                No events emitted yet
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                Touchpoints in the portal or simulation emit canonical CJEP envelopes here. Test the inspector now:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <Button size="sm" variant="primary" leftIcon={<Sparkles size={14} />} onClick={handleSimulateDispute}>
                  Simulate Dispute Event
                </Button>
                <Button size="sm" variant="outline" onClick={handleSimulateLateArrival}>
                  Simulate Late Arrival
                </Button>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
              <Filter size={32} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                No events match your active filters
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                Try clearing search terms or selecting 'All' channels.
              </p>
              <Button
                size="sm"
                variant="outline"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setSearchQuery('');
                  setChannelFilter('all');
                  setIdentityFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: '700px',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      color: '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <th scope="col" style={{ padding: '0.625rem 1.25rem' }}>
                      Event Type & ID
                    </th>
                    <th scope="col" style={{ padding: '0.625rem 1rem' }}>
                      Channel
                    </th>
                    <th scope="col" style={{ padding: '0.625rem 1rem' }}>
                      Attribution State
                    </th>
                    <th scope="col" style={{ padding: '0.625rem 1rem' }}>
                      Valid Time (Reality)
                    </th>
                    <th scope="col" style={{ padding: '0.625rem 1rem' }}>
                      Ingestion Status
                    </th>
                    <th scope="col" style={{ padding: '0.625rem 1.25rem', textAlign: 'right' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => {
                    const isSelected = selectedEvent?.event_id === evt.envelope.event_id;
                    const isOffline = evt.status === 'queued_offline';

                    return (
                      <tr
                        key={evt.envelope.event_id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Inspect event ${evt.envelope.event_type} (${evt.envelope.event_id})`}
                        aria-expanded={isSelected}
                        onClick={() => setSelectedEvent(evt.envelope)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedEvent(evt.envelope);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        className="hover:bg-slate-50"
                      >
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                            {evt.envelope.event_type}
                          </div>
                          <div
                            style={{
                              fontSize: '0.6875rem',
                              color: '#94a3b8',
                              fontFamily: 'var(--font-mono)',
                              marginTop: '0.1rem',
                            }}
                          >
                            {evt.envelope.event_id}
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <Badge channel={evt.envelope.source.channel} size="sm" />
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          <Badge identityState={evt.envelope.subject.identity_state} size="sm" />
                        </td>

                        <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} color="#94a3b8" />
                            <span>{new Date(evt.envelope.valid_time).toLocaleTimeString()}</span>
                          </div>
                        </td>

                        <td style={{ padding: '0.875rem 1rem' }}>
                          {isOffline ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            >
                              Queued Offline
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              <CheckCircle2 size={11} /> Ingested
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                          <Button
                            size="sm"
                            variant={isSelected ? 'primary' : 'ghost'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt.envelope);
                            }}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side-by-Side Envelope Inspector (Standard View) */}
        {selectedEvent && !isExpanded && (
          <div
            style={{
              position: 'sticky',
              top: '5rem',
            }}
          >
            <EnvelopeInspector
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              isExpanded={false}
              onToggleExpand={() => setIsExpanded(true)}
            />
          </div>
        )}
      </div>

      {/* Full-Screen Focus Modal (Expanded View) */}
      {selectedEvent && isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Envelope Full Inspector"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsExpanded(false);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              height: '90vh',
              animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <EnvelopeInspector
              event={selectedEvent}
              onClose={() => {
                setIsExpanded(false);
                setSelectedEvent(null);
              }}
              isExpanded={true}
              onToggleExpand={() => setIsExpanded(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
