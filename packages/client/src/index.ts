import type {
  CallState,
  BackendHealth,
  CustomerProfile,
  DisputeCase,
  EventEnvelope,
  Handoff,
  IngestResult,
  ServerSession,
  SessionCredentials,
} from "../../contracts/src";
export type { BackendHealth, IngestResult } from "../../contracts/src";
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
let randomSource: (() => string) | undefined;
export function configureRandomSource(source: () => string) {
  randomSource = source;
}
export function newId(prefix: string): string {
  if (randomSource) return `${prefix}_${randomSource().replace(/-/g, "")}`;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}_${cryptoApi.randomUUID().replace(/-/g, "")}`;
  if (cryptoApi?.getRandomValues) {
    const data = cryptoApi.getRandomValues(new Uint8Array(16));
    return `${prefix}_${Array.from(data, (x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  throw new Error("A secure random number generator is required.");
}
export class WagerClient {
  private credentials: SessionCredentials | null = null;
  private connecting: Promise<ServerSession> | null = null;
  private flushing: Promise<number> | null = null;
  private queue: EventEnvelope[] = [];
  private queueLoaded = false;
  private online = false;
  private storageChain: Promise<void> = Promise.resolve();
  private readonly sessionKey: string;
  private readonly queueKey: string;
  private baseUrl: string;
  private storage: StorageAdapter;
  private secureStorage: StorageAdapter;
  constructor(
    baseUrl: string,
    storage: StorageAdapter,
    secureStorage: StorageAdapter = storage,
  ) {
    this.storage = storage;
    this.secureStorage = secureStorage;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    // Isolate credentials and pending writes between configured backends.
    const namespace = encodeURIComponent(this.baseUrl).replace(/%/g, "_");
    this.sessionKey = `wager.session.${namespace}`;
    this.queueKey = `wager.queue.${namespace}`;
  }
  getBaseUrl() {
    return this.baseUrl;
  }
  getSession() {
    return this.credentials?.session ?? null;
  }
  getIsOnline() {
    return this.online;
  }
  getOfflineQueue() {
    return [...this.queue];
  }
  private async request<T>(
    path: string,
    options: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authenticated && this.credentials)
        headers.Authorization = `Bearer ${this.credentials.access_token}`;
      const response = await fetch(this.baseUrl + path, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      });
      this.online = true;
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError(
          typeof data.detail === "string"
            ? data.detail
            : `Request failed (${response.status})`,
          response.status,
        );
      }
      return (await response.json()) as T;
    } catch (e) {
      if (!(e instanceof ApiError)) this.online = false;
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }
  async connect(identity: {
    device_id: string;
    session_id: string;
    channel: "web" | "mobile" | "call";
  }): Promise<ServerSession> {
    if (this.credentials) return this.credentials.session;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      if (!this.queueLoaded) {
        const raw = await this.storage.getItem(this.queueKey);
        this.queue = raw ? JSON.parse(raw) : [];
        this.queueLoaded = true;
      }
      const saved = await this.secureStorage.getItem(this.sessionKey);
      if (saved) {
        this.credentials = JSON.parse(saved);
        try {
          const s = await this.request<ServerSession>("/sessions/me");
          this.credentials!.session = s;
          return s;
        } catch (error) {
          // Keep credentials on transport failure: offline work must retain its owner.
          if (!(error instanceof ApiError)) return this.credentials!.session;
          if (error.status !== 401) throw error;
          this.credentials = null;
          if (this.queue.length)
            throw new Error(
              "Your session expired with pending messages. Keep this device state and reconnect before signing in again.",
            );
        }
      }
      this.credentials = await this.request<SessionCredentials>(
        "/sessions",
        {
          method: "POST",
          body: JSON.stringify({ ...identity, session_id: newId("ses") }),
        },
        false,
      );
      await this.secureStorage.setItem(
        this.sessionKey,
        JSON.stringify(this.credentials),
      );
      return this.credentials.session;
    })();
    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }
  async login(customerId: string): Promise<CustomerProfile> {
    if (this.queue.length) await this.flushQueue();
    if (this.queue.length)
      throw new Error(
        "Reconnect to send your pending actions before signing in.",
      );
    const data = await this.request<{
      session: ServerSession;
      customer: CustomerProfile;
    }>("/sessions/login", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId }),
    });
    this.credentials!.session = data.session;
    await this.secureStorage.setItem(
      this.sessionKey,
      JSON.stringify(this.credentials),
    );
    return data.customer;
  }
  async logout(): Promise<void> {
    if (this.queue.length)
      throw new Error("Reconnect to send pending actions before signing out.");
    await this.request("/sessions/logout", { method: "POST" });
    this.credentials = null;
    await this.secureStorage.removeItem(this.sessionKey);
  }
  async customers() {
    return this.request<CustomerProfile[]>("/customers", {}, false);
  }
  async checkHealth(): Promise<BackendHealth | null> {
    try {
      return await this.request<BackendHealth>("/health", {}, false);
    } catch {
      return null;
    }
  }
  private saveQueue(): Promise<void> {
    const snapshot = JSON.stringify(this.queue);
    this.storageChain = this.storageChain
      .catch(() => {})
      .then(() => this.storage.setItem(this.queueKey, snapshot));
    return this.storageChain;
  }
  makeEvent<T>(
    eventType: string,
    payload: T,
    options?: {
      caseId?: string;
      threadHint?: string;
      customValidTime?: string;
    },
  ): EventEnvelope<T> {
    const s = this.getSession();
    if (!s) throw new Error("Connect to Wager before creating an action.");
    const now = new Date().toISOString();
    return {
      protocol_version: "1.0",
      event_id: newId("evt"),
      event_type: eventType,
      source: {
        channel: s.channel,
        application: `customer-${s.channel}`,
        instance_id: s.session_id,
      },
      valid_time: options?.customValidTime || now,
      ingest_time: now,
      identifiers: {
        device_id: s.device_id,
        session_id: s.session_id,
        ip_hash: "local_demo",
        customer_id: s.customer_id,
      },
      subject: {
        customer_id: s.customer_id,
        identity_state: s.customer_id ? "resolved" : "orphan",
      },
      journey: { case_id: options?.caseId, thread_hint: options?.threadHint },
      payload,
    };
  }
  async ingestEvent(envelope: EventEnvelope): Promise<IngestResult> {
    // Persist before transmission, so process termination cannot lose the action.
    if (!this.queue.some((e) => e.event_id === envelope.event_id)) {
      this.queue.push(envelope);
      await this.saveQueue();
    }
    try {
      const data = await this.request<{
        status: IngestResult["status"];
        assigned_customer_id: string | null;
        bound_orphans_count: number;
        retractions_emitted: number;
        message: string;
      }>("/events", { method: "POST", body: JSON.stringify(envelope) });
      this.queue = this.queue.filter((e) => e.event_id !== envelope.event_id);
      await this.saveQueue();
      return {
        success: true,
        online: true,
        status: data.status,
        assignedCustomerId: data.assigned_customer_id,
        boundOrphansCount: data.bound_orphans_count,
        retractionsEmitted: data.retractions_emitted,
        message: data.message,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status < 500 && ![408, 429].includes(error.status)) {
        // Terminal validation/authentication rejections must be corrected, not retried.
        this.queue = this.queue.filter((e) => e.event_id !== envelope.event_id);
        await this.saveQueue();
        throw error;
      }
      return {
        success: true,
        online: false,
        status: "queued_offline",
        message: "Saved on this device. It will send when you reconnect.",
      };
    }
  }
  async emit<T>(
    type: string,
    payload: T,
    options?: {
      caseId?: string;
      threadHint?: string;
      customValidTime?: string;
    },
  ) {
    const envelope = this.makeEvent(type, payload, options);
    const result = await this.ingestEvent(envelope as EventEnvelope);
    return { envelope, result };
  }
  async flushQueue(): Promise<number> {
    if (this.flushing) return this.flushing;
    this.flushing = (async () => {
      let sent = 0;
      for (const envelope of [...this.queue]) {
        if (envelope.identifiers.session_id !== this.getSession()?.session_id)
          throw new Error("Pending actions belong to another session.");
        await this.request("/events", {
          method: "POST",
          body: JSON.stringify(envelope),
        });
        this.queue = this.queue.filter((e) => e.event_id !== envelope.event_id);
        await this.saveQueue();
        sent++;
      }
      return sent;
    })();
    try {
      return await this.flushing;
    } finally {
      this.flushing = null;
    }
  }
  async fetchTransactions() {
    return this.request<import("../../contracts/src").TransactionItem[]>(
      "/transactions",
    );
  }
  async fetchCases() {
    return this.request<DisputeCase[]>("/cases");
  }
  async fetchCase(id: string) {
    return this.request<DisputeCase>("/cases/" + encodeURIComponent(id));
  }
  async fetchEvents() {
    return this.request<EventEnvelope[]>("/events?limit=500");
  }
  async fetchRetractions() {
    return this.request<
      Array<{
        event_id: string;
        new_state: { customer_id: string; identity_state: string };
      }>
    >("/retractions");
  }
  async fetchJourney(customerId: string, asOf?: string) {
    return this.request<{
      events: Array<{
        event_id: string;
        channel: string;
        event_type: string;
        valid_time: string;
      }>;
      total_events: number;
    }>(
      `/customers/${encodeURIComponent(customerId)}/journey${asOf ? "?as_of=" + encodeURIComponent(asOf) : ""}`,
    );
  }
  async fetchKnowledgeGap(customerId: string, contactTime: string) {
    return this.request(
      `/customers/${encodeURIComponent(customerId)}/knowledge-gap?contact_time=${encodeURIComponent(contactTime)}`,
    );
  }
  async createHandoff() {
    return this.request<Handoff>("/handoffs", { method: "POST" });
  }
  async redeemHandoff(code: string) {
    return this.request<{ bound_events: number; message: string }>(
      "/handoffs/redeem",
      { method: "POST", body: JSON.stringify({ code }) },
    );
  }
  async startCall(callId: string) {
    return this.request<CallState>("/calls", { method: "POST", body: JSON.stringify({ call_id: callId }) });
  }
  async fetchCall(callId: string) {
    return this.request<CallState>("/calls/" + encodeURIComponent(callId));
  }
  async verifyCall(callId: string, customerNumber: string, pin: string, actionId: string) {
    const result = await this.request<CallState>(`/calls/${encodeURIComponent(callId)}/verify`, {
      method: "POST", body: JSON.stringify({ customer_number: customerNumber, pin, action_id: actionId }),
    });
    if (this.credentials) {
      this.credentials.session = result.session;
      await this.secureStorage.setItem(this.sessionKey, JSON.stringify(this.credentials));
    }
    return result;
  }
  async callAction(callId: string, action: "select" | "status" | "follow-up" | "menu" | "end", actionId: string, caseId?: string) {
    return this.request<CallState>(`/calls/${encodeURIComponent(callId)}/${action}`, {
      method: "POST", body: JSON.stringify({ action_id: actionId, ...(caseId ? { case_id: caseId } : {}) }),
    });
  }

}
