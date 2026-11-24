import React, { useState } from 'react';
import {
  Clock,
  Code2,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  X,
  Layers,
  Fingerprint,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Radio,
  FileText,
  SlidersHorizontal,
  Info,
  Zap,
} from 'lucide-react';
import type { EventEnvelope, DisputePayload, MessagePayload, LoginPayload } from '../types/protocol';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';

interface EnvelopeInspectorProps {
  event: EventEnvelope;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const EnvelopeInspector: React.FC<EnvelopeInspectorProps> = ({
  event,
  onClose,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [viewMode, setViewMode] = useState<'structured' | 'json'>('structured');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyName ? null : prev));
    }, 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(event, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${event.event_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compute bitemporal delta
  const validMs = new Date(event.valid_time).getTime();
  const ingestMs = new Date(event.ingest_time).getTime();
  const deltaMs = ingestMs - validMs;
  const isLateArrival = deltaMs > 5000;
  const isSimulatedPast = deltaMs > 60000;

  const formatDelta = (ms: number): string => {
    const absMs = Math.abs(ms);
    if (absMs < 1000) return `+${absMs}ms`;
    const secs = (absMs / 1000).toFixed(1);
    if (absMs < 60000) return `+${secs}s`;
    const mins = Math.floor(absMs / 60000);
    const remSecs = Math.floor((absMs % 60000) / 1000);
    return `+${mins}m ${remSecs}s`;
  };

  const isDisputePayload = (p: unknown): p is DisputePayload => {
    return (
      typeof p === 'object' &&
      p !== null &&
      'amount' in p &&
      'merchant' in p &&
      'dispute_reason' in p
    );
  };

  const isMessagePayload = (p: unknown): p is MessagePayload => {
    return (
      typeof p === 'object' &&
      p !== null &&
      'message_id' in p &&
      'content' in p &&
      'sender_type' in p
    );
  };

  const isLoginPayload = (p: unknown): p is LoginPayload => {
    return (
      typeof p === 'object' &&
      p !== null &&
      'customer_id' in p &&
      'auth_method' in p
    );
  };

  // Tokenized Syntax Highlighted JSON
  const renderHighlightedJson = (obj: unknown) => {
    const jsonStr = JSON.stringify(obj, null, 2);
    const lines = jsonStr.split('\n');

    return (
      <div
        style={{
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-main)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          lineHeight: '1.6',
          overflowX: 'auto',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'table', width: '100%' }}>
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            return (
              <div key={idx} style={{ display: 'table-row' }}>
                <span
                  style={{
                    display: 'table-cell',
                    textAlign: 'right',
                    paddingRight: '1rem',
                    color: 'var(--text-secondary)',
                    userSelect: 'none',
                    width: '3rem',
                    borderRight: '1px solid var(--border-subtle)',
                  }}
                >
                  {lineNum}
                </span>
                <span
                  style={{
                    display: 'table-cell',
                    paddingLeft: '1rem',
                    whiteSpace: 'pre',
                  }}
                >
                  {colorizeLine(line)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const colorizeLine = (line: string): React.ReactNode => {
    // Regex matches keys, strings, numbers, booleans, null
    const tokenRegex = /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|([{}[\],])/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      const [fullMatch, stringToken, colonToken, boolNullToken, numberToken, punctToken] = match;

      if (stringToken) {
        if (colonToken) {
          // Object key
          elements.push(
            <span key={match.index} style={{ color: 'var(--syntax-key)', fontWeight: 600 }}>
              {stringToken}
            </span>
          );
          elements.push(
            <span key={match.index + '_colon'} style={{ color: 'var(--text-subtle)' }}>
              :
            </span>
          );
        } else {
          // String value
          elements.push(
            <span key={match.index} style={{ color: 'var(--syntax-string)' }}>
              {stringToken}
            </span>
          );
        }
      } else if (boolNullToken) {
        elements.push(
          <span
            key={match.index}
            style={{
              color: boolNullToken === 'null' ? 'var(--syntax-null)' : 'var(--syntax-boolean)',
              fontWeight: 600,
            }}
          >
            {boolNullToken}
          </span>
        );
      } else if (numberToken) {
        elements.push(
          <span key={match.index} style={{ color: 'var(--syntax-number)' }}>
            {numberToken}
          </span>
        );
      } else if (punctToken) {
        elements.push(
          <span key={match.index} style={{ color: 'var(--text-muted)' }}>
            {punctToken}
          </span>
        );
      } else {
        elements.push(fullMatch);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }

    return elements;
  };

  return (
    <div className="envelope-inspector"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isExpanded
          ? '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)'
          : '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        maxHeight: isExpanded ? '90vh' : 'calc(100vh - 12rem)',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid var(--channel-web-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            <Layers size={17} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.01em',
                }}
              >
                {event.event_type}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--channel-web)',
                  backgroundColor: 'var(--channel-web-bg)',
                  border: '1px solid var(--channel-web-border)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                }}
              >
                CJEP v{event.protocol_version}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginTop: '0.15rem',
              }}
            >
              <span>{event.event_id}</span>
              <button
                type="button"
                onClick={() => handleCopy(event.event_id, 'event_id')}
                aria-label="Copy event ID"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: copiedKey === 'event_id' ? 'var(--color-primary)' : 'var(--text-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                title="Copy Event ID"
              >
                {copiedKey === 'event_id' ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Window Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Tab Switcher */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '0.1875rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('structured')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3125rem',
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: viewMode === 'structured' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'structured' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: viewMode === 'structured' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Structured</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('json')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3125rem',
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: viewMode === 'json' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'json' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: viewMode === 'json' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Code2 size={13} />
              <span>Raw JSON</span>
            </button>
          </div>

          {/* Download JSON */}
          <button
            type="button"
            onClick={handleDownloadJson}
            title="Download Envelope JSON"
            aria-label="Download Envelope JSON"
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={14} />
          </button>

          {/* Toggle Expand */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              title={isExpanded ? 'Restore side drawer view' : 'Expand full screen view'}
              aria-label={isExpanded ? 'Restore side drawer' : 'Expand full view'}
              style={{
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close Inspector"
            aria-label="Close Inspector"
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Subheader Badges Bar */}
      <div
        style={{
          padding: '0.625rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Origin:</span>
        <Badge channel={event.source.channel} size="sm" />

        <span style={{ color: 'var(--border-medium)' }}>•</span>

        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Identity State:</span>
        <Badge identityState={event.subject.identity_state} size="sm" />

        {event.journey?.case_id && (
          <>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Case:</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--color-primary-hover)',
                backgroundColor: 'var(--color-primary-light)',
                padding: '0.125rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid var(--color-primary-border)',
              }}
            >
              {event.journey.case_id}
            </span>
          </>
        )}
      </div>

      {/* Main Body Content */}
      <div
        style={{
          padding: '1.25rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {viewMode === 'json' ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                CANONICAL ENVELOPE SCHEMA (v{event.protocol_version})
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={copiedKey === 'all_json' ? <Check size={13} color="var(--color-primary)" /> : <Copy size={13} />}
                onClick={() => handleCopy(JSON.stringify(event, null, 2), 'all_json')}
              >
                {copiedKey === 'all_json' ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            {renderHighlightedJson(event)}
          </div>
        ) : (
          /* STRUCTURED VISUAL VIEW */
          <>
            {/* 1. Bitemporal Dual-Clock Visualizer */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Bitemporal Dual Clock
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Zap size={11} color="var(--state-orphan-dot)" />
                  Two-dimensional timeline
                </span>
              </div>

              {/* Bitemporal Flow Diagram */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.875rem',
                }}
              >
                {/* Valid Time (Reality) */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--channel-web)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Valid Time (Reality)
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {new Date(event.valid_time).toLocaleTimeString()}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.125rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {new Date(event.valid_time).toLocaleDateString()}
                  </div>
                </div>

                {/* Center Ingest Delta Pill */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: isLateArrival ? 'var(--state-orphan-bg)' : 'var(--color-primary-light)',
                      border: `1px solid ${isLateArrival ? 'var(--state-orphan-border)' : 'var(--color-primary-border)'}`,
                      color: isLateArrival ? 'var(--state-orphan)' : 'var(--color-primary-hover)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>{formatDelta(deltaMs)}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--text-subtle)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isSimulatedPast
                      ? 'Late Arrival'
                      : isLateArrival
                      ? 'Buffer Latency'
                      : 'Sync Ingestion'}
                  </span>
                </div>

                {/* Ingest Time (System) */}
                <div style={{ textAlign: 'right', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Ingest Time (Store)
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {new Date(event.ingest_time).toLocaleTimeString()}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.125rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {new Date(event.ingest_time).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Explanatory callout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.625rem',
                }}
              >
                <Info size={13} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-subtle)' }} />
                <span>
                  Valid time records customer reality; Ingest time guarantees immutable auditability
                  even when network delay or out-of-order events occur.
                </span>
              </div>
            </div>

            {/* 2. Identity Graph & Late Binding Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Fingerprint size={15} color="var(--channel-mobile)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Identity Graph & Attribution
                  </span>
                </div>

                {event.subject.identity_state === 'resolved' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.6875rem',
                      color: 'var(--color-primary-hover)',
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={13} /> Graph Stitch Complete
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.6875rem',
                      color: 'var(--state-orphan)',
                      fontWeight: 600,
                    }}
                  >
                    <ShieldAlert size={13} /> Orphan (Weak Binding)
                  </span>
                )}
              </div>

              {/* Identity State Explainer Banner */}
              <div
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    event.subject.identity_state === 'resolved' ? 'var(--state-resolved-bg)' : 'var(--state-orphan-bg)',
                  border: `1px solid ${
                    event.subject.identity_state === 'resolved' ? 'var(--state-resolved-border)' : 'var(--state-orphan-border)'
                  }`,
                  fontSize: '0.75rem',
                  color:
                    event.subject.identity_state === 'resolved' ? 'var(--state-resolved)' : 'var(--state-orphan)',
                  marginBottom: '0.875rem',
                  lineHeight: '1.4',
                }}
              >
                {event.subject.identity_state === 'resolved' ? (
                  <div>
                    Bound to authenticated identity{' '}
                    <strong>{event.subject.customer_id || 'C1041'}</strong>. All previous anonymous
                    touchpoints associated with device <code>{event.identifiers.device_id.slice(0, 14)}...</code>{' '}
                    are stitched into this canonical journey.
                  </div>
                ) : (
                  <div>
                    This envelope was emitted anonymously. Wager is tracking this journey using the
                    device token. When the user logs in, this event will be retroactively bound to
                    their identity graph.
                  </div>
                )}
              </div>

              {/* Key Identifiers Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.625rem',
                }}
              >
                {/* Device Token */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>Hardware Device Token</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(event.identifiers.device_id, 'device_id')}
                      aria-label="Copy device ID"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedKey === 'device_id' ? 'var(--color-primary)' : 'var(--text-subtle)',
                      }}
                    >
                      {copiedKey === 'device_id' ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginTop: '0.2rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={event.identifiers.device_id}
                  >
                    {event.identifiers.device_id}
                  </div>
                </div>

                {/* Session ID */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>Session Instance</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(event.identifiers.session_id, 'session_id')}
                      aria-label="Copy session ID"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedKey === 'session_id' ? 'var(--color-primary)' : 'var(--text-subtle)',
                      }}
                    >
                      {copiedKey === 'session_id' ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginTop: '0.2rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={event.identifiers.session_id}
                  >
                    {event.identifiers.session_id}
                  </div>
                </div>

                {/* Customer ID */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Canonical Customer</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: event.subject.customer_id ? 'var(--text-main)' : 'var(--text-subtle)',
                      marginTop: '0.2rem',
                    }}
                  >
                    {event.subject.customer_id || 'None (Anonymous)'}
                  </div>
                </div>

                {/* IP Hash */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Network IP Hash</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginTop: '0.2rem',
                    }}
                  >
                    {event.identifiers.ip_hash || 'ip_anon_mask'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Journey & Provenance Context */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.75rem',
                }}
              >
                <Radio size={15} color="var(--color-primary)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Journey & Provenance Context
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.625rem',
                  fontSize: '0.75rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Channel Origin:</span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <Badge channel={event.source.channel} size="sm" />
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Application:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {event.source.application}
                  </div>
                </div>

                {event.journey?.case_id && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Linked Case ID:</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--color-primary-hover)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {event.journey.case_id}
                    </div>
                  </div>
                )}

                {event.journey?.thread_hint && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Thread Hint:</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {event.journey.thread_hint}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Business Domain Payload Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} color="var(--channel-call)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Domain Payload
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  typeof {event.event_type}
                </span>
              </div>

              {/* Case: Dispute Payload */}
              {isDisputePayload(event.payload) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Disputed Amount</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        ${event.payload.amount.toFixed(2)}{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {event.payload.currency}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Merchant</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {event.payload.merchant}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Reason:</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                        {event.payload.dispute_reason}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Transaction ID:</span>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          marginTop: '0.1rem',
                        }}
                      >
                        {event.payload.transaction_id}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>Dispute Status:</span>
                      <div style={{ marginTop: '0.1rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: 'var(--state-orphan)',
                            backgroundColor: 'var(--state-orphan-bg)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px',
                            border: '1px solid var(--state-orphan-border)',
                          }}
                        >
                          {event.payload.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {event.payload.customer_notes && (
                    <div
                      style={{
                        padding: '0.625rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Customer Notes:</span>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                        "{event.payload.customer_notes}"
                      </p>
                    </div>
                  )}
                </div>
              ) : isMessagePayload(event.payload) ? (
                /* Case: Message Payload */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Sender:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color: event.payload.sender_type === 'customer' ? 'var(--color-primary)' : 'var(--color-primary)',
                      }}
                    >
                      {event.payload.sender_type}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-main)',
                    }}
                  >
                    {event.payload.content}
                  </div>
                </div>
              ) : isLoginPayload(event.payload) ? (
                /* Case: Login Payload */
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.625rem',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Auth Mechanism:</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                      {event.payload.auth_method}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.625rem',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Customer ID:</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        marginTop: '0.1rem',
                      }}
                    >
                      {event.payload.customer_id}
                    </div>
                  </div>
                </div>
              ) : (
                /* Generic Key-Value Grid */
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.5rem',
                  }}
                >
                  {Object.entries(event.payload as Record<string, unknown>).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        padding: '0.5rem 0.625rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6875rem',
                        }}
                      >
                        {key}
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          marginTop: '0.15rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        {typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Info Bar */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <Cpu size={12} color="var(--text-muted)" />
          <span>Wager Bitemporal Engine v1.0.4</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          instance: {event.source.instance_id.slice(0, 16)}...
        </span>
      </div>
    </div>
  );
};
