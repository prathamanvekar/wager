/**
 * Session and Customer Identity Types for Wager Web Portal.
 */

import type { IdentityState } from './protocol';

export interface CustomerProfile {
  id: string; // e.g. 'C1041'
  fullName: string;
  email: string;
  phoneSuffix: string;
  tier: 'Standard' | 'Premier' | 'Private Client';
  accountNumber: string;
  avatarUrl?: string;
  linkedDevicesCount: number;
}

export interface VisitorSession {
  sessionId: string;      // e.g. 'tok_ses_7f28a9'
  deviceId: string;       // e.g. 'tok_dev_41e0b3'
  ipHash: string;         // e.g. 'tok_ip_9c221f'
  networkAsn: string;     // e.g. 'AS13335 (Cloudflare)'
  startedAt: string;      // ISO-8601
  authState: 'anonymous' | 'authenticated';
  identityState: IdentityState;
  customer: CustomerProfile | null;
}

export interface EmittedEventRecord {
  envelope: import('./protocol').EventEnvelope;
  localStatus: 'queued' | 'transmitted' | 'reconciled';
  emittedAt: string;
}
