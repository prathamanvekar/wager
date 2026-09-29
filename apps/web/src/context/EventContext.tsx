import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { EventEnvelope, IdentityState } from '../types/protocol';
import { useSession } from './SessionContext';
import { apiClient, type BackendHealth, type IngestResult } from '../services/api';

export interface EmittedEvent {
  envelope: EventEnvelope;
  timestamp: string;
  status: 'buffered' | 'emitted' | 'bound_retroactively' | 'queued_offline';
  backendResult?: IngestResult;
}

interface EventContextValue {
  events: EmittedEvent[];
  emitEvent: <T = Record<string, unknown>>(
    eventType: string,
    payload: T,
    options?: {
      caseId?: string;
      threadHint?: string;
      customValidTime?: string;
    }
  ) => Promise<EventEnvelope<T>>;
  clearEvents: () => void;
  orphanCount: number;
  resolvedCount: number;
  isBackendConnected: boolean;
  backendHealth: BackendHealth | null;
  checkBackendConnection: () => Promise<boolean>;
  flushOfflineQueue: () => Promise<number>;
  offlineQueueCount: number;
}

const EventContext = createContext<EventContextValue | null>(null);

function generateEventId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `evt_${ts}_${rand}`;
}

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const [events, setEvents] = useState<EmittedEvent[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  const checkBackendConnection = useCallback(async (): Promise<boolean> => {
    const health = await apiClient.checkHealth();
    if (health) {
      setIsBackendConnected(true);
      setBackendHealth(health);
      setOfflineQueueCount(apiClient.getOfflineQueue().length);
      return true;
    } else {
      setIsBackendConnected(false);
      setBackendHealth(null);
      setOfflineQueueCount(apiClient.getOfflineQueue().length);
      return false;
    }
  }, []);

  // Poll health and connect stream on mount
  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 5000);

    const unsubscribe = apiClient.connectStream((streamData) => {
      console.log('[SSE Stream] Received journey update:', streamData);
      checkBackendConnection();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [checkBackendConnection]);

  const emitEvent = async <T = Record<string, unknown>>(
    eventType: string,
    payload: T,
    options?: {
      caseId?: string;
      threadHint?: string;
      customValidTime?: string;
    }
  ): Promise<EventEnvelope<T>> => {
    const now = new Date().toISOString();
    const validTime = options?.customValidTime || now;
    const ingestTime = now;

    const currentIdentityState: IdentityState =
      session.authState === 'authenticated' ? 'resolved' : 'orphan';

    const envelope: EventEnvelope<T> = {
      protocol_version: '1.0',
      event_id: generateEventId(),
      event_type: eventType,
      source: {
        channel: 'web',
        application: 'customer-web',
        instance_id: session.sessionId,
      },
      valid_time: validTime,
      ingest_time: ingestTime,
      identifiers: {
        session_id: session.sessionId,
        device_id: session.deviceId,
        ip_hash: session.ipHash,
        customer_id: session.customer?.id || null,
        phone_suffix: session.customer?.phoneSuffix,
      },
      subject: {
        customer_id: session.customer?.id || null,
        identity_state: currentIdentityState,
      },
      journey: {
        case_id: options?.caseId,
        thread_hint: options?.threadHint,
      },
      payload,
    };

    // 1. Transmit to backend API
    const result = await apiClient.ingestEvent(envelope as unknown as EventEnvelope);

    // 2. Record in state
    setEvents((prev) => [
      {
        envelope: envelope as unknown as EventEnvelope,
        timestamp: now,
        status: result.status === 'queued_offline' ? 'queued_offline' : currentIdentityState === 'resolved' ? 'emitted' : 'buffered',
        backendResult: result,
      },
      ...prev,
    ]);

    setOfflineQueueCount(apiClient.getOfflineQueue().length);
    checkBackendConnection();

    return envelope;
  };

  const flushOfflineQueue = async (): Promise<number> => {
    const count = await apiClient.flushQueue();
    setOfflineQueueCount(apiClient.getOfflineQueue().length);
    checkBackendConnection();
    return count;
  };

  const clearEvents = () => setEvents([]);

  const orphanCount = events.filter((e) => e.envelope.subject.identity_state === 'orphan').length;
  const resolvedCount = events.filter((e) => e.envelope.subject.identity_state === 'resolved').length;

  return (
    <EventContext.Provider
      value={{
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
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export function useEvents(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return ctx;
}
