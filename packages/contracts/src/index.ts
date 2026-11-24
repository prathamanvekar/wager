export * from "./protocol";
export * from "./cases";
export * from "./session";
export interface ServerSession {
  device_id: string;
  session_id: string;
  channel: import("./protocol").ChannelType;
  customer_id: string | null;
  expires_at: string;
}
export interface SessionCredentials {
  access_token: string;
  session: ServerSession;
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
export interface IngestResult {
  success: boolean;
  online: boolean;
  status:
    "accepted" | "buffered_orphan" | "bound_retroactively" | "queued_offline";
  assignedCustomerId?: string | null;
  boundOrphansCount?: number;
  retractionsEmitted?: number;
  message: string;
  error?: string;
}
export interface Handoff {
  code: string;
  uri: string;
  expires_at: string;
}

export * from "./call";
