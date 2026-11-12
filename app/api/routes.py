import base64
import logging
from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Query
from pydantic import BaseModel

from app.config import settings
from app.data.benchmark_cases import get_all_benchmarks, get_benchmark_by_id
from app.data.ticket_store import ticket_store
from app.schemas import (
    ChatRequest,
    ChatResponse,
    MaintenanceTicket,
    TriageRequest,
    TriageResult,
)
from app.services.chat_concierge import chat_concierge
from app.services.gemini_client import gemini_manager
from app.services.triage_engine import triage_engine

logger = logging.getLogger("api_routes")
router = APIRouter(prefix="/api")


class HealthResponse(BaseModel):
    status: str
    gemini_model: str
    is_live_gemini: bool
    version: str


class EscalatePayload(BaseModel):
    reason: str


class BenchmarkRunResponse(BaseModel):
    total_cases: int
    trade_accuracy_percent: float
    urgency_mae: float
    exact_urgency_match_percent: float
    results: List[dict]


@router.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint displaying Gemini model status and mode."""
    return HealthResponse(
        status="healthy",
        gemini_model=gemini_manager.model_name,
        is_live_gemini=gemini_manager.is_live,
        version="1.0.0"
    )


@router.post("/triage", response_model=TriageResult)
def triage_multipart(
    description: str = Form(..., description="Casual student fault description"),
    location: Optional[str] = Form(None, description="Hostel room or area"),
    student_id: Optional[str] = Form("STU-8821", description="Student ID"),
    file: Optional[UploadFile] = File(None, description="Uploaded photo of maintenance fault")
):
    """
    Multimodal Fault Triage Endpoint (Multipart Form Data).
    Accepts an uploaded image file + colloquial description.
    Returns structured JSON: trade_category, urgency_score (1-5), reasoning_hazards, recommended_tools_parts.
    """
    image_bytes = None
    image_mime = "image/jpeg"

    if file:
        image_bytes = file.file.read()
        image_mime = file.content_type or "image/jpeg"

    result = triage_engine.triage_fault(
        description=description,
        image_bytes=image_bytes,
        image_mime=image_mime,
        location=location
    )
    return result


@router.post("/triage/json", response_model=TriageResult)
def triage_json(payload: TriageRequest):
    """
    Multimodal Fault Triage Endpoint (JSON Payload).
    Accepts description with optional base64 image string.
    """
    image_bytes = None
    image_mime = "image/jpeg"

    if payload.image_base64:
        raw_b64 = payload.image_base64
        if "," in raw_b64:
            header, raw_b64 = raw_b64.split(",", 1)
            if "image/png" in header:
                image_mime = "image/png"
            elif "image/webp" in header:
                image_mime = "image/webp"
        try:
            image_bytes = base64.b64decode(raw_b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")

    result = triage_engine.triage_fault(
        description=payload.description,
        image_bytes=image_bytes,
        image_mime=image_mime,
        location=payload.location
    )
    return result


@router.post("/chat", response_model=ChatResponse)
def chat_with_concierge(payload: ChatRequest):
    """
    Conversational Status Concierge Chat Endpoint.
    Uses function calling / tools to inspect ticket store, search areas, or escalate.
    """
    return chat_concierge.handle_message(
        message=payload.message,
        student_id=payload.student_id or "STU-8821",
        history=payload.conversation_history
    )


@router.get("/tickets", response_model=List[MaintenanceTicket])
def list_tickets(
    student_id: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    trade: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None)
):
    """Search and filter hostel maintenance tickets."""
    # Handle direct function invocation where FastAPI Query param defaults might be passed
    s_id = student_id if isinstance(student_id, str) else None
    loc = location if isinstance(location, str) else None
    tr = trade if isinstance(trade, str) else None
    st = status if isinstance(status, str) else None

    return ticket_store.search_tickets(
        student_id=s_id,
        location=loc,
        trade=tr,
        status=st
    )


@router.get("/tickets/{ticket_id}", response_model=MaintenanceTicket)
def get_ticket(ticket_id: str):
    """Fetch single ticket by ID."""
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found.")
    return ticket


@router.post("/tickets/{ticket_id}/escalate", response_model=MaintenanceTicket)
def escalate_ticket(ticket_id: str, payload: EscalatePayload):
    """Escalate a ticket with student reasoning."""
    ticket = ticket_store.escalate_ticket(ticket_id, payload.reason)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found.")
    return ticket


@router.get("/benchmark")
def get_benchmark_cases():
    """List the 18 curated benchmark test cases."""
    return get_all_benchmarks()


@router.post("/benchmark/run", response_model=BenchmarkRunResponse)
def run_benchmark_eval():
    """
    Run automated triage evaluation against the benchmark dataset.
    Computes trade alignment accuracy and urgency score variance.
    """
    cases = get_all_benchmarks()
    trade_correct = 0
    exact_urgency_correct = 0
    total_abs_error = 0
    case_results = []

    for c in cases:
        triage = triage_engine.triage_fault(
            description=c["casual_text"],
            location="Benchmark Dormitory"
        )

        expected_trade = c["expected_trade"]
        secondary_trade = c.get("secondary_trade")
        actual_trade = triage.trade_category.value

        is_trade_match = (actual_trade == expected_trade) or (secondary_trade and actual_trade == secondary_trade)
        if is_trade_match:
            trade_correct += 1

        urgency_diff = abs(triage.urgency_score - c["expected_urgency"])
        total_abs_error += urgency_diff
        if urgency_diff == 0:
            exact_urgency_correct += 1

        case_results.append({
            "id": c["id"],
            "title": c["title"],
            "input_text": c["casual_text"],
            "expected_trade": expected_trade,
            "predicted_trade": actual_trade,
            "trade_match": is_trade_match,
            "expected_urgency": c["expected_urgency"],
            "predicted_urgency": triage.urgency_score,
            "urgency_diff": urgency_diff,
            "reasoning": triage.reasoning_hazards,
            "tools": triage.recommended_tools_parts
        })

    n = len(cases)
    return BenchmarkRunResponse(
        total_cases=n,
        trade_accuracy_percent=round((trade_correct / n) * 100, 2),
        urgency_mae=round(total_abs_error / n, 2),
        exact_urgency_match_percent=round((exact_urgency_correct / n) * 100, 2),
        results=case_results
    )
