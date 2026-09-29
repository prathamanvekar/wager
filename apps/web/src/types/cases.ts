/**
 * Case and Dispute entity models for Wager web app.
 */

import type { ChannelType, IdentityState } from './protocol';

export type TransactionStatus = 'unrecognized' | 'eligible' | 'cleared' | 'disputed' | 'under_review';

export interface TransactionItem {
  id: string;             // e.g. 'txn_88213'
  date: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  location: string;
  canDispute: boolean;
  status?: TransactionStatus;
  channel?: ChannelType | 'pos';
  cycle?: 'current' | 'previous';
  disputeId?: string;
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  channel: ChannelType;
  identityStateAtEmission: IdentityState;
  eventType: string;
  actor: 'customer' | 'agent' | 'system';
}

export interface CaseMessage {
  id: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  senderName: string;
  content: string;
  attachments?: string[];
  identityStateAtEmission: IdentityState;
}

export interface DisputeCase {
  id: string;             // e.g. 'case_88213'
  transactionId: string;
  merchant: string;
  amount: number;
  currency: string;
  reason: string;
  customerNotes?: string;
  attachments?: string[];
  status: 'submitted' | 'under_review' | 'awaiting_agent' | 'resolved';
  createdAt: string;
  threadHint: 'billing_dispute' | 'credit_inquiry' | 'general_support' | 'card_replacement';
  anonymousOrigin: boolean; // True if opened prior to authentication
  associatedCustomerId: string | null;
  originatingDeviceId: string;
  originatingSessionId: string;
  timeline: CaseTimelineEvent[];
  messages: CaseMessage[];
}
