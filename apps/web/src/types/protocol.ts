/**
 * Wager Customer Journey Event Protocol (CJEP v1)
 * Canonical event schema types shared across all channels.
 */

export type ChannelType = 'web' | 'mobile' | 'call' | 'branch';

export type IdentityState = 'orphan' | 'provisional' | 'resolved';

export interface EventSource {
  channel: ChannelType;
  application: string;
  instance_id: string;
}

export interface EventIdentifiers {
  session_id: string;
  device_id: string;
  ip_hash: string;
  phone_suffix?: string;
  account_token?: string;
  customer_id?: string | null;
}

export interface EventSubject {
  customer_id: string | null;
  identity_state: IdentityState;
}

export interface JourneyContext {
  case_id?: string;
  thread_hint?: string;
  reference_entity?: string;
}

export interface SimulationMetadata {
  scenario_id?: string;
  ground_truth_customer_id?: string;
  ground_truth_thread_id?: string;
  simulated_delay_ms?: number;
}

export interface EventEnvelope<TPayload = Record<string, unknown>> {
  protocol_version: '1.0';
  event_id: string;
  event_type: string;
  source: EventSource;
  valid_time: string;   // ISO-8601 when it happened in the real world
  ingest_time: string;  // ISO-8601 when received by the system
  identifiers: EventIdentifiers;
  subject: EventSubject;
  journey?: JourneyContext;
  payload: TPayload;
  simulation?: SimulationMetadata;
}

export interface DisputePayload {
  case_id: string;
  transaction_id: string;
  transaction_date: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  dispute_reason: string;
  customer_notes?: string;
  status: 'submitted' | 'under_review' | 'evidence_required' | 'resolved';
}

export interface MessagePayload {
  case_id: string;
  message_id: string;
  sender_type: 'customer' | 'agent' | 'system';
  content: string;
  attachments?: string[];
}

export interface LoginPayload {
  customer_id: string;
  auth_method: 'password_otp' | 'passkey' | 'biometric';
  previous_anonymous_session_id?: string;
}
