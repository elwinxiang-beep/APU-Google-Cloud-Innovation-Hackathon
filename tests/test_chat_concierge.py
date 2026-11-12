import pytest
from app.services.chat_concierge import (
    chat_concierge,
    get_ticket_status,
    search_tickets_by_location,
    list_student_my_tickets,
    escalate_ticket_priority,
    explain_hostel_maintenance_policy
)


def test_tool_get_ticket_status():
    res = get_ticket_status("TICK-1024")
    assert res["found"] is True
    assert res["ticket_id"] == "TICK-1024"
    assert "Dave Miller" in res["assigned_technician"]
    assert res["urgency_score"] >= 4


def test_tool_search_location():
    res = search_tickets_by_location("3rd Floor")
    assert res["count"] >= 1
    assert any("TICK-1018" in t["ticket_id"] for t in res["tickets"])


def test_tool_list_student_tickets():
    res = list_student_my_tickets("STU-8821")
    assert res["total_tickets"] >= 2


def test_tool_escalate_ticket():
    res = escalate_ticket_priority("TICK-1025", "Water is now pooling across whole bathroom")
    assert res["success"] is True
    assert res["new_urgency_score"] >= 3


def test_concierge_nl_status_query():
    resp = chat_concierge.handle_message("What is the status of ticket #1024?", student_id="STU-8821")
    assert "TICK-1024" in resp.reply
    assert len(resp.tool_calls) > 0
    assert resp.tool_calls[0].tool_name == "get_ticket_status"


def test_concierge_nl_location_query():
    resp = chat_concierge.handle_message("Has anyone reported the 3rd floor bathroom light?", student_id="STU-8821")
    assert len(resp.tool_calls) > 0
    assert resp.tool_calls[0].tool_name == "search_tickets_by_location"
    assert "TICK-1018" in resp.reply or "3rd Floor" in resp.reply
