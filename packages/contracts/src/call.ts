import type { DisputeCase } from "./cases";
import type { ServerSession } from "./index";
export interface CallState {
  id: string;
  state: "verifying" | "choosing_case" | "in_case" | "ended";
  customer_id: string | null;
  customer: { id: string; fullName: string } | null;
  case_id: string | null;
  selected_case: DisputeCase | null;
  cases: DisputeCase[];
  started_at: string;
  ended_at: string | null;
  attempts: number;
  prompt: string;
  transcript: Array<{ speaker: "assistant" | "customer"; text: string; at: string }>;
  followups: string[];
  heard_cases: string[];
  session: ServerSession;
}
