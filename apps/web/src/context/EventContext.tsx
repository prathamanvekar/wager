import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { EventEnvelope, IdentityState } from "../types/protocol";
import type { DisputeCase, TransactionItem } from "../types/cases";
import { useSession } from "./SessionContext";
import {
  apiClient,
  type BackendHealth,
  type IngestResult,
} from "../services/api";
export interface EmittedEvent {
  envelope: EventEnvelope;
  timestamp: string;
  status: "buffered" | "emitted" | "bound_retroactively" | "queued_offline";
  backendResult?: IngestResult;
  currentIdentityState?: IdentityState;
}
interface Value {
  events: EmittedEvent[];
  cases: DisputeCase[];
  transactions: TransactionItem[];
  emitEvent: <T = Record<string, unknown>>(
    type: string,
    payload: T,
    options?: {
      caseId?: string;
      threadHint?: string;
      customValidTime?: string;
    },
  ) => Promise<EventEnvelope<T>>;
  clearEvents: () => void;
  orphanCount: number;
  resolvedCount: number;
  isBackendConnected: boolean;
  backendHealth: BackendHealth | null;
  checkBackendConnection: () => Promise<boolean>;
  flushOfflineQueue: () => Promise<number>;
  offlineQueueCount: number;
  refresh: () => Promise<void>;
  syncError: string | null;
}
const EventContext = createContext<Value | null>(null);
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isReady, session } = useSession();
  const [events, setEvents] = useState<EmittedEvent[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [caseScope, setCaseScope] = useState("");
  const scope = JSON.stringify([
    session.sessionId,
    session.customer?.id || null,
  ]);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [offlineQueueCount, setQueueCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hidden = useRef(new Set<string>());
  const refreshing = useRef<Promise<void> | null>(null);
  const checkBackendConnection = useCallback(async () => {
    const h = await apiClient.checkHealth();
    setHealth(h);
    setQueueCount(apiClient.getOfflineQueue().length);
    return !!h;
  }, []);
  const refresh = useCallback(async () => {
    if (!isReady) return;
    if (refreshing.current) return refreshing.current;
    refreshing.current = (async () => {
      const serverSession = apiClient.getSession();
      const requestScope = JSON.stringify([
        serverSession?.session_id,
        serverSession?.customer_id || null,
      ]);
      const h = await apiClient.checkHealth();
      setHealth(h);
      if (!h) return;
      try {
        await apiClient.flushQueue();
        const [raw, sharedCases, retractions, txns] = await Promise.all([
          apiClient.fetchEvents(),
          apiClient.fetchCases(),
          apiClient.fetchRetractions(),
          apiClient.fetchTransactions(),
        ]);
        const revised = new Map(
          retractions.map((r) => [r.event_id, r.new_state.identity_state]),
        );
        const current = apiClient.getSession();
        if (
          requestScope !==
          JSON.stringify([current?.session_id, current?.customer_id || null])
        )
          return;
        setCases(sharedCases);
        setTransactions(txns);
        setCaseScope(requestScope);
        const pending = apiClient.getOfflineQueue();
        const ids = new Set(raw.map((e) => e.event_id));
        setEvents([
          ...pending
            .filter((e) => !ids.has(e.event_id))
            .map((envelope) => ({
              envelope,
              timestamp: envelope.valid_time,
              status: "queued_offline" as const,
            })),
          ...raw
            .filter((e) => !hidden.current.has(e.event_id))
            .map((envelope) => ({
              envelope,
              timestamp: envelope.ingest_time,
              status: "emitted" as const,
              currentIdentityState: (revised.get(envelope.event_id) ||
                envelope.subject.identity_state) as IdentityState,
            })),
        ]);
        setSyncError(null);
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : "Could not synchronize your journey.",
        );
      }
      setQueueCount(apiClient.getOfflineQueue().length);
    })();
    try {
      await refreshing.current;
    } finally {
      refreshing.current = null;
    }
  }, [isReady]);
  useEffect(() => {
    if (!isReady) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const stream = new EventSource(apiClient.getBaseUrl() + "/stream");
    stream.onmessage = () => void refresh();
    const foreground = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", foreground);
    window.addEventListener("online", foreground);
    return () => {
      clearInterval(timer);
      stream.close();
      document.removeEventListener("visibilitychange", foreground);
      window.removeEventListener("online", foreground);
    };
  }, [isReady, session.customer?.id, refresh]);
  const emitEvent = useCallback(
    async <T,>(
      type: string,
      payload: T,
      options?: {
        caseId?: string;
        threadHint?: string;
        customValidTime?: string;
      },
    ) => {
      const { envelope, result } = await apiClient.emit(type, payload, options);
      setEvents((prev) => [
        {
          envelope: envelope as EventEnvelope,
          timestamp: envelope.valid_time,
          status: result.online ? "emitted" : "queued_offline",
          backendResult: result,
        },
        ...prev.filter((e) => e.envelope.event_id !== envelope.event_id),
      ]);
      setQueueCount(apiClient.getOfflineQueue().length);
      await refresh();
      return envelope;
    },
    [refresh],
  );
  const flushOfflineQueue = async () => {
    const count = await apiClient.flushQueue();
    await refresh();
    return count;
  };
  return (
    <EventContext.Provider
      value={{
        events,
        cases: caseScope === scope ? cases : [],
        transactions: caseScope === scope ? transactions : [],
        emitEvent,
        clearEvents: () => {
          events.forEach((e) => hidden.current.add(e.envelope.event_id));
          setEvents([]);
        },
        orphanCount:
          health?.buffered_orphans ??
          events.filter((e) => e.currentIdentityState === "orphan").length,
        resolvedCount: events.filter(
          (e) =>
            (e.currentIdentityState || e.envelope.subject.identity_state) ===
            "resolved",
        ).length,
        isBackendConnected: !!health,
        backendHealth: health,
        checkBackendConnection,
        flushOfflineQueue,
        offlineQueueCount,
        refresh,
        syncError,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
export function useEvents() {
  const value = useContext(EventContext);
  if (!value) throw new Error("EventProvider is required");
  return value;
}
