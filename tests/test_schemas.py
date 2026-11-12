import pytest
from pydantic import ValidationError
from app.schemas import TradeCategory, TriageResult, MaintenanceTicket, TicketStatus


def test_trade_categories():
    valid_trades = ["Plumbing", "Electrical", "HVAC", "Carpentry", "General"]
    for t in valid_trades:
        cat = TradeCategory(t)
        assert cat.value == t


def test_triage_result_valid():
    res = TriageResult(
        trade_category=TradeCategory.HVAC,
        urgency_score=5,
        urgency_label="Critical Emergency",
        reasoning_hazards="Water leaking onto live 240V socket",
        recommended_tools_parts=["Multimeter", "Condensate pump"],
        immediate_precaution="Do not touch switches",
        confidence_score=0.98
    )
    assert res.trade_category == TradeCategory.HVAC
    assert res.urgency_score == 5
    assert len(res.recommended_tools_parts) == 2


def test_triage_result_urgency_bounds():
    # Urgency must be between 1 and 5
    with pytest.raises(ValidationError):
        TriageResult(
            trade_category=TradeCategory.PLUMBING,
            urgency_score=6,  # Invalid
            reasoning_hazards="Invalid high score",
            recommended_tools_parts=[]
        )

    with pytest.raises(ValidationError):
        TriageResult(
            trade_category=TradeCategory.PLUMBING,
            urgency_score=0,  # Invalid
            reasoning_hazards="Invalid low score",
            recommended_tools_parts=[]
        )
