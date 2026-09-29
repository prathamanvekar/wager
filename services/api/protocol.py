"""
Wager Canonical Customer Journey Event Protocol (CJEP v1)
Pydantic v2 schemas for backend validation and serialization.
"""

from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class EventSource(BaseModel):
    channel: Literal["web", "mobile", "call", "branch"]
    application: str = Field(..., description="Producer application e.g. customer-web")
    instance_id: str = Field(..., description="Client instance or session identifier")


class EventIdentifiers(BaseModel):
    session_id: str
    device_id: str
    ip_hash: str
    phone_suffix: Optional[str] = None
    account_token: Optional[str] = None
    customer_id: Optional[str] = None


class EventSubject(BaseModel):
    customer_id: Optional[str] = None
    identity_state: Literal["orphan", "provisional", "resolved"] = "orphan"


class JourneyContext(BaseModel):
    case_id: Optional[str] = None
    thread_hint: Optional[str] = None
    reference_entity: Optional[str] = None


class SimulationMetadata(BaseModel):
    scenario_id: Optional[str] = None
    ground_truth_customer_id: Optional[str] = None
    ground_truth_thread_id: Optional[str] = None
    simulated_delay_ms: Optional[int] = None


class EventEnvelope(BaseModel):
    protocol_version: Literal["1.0"] = "1.0"
    event_id: str
    event_type: str
    source: EventSource
    valid_time: str   # ISO-8601 when it happened in the real world
    ingest_time: str  # ISO-8601 when received by the system
    identifiers: EventIdentifiers
    subject: EventSubject
    journey: Optional[JourneyContext] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    simulation: Optional[SimulationMetadata] = None


class EventIngestResponse(BaseModel):
    status: Literal["accepted", "buffered_orphan", "bound_retroactively"]
    event_id: str
    valid_time: str
    ingest_time: str
    assigned_customer_id: Optional[str]
    identity_state: Literal["orphan", "provisional", "resolved"]
    attribution_id: int
    bound_orphans_count: int = 0
    retractions_emitted: int = 0
    message: str


class AttributionRecord(BaseModel):
    attribution_id: int
    event_id: str
    customer_id: Optional[str]
    identity_state: Literal["orphan", "provisional", "resolved"]
    confidence: float
    method: Literal["deterministic", "probabilistic", "binding", "unmerge"]
    evidence: Optional[Dict[str, Any]] = None
    learned_at: str
    superseded_at: Optional[str] = None  # None if currently active


class RetractionPair(BaseModel):
    retraction_id: int
    event_id: str
    old_state: Dict[str, Any]
    new_state: Dict[str, Any]
    system_time: str
    reason: str


class JourneyResponse(BaseModel):
    customer_id: str
    as_of: Optional[str] = None
    total_events: int
    events: List[Dict[str, Any]]
    active_threads: List[str]


class KnowledgeGapResponse(BaseModel):
    customer_id: str
    contact_time: str
    current_known_count: int
    known_at_contact_count: int
    knowledge_gap: int
    invisible_events: List[Dict[str, Any]]
