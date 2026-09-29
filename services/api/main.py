"""
Wager Cross-Channel Journey Stitching — Core API Service
FastAPI implementation of CJEP v1 protocol, bitemporal queries,
late identity binding, and Server-Sent Events.
"""

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import asyncio
import json

from .protocol import (
    EventEnvelope,
    EventIngestResponse,
    JourneyResponse,
    KnowledgeGapResponse,
    AttributionRecord,
    RetractionPair,
)
from .store import store, utc_now

app = FastAPI(
    title="Wager Customer Journey API",
    version="1.0.0",
    description="Cross-Channel Journey Stitching with Late-Binding Identity & Bitemporal Store",
)

# Enable CORS for local web portal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "wager-api",
        "timestamp": utc_now(),
        "total_events": len(store.events),
        "total_attributions": len(store.attributions),
        "buffered_orphans": sum(len(v) for v in store.orphan_buffer_by_device.values()),
        "retractions_emitted": len(store.retractions),
    }


@app.post("/api/v1/events", response_model=EventIngestResponse)
async def ingest_single_event(envelope: EventEnvelope):
    """
    Ingests a canonical CJEP v1 event from Web, Mobile, Call, or Branch.
    Performs deterministic identity attribution, buffers orphans,
    or triggers late binding if customer identity becomes available.
    """
    try:
        response = store.ingest_event(envelope)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/events/batch", response_model=List[EventIngestResponse])
async def ingest_batch_events(envelopes: List[EventEnvelope]):
    results = []
    for env in envelopes:
        results.append(store.ingest_event(env))
    return results


@app.get("/api/v1/events")
async def list_recent_events(limit: int = 50):
    all_events = list(store.events.values())
    all_events.reverse()
    return all_events[:limit]


@app.get("/api/v1/events/{event_id}")
async def get_event_details(event_id: str):
    if event_id not in store.events:
        raise HTTPException(status_code=404, detail="Event not found")

    envelope = store.events[event_id]
    versions = [attr for attr in store.attributions if attr.event_id == event_id]

    return {
        "envelope": envelope,
        "attribution_versions": versions,
        "is_orphan": any(v.identity_state == "orphan" and v.superseded_at is None for v in versions),
    }


@app.get("/api/v1/customers/{customer_id}/journey", response_model=JourneyResponse)
async def get_customer_journey(
    customer_id: str,
    as_of: Optional[str] = Query(None, description="ISO-8601 timestamp for historical bitemporal AS-OF view"),
):
    """
    Retrieves the customer's cross-channel journey timeline.
    If 'as_of' is provided, reconstructs what the system believed as of that moment in system time.
    """
    return store.get_journey(customer_id, as_of_time=as_of)


@app.get("/api/v1/customers/{customer_id}/knowledge-gap", response_model=KnowledgeGapResponse)
async def get_knowledge_gap(
    customer_id: str,
    contact_time: str = Query(..., description="ISO-8601 timestamp when contact started e.g. Wed 14:20"),
):
    """
    Calculates the knowledge gap at contact time:
    how much relevant history was invisible to the agent when the interaction began.
    """
    return store.compute_knowledge_gap(customer_id, contact_time)


@app.get("/api/v1/retractions", response_model=List[RetractionPair])
async def list_retractions():
    """
    Lists the changelog of retractions emitted when anonymous events are bound retroactively.
    """
    return store.retractions


@app.get("/api/v1/stream")
async def event_stream(request: Request):
    """
    Server-Sent Events endpoint pushing real-time journey revisions and binding events.
    """
    async def event_generator():
        last_event_count = len(store.events)
        last_retraction_count = len(store.retractions)

        while True:
            if await request.is_disconnected():
                break

            current_event_count = len(store.events)
            current_retraction_count = len(store.retractions)

            if current_event_count > last_event_count or current_retraction_count > last_retraction_count:
                data = {
                    "type": "journey.updated",
                    "timestamp": utc_now(),
                    "total_events": current_event_count,
                    "retractions": current_retraction_count,
                }
                yield f"data: {json.dumps(data)}\n\n"
                last_event_count = current_event_count
                last_retraction_count = current_retraction_count

            # Heartbeat ping every 10s
            yield f": ping {utc_now()}\n\n"
            await asyncio.sleep(2.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.main:app", host="127.0.0.1", port=8000, reload=True)
