/**
 * Wager Cross-Channel API Client.
 * Connects the web client to the backend FastAPI event ingestion & journey service.
 * Supports dual-mode: live HTTP/SSE transmission with offline buffer fallback.
 */

import type { EventEnvelope } from '../types/protocol';

export interface IngestResult {
  success: boolean;
  online: boolean;
  status: 'accepted' | 'buffered_orphan' | 'bound_retroactively' | 'queued_offline';
  assignedCustomerId?: string | null;
  boundOrphansCount?: number;
  retractionsEmitted?: number;
  message: string;
  error?: string;
}

export interface BackendHealth {
  status: string;
  service: string;
  timestamp: string;
  total_events: number;
  total_attributions: number;
  buffered_orphans: number;
  retractions_emitted: number;
}

class WagerApiClient {
  private baseUrl: string = 'http://127.0.0.1:8000/api/v1';
  private isOnline: boolean = false;
  private offlineQueueKey = 'wager_offline_events_queue';
  private eventSource: EventSource | null = null;
  private sseListeners: Array<(eventData: any) => void> = [];

  constructor() {
    const savedUrl = localStorage.getItem('wager_api_url');
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('wager_api_url', url);
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public async checkHealth(): Promise<BackendHealth | null> {
    try {
      const resp = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        this.isOnline = true;
        // Auto flush if we have pending offline events
        this.flushQueue();
        return data as BackendHealth;
      }
      this.isOnline = false;
      return null;
    } catch {
      this.isOnline = false;
      return null;
    }
  }

  public async ingestEvent(envelope: EventEnvelope): Promise<IngestResult> {
    try {
      const resp = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      if (resp.ok) {
        const data = await resp.json();
        this.isOnline = true;
        return {
          success: true,
          online: true,
          status: data.status,
          assignedCustomerId: data.assigned_customer_id,
          boundOrphansCount: data.bound_orphans_count,
          retractionsEmitted: data.retractions_emitted,
          message: data.message,
        };
      } else {
        const errText = await resp.text();
        throw new Error(errText);
      }
    } catch (err: any) {
      // Offline fallback: Queue locally so no event is lost
      this.isOnline = false;
      this.queueOfflineEvent(envelope);
      return {
        success: true,
        online: false,
        status: 'queued_offline',
        assignedCustomerId: envelope.subject.customer_id,
        message: `Backend currently unreachable. Event ${envelope.event_id} safely buffered in browser offline ledger.`,
        error: err?.message,
      };
    }
  }

  public async fetchJourney(customerId: string, asOf?: string) {
    const url = asOf
      ? `${this.baseUrl}/customers/${customerId}/journey?as_of=${encodeURIComponent(asOf)}`
      : `${this.baseUrl}/customers/${customerId}/journey`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch customer journey');
    return await resp.json();
  }

  public async fetchKnowledgeGap(customerId: string, contactTime: string) {
    const url = `${this.baseUrl}/customers/${customerId}/knowledge-gap?contact_time=${encodeURIComponent(contactTime)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to compute knowledge gap');
    return await resp.json();
  }

  private queueOfflineEvent(envelope: EventEnvelope) {
    const queue = this.getOfflineQueue();
    queue.push(envelope);
    localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
  }

  public getOfflineQueue(): EventEnvelope[] {
    try {
      const raw = localStorage.getItem(this.offlineQueueKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async flushQueue(): Promise<number> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;

    let flushed = 0;
    const remaining: EventEnvelope[] = [];

    for (const env of queue) {
      try {
        const resp = await fetch(`${this.baseUrl}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(env),
        });
        if (resp.ok) {
          flushed++;
        } else {
          remaining.push(env);
        }
      } catch {
        remaining.push(env);
      }
    }

    localStorage.setItem(this.offlineQueueKey, JSON.stringify(remaining));
    return flushed;
  }

  public connectStream(listener: (eventData: any) => void): () => void {
    this.sseListeners.push(listener);

    if (!this.eventSource) {
      try {
        this.eventSource = new EventSource(`${this.baseUrl}/stream`);
        this.eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            this.sseListeners.forEach((fn) => fn(data));
          } catch {
            // ignore non-json pings
          }
        };
        this.eventSource.onerror = () => {
          // EventSource will auto-reconnect
        };
      } catch {
        // SSE unsupported or network block
      }
    }

    return () => {
      this.sseListeners = this.sseListeners.filter((fn) => fn !== listener);
      if (this.sseListeners.length === 0 && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }
}

export const apiClient = new WagerApiClient();
