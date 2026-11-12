import asyncio
from app.api.routes import (
    get_health,
    triage_multipart,
    triage_json,
    chat_with_concierge,
    list_tickets,
    get_ticket,
    get_benchmark_cases,
    run_benchmark_eval
)
from app.schemas import TriageRequest, ChatRequest


def test_health_route():
    health = get_health()
    assert health.status == "healthy"
    assert health.version == "1.0.0"
    assert health.gemini_model is not None


def test_triage_multipart_route():
    result = triage_multipart(
        description="The kitchen exhaust fan is smoking and burning plastic!",
        location="Pantry Level 1",
        student_id="STU-8821",
        file=None
    )
    assert result.trade_category.value in ["Electrical", "HVAC"]
    assert result.urgency_score >= 4
    assert len(result.recommended_tools_parts) > 0


def test_triage_json_route():
    req = TriageRequest(
        description="My wardrobe door hinge is loose and wobbling",
        location="Block B, Room 210"
    )
    result = triage_json(req)
    assert result.trade_category.value == "Carpentry"
    assert result.urgency_score <= 3


def test_chat_concierge_route():
    req = ChatRequest(
        message="Where is my ticket #1024?",
        student_id="STU-8821"
    )
    resp = chat_with_concierge(req)
    assert "TICK-1024" in resp.reply
    assert len(resp.tool_calls) > 0
    assert resp.tool_calls[0].tool_name == "get_ticket_status"


def test_tickets_route():
    tickets = list_tickets()
    assert len(tickets) > 0

    first_id = tickets[0].ticket_id
    ticket = get_ticket(first_id)
    assert ticket.ticket_id == first_id


def test_benchmark_routes():
    cases = get_benchmark_cases()
    assert len(cases) == 18

    # Run eval
    eval_resp = run_benchmark_eval()
    assert eval_resp.total_cases == 18
    assert eval_resp.trade_accuracy_percent >= 90.0
    assert eval_resp.urgency_mae < 0.5
