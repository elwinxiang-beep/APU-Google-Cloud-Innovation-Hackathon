import pytest
from app.services.triage_engine import triage_engine
from app.schemas import TradeCategory


def test_triage_ac_leak_near_socket():
    desc = "My room AC is dripping water right onto my 240V power outlet and multi-plug extension cord! Heard slight crackling sound."
    result = triage_engine.triage_fault(description=desc)

    assert result.urgency_score == 5
    assert result.trade_category in [TradeCategory.HVAC, TradeCategory.ELECTRICAL]
    assert "240v" in result.reasoning_hazards.lower() or "electrical" in result.reasoning_hazards.lower() or "water" in result.reasoning_hazards.lower()
    assert len(result.recommended_tools_parts) > 0


def test_triage_blocked_toilet():
    desc = "The 2nd floor communal toilet is completely backed up. Someone flushed and foul water is overflowing onto floor."
    result = triage_engine.triage_fault(description=desc)

    assert result.trade_category == TradeCategory.PLUMBING
    assert result.urgency_score in [4, 5]
    assert "toilet" in result.reasoning_hazards.lower() or "sanitary" in result.reasoning_hazards.lower()


def test_triage_flickering_light():
    desc = "The light outside room 314 in the hallway keeps strobing and flickering and ballast is buzzing."
    result = triage_engine.triage_fault(description=desc)

    assert result.trade_category == TradeCategory.ELECTRICAL
    assert result.urgency_score <= 3


def test_triage_cosmetic_scuff():
    desc = "Behind my study chair there is a minor 5cm black scuff on the white wall paint."
    result = triage_engine.triage_fault(description=desc)

    assert result.trade_category == TradeCategory.GENERAL
    assert result.urgency_score == 1
