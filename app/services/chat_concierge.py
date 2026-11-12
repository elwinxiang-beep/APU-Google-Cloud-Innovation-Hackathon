import json
import logging
import re
from typing import List, Optional, Dict, Any

from google.genai import types

from app.data.ticket_store import ticket_store
from app.schemas import ChatMessage, ChatResponse, ToolCallRecord
from app.services.gemini_client import gemini_manager

logger = logging.getLogger("chat_concierge")

CONCIERGE_SYSTEM_PROMPT = """You are the official 24/7 AI Maintenance Concierge for University Hall Residences.
Your mission is to assist hostel students with their maintenance tickets, answer status queries in natural language, look up facility reports, and handle ticket escalations.

YOUR TOOL ARSENAL:
1. `get_ticket_status(ticket_id)`: Call this whenever a student asks about a specific ticket number (e.g. TICK-1024 or #1024).
2. `search_tickets_by_location(location)`: Call this when a student asks if an issue in a common area or room has already been reported (e.g. "is the 3rd floor light reported?").
3. `list_student_my_tickets(student_id)`: Call this when a student asks "what tickets do I have open?" or "my requests".
4. `escalate_ticket_priority(ticket_id, reason)`: Call this when a student reports that an existing issue has worsened or requests urgent escalation.
5. `explain_hostel_maintenance_policy()`: Call this for questions about SLAs, emergency contacts, or repair timelines.

COMMUNICATION STYLE:
- Polite, supportive, clear, and reassuring.
- Always include key ticket details when retrieved (Ticket ID, Status, Assigned Technician, ETA, Latest Note).
- For Critical Emergencies (Urgency 5), remind the student of immediate safety precautions and the 24/7 Duty Warden Hotline: +65 6516 7777.
"""


# --- Tool Implementations ---

def get_ticket_status(ticket_id: str) -> Dict[str, Any]:
    """Look up a hostel maintenance ticket by ID to check status, technician, and ETA.
    
    Args:
        ticket_id: Ticket code, e.g. 'TICK-1024' or '1024'.
    """
    ticket = ticket_store.get_ticket(ticket_id)
    if not ticket:
        return {
            "found": False,
            "message": f"No maintenance ticket found with ID '{ticket_id}'. Please double check the ticket number."
        }
    return {
        "found": True,
        "ticket_id": ticket.ticket_id,
        "title": ticket.title,
        "location": ticket.location,
        "trade": ticket.trade_category.value,
        "urgency_score": ticket.urgency_score,
        "status": ticket.status.value,
        "assigned_technician": ticket.assigned_technician or "Pending assignment",
        "technician_phone": ticket.technician_phone or "N/A",
        "estimated_arrival": ticket.estimated_arrival or "Pending schedule",
        "latest_update": ticket.notes[-1] if ticket.notes else "No notes logged yet."
    }


def search_tickets_by_location(location: str) -> Dict[str, Any]:
    """Search for existing maintenance tickets in a hostel block, floor, or communal space.
    
    Args:
        location: Room, floor, or area name (e.g. 'Block B', '3rd Floor', 'Pantry', 'Room 304').
    """
    results = ticket_store.search_tickets(location=location)
    formatted = []
    for t in results[:5]:  # Return top 5 matches
        formatted.append({
            "ticket_id": t.ticket_id,
            "title": t.title,
            "location": t.location,
            "status": t.status.value,
            "trade": t.trade_category.value,
            "urgency": t.urgency_score,
            "technician": t.assigned_technician
        })
    return {
        "query_location": location,
        "count": len(results),
        "tickets": formatted,
        "summary": f"Found {len(results)} maintenance ticket(s) matching '{location}'."
    }


def list_student_my_tickets(student_id: str) -> Dict[str, Any]:
    """Retrieve all maintenance tickets logged by a specific student.
    
    Args:
        student_id: Student identification code, e.g. 'STU-8821'.
    """
    results = ticket_store.search_tickets(student_id=student_id)
    formatted = []
    for t in results:
        formatted.append({
            "ticket_id": t.ticket_id,
            "title": t.title,
            "location": t.location,
            "status": t.status.value,
            "urgency": t.urgency_score,
            "updated_at": t.updated_at
        })
    return {
        "student_id": student_id,
        "total_tickets": len(results),
        "tickets": formatted
    }


def escalate_ticket_priority(ticket_id: str, reason: str) -> Dict[str, Any]:
    """Escalate a maintenance ticket when the condition deteriorates or hazard increases.
    
    Args:
        ticket_id: Ticket ID to escalate, e.g. 'TICK-1024'.
        reason: Student reason for escalation (e.g. 'Water is leaking faster onto power strip').
    """
    ticket = ticket_store.escalate_ticket(ticket_id, reason)
    if not ticket:
        return {
            "success": False,
            "message": f"Could not find ticket '{ticket_id}' to escalate."
        }
    return {
        "success": True,
        "ticket_id": ticket.ticket_id,
        "new_urgency_score": ticket.urgency_score,
        "status": ticket.status.value,
        "message": f"Ticket {ticket.ticket_id} has been escalated to Priority Level {ticket.urgency_score}/5. Operations team alerted."
    }


def explain_hostel_maintenance_policy() -> Dict[str, Any]:
    """Provide hostel maintenance response SLAs, trade categories, and after-hours emergency contacts."""
    return {
        "emergency_hotline": "+65 6516 7777 (24/7 Hostel Duty Warden)",
        "service_level_agreements": {
            "Level 5 (Critical Emergency)": "< 1 hour (immediate dispatch for flood, fire, electrocution, entrapment)",
            "Level 4 (Urgent)": "< 4 to 6 hours (toilet blockage, room blackout, severe storm damage)",
            "Level 3 (Moderate)": "< 24 hours (AC malfunction, mould assessment, slow drainage)",
            "Level 2 (Minor)": "< 72 hours (dripping taps, flickering lights, cabinet hinges)",
            "Level 1 (Cosmetic)": "Within 5 business days (paint scuffs, screen tears)"
        },
        "operating_hours": "Routine Repairs: Mon-Sat 08:30 - 18:00. Emergencies: 24/7."
    }


TOOL_FUNCTIONS_MAP = {
    "get_ticket_status": get_ticket_status,
    "search_tickets_by_location": search_tickets_by_location,
    "list_student_my_tickets": list_student_my_tickets,
    "escalate_ticket_priority": escalate_ticket_priority,
    "explain_hostel_maintenance_policy": explain_hostel_maintenance_policy,
}

ALL_TOOLS = [
    get_ticket_status,
    search_tickets_by_location,
    list_student_my_tickets,
    escalate_ticket_priority,
    explain_hostel_maintenance_policy,
]


class ChatConciergeService:
    """Conversational Concierge Chat Agent with Function Calling / Tool Use."""

    def __init__(self):
        self.system_prompt = CONCIERGE_SYSTEM_PROMPT

    def handle_message(
        self,
        message: str,
        student_id: str = "STU-8821",
        history: Optional[List[ChatMessage]] = None
    ) -> ChatResponse:
        """Process natural language student query, calling tools as needed."""
        if gemini_manager.is_live:
            try:
                return self._call_live_gemini_agent(message, student_id, history)
            except Exception as e:
                logger.error(f"Live Gemini Agent error: {e}. Executing simulation engine.")
                return self._simulate_chat_agent(message, student_id)
        else:
            return self._simulate_chat_agent(message, student_id)

    def _call_live_gemini_agent(
        self,
        message: str,
        student_id: str,
        history: Optional[List[ChatMessage]]
    ) -> ChatResponse:
        """Invoke live Gemini model with function calling tools."""
        client = gemini_manager.client
        model_name = gemini_manager.model_name
        records: List[ToolCallRecord] = []

        # Build contents from history and current message
        contents = []
        if history:
            for h in history:
                role = "user" if h.role == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h.content)]))

        student_context = f"[System Context: Current logged-in student_id is '{student_id}']\nStudent says: {message}"
        contents.append(student_context)

        config = types.GenerateContentConfig(
            system_instruction=self.system_prompt,
            tools=ALL_TOOLS,
            temperature=0.2
        )

        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=config
        )

        # Check if the model requested function calls
        if response.function_calls:
            tool_response_parts = []
            for call in response.function_calls:
                fn_name = call.name
                fn_args = dict(call.args) if call.args else {}
                
                # Execute tool function
                fn = TOOL_FUNCTIONS_MAP.get(fn_name)
                if fn:
                    tool_result = fn(**fn_args)
                else:
                    tool_result = {"error": f"Unknown tool {fn_name}"}

                records.append(ToolCallRecord(
                    tool_name=fn_name,
                    arguments=fn_args,
                    result=tool_result
                ))

                tool_response_parts.append(
                    types.Part.from_function_response(name=fn_name, response=tool_result)
                )

            # Send tool outputs back to model for synthesis
            second_response = client.models.generate_content(
                model=model_name,
                contents=[*contents, response.candidates[0].content, types.Content(parts=tool_response_parts)],
                config=types.GenerateContentConfig(
                    system_instruction=self.system_prompt,
                    temperature=0.2
                )
            )
            return ChatResponse(
                reply=second_response.text.strip(),
                tool_calls=records,
                student_id=student_id
            )
        else:
            return ChatResponse(
                reply=response.text.strip(),
                tool_calls=[],
                student_id=student_id
            )

    def _simulate_chat_agent(self, message: str, student_id: str) -> ChatResponse:
        """
        Robust natural language parsing & function calling simulation.
        Executes exact same tools and schemas without requiring external network.
        """
        msg = message.lower().strip()
        records: List[ToolCallRecord] = []

        # 1. Pattern: Ticket ID status query (e.g. "ticket 1024", "TICK-1024", "status of #1025")
        id_match = re.search(r'(?:tick-?|#|\bticket\s+)?(\d{4})', msg)
        is_escalation = any(w in msg for w in ["escalate", "urgent", "worse", "speed up", "rush", "danger"])

        if id_match and is_escalation:
            raw_num = id_match.group(1)
            ticket_id = f"TICK-{raw_num}"
            reason = message
            res = escalate_ticket_priority(ticket_id=ticket_id, reason=reason)
            records.append(ToolCallRecord(tool_name="escalate_ticket_priority", arguments={"ticket_id": ticket_id, "reason": reason}, result=res))

            if res.get("success"):
                reply = (
                    f"⚠️ **Ticket Escalated Successfully!**\n\n"
                    f"I have escalated your ticket **{ticket_id}** to **Urgency Level {res['new_urgency_score']}/5**.\n"
                    f"The operations dispatch center has been notified with your reason: *\"{reason}\"*.\n\n"
                    f"If this is an immediate life-safety emergency, please also ring the **24/7 Duty Warden** at **+65 6516 7777**."
                )
            else:
                reply = f"I couldn't locate ticket **{ticket_id}** to escalate. Please check your ticket ID."
            return ChatResponse(reply=reply, tool_calls=records, student_id=student_id)

        if id_match and not any(w in msg for w in ["my tickets", "policy"]):
            raw_num = id_match.group(1)
            ticket_id = f"TICK-{raw_num}"
            res = get_ticket_status(ticket_id=ticket_id)
            records.append(ToolCallRecord(tool_name="get_ticket_status", arguments={"ticket_id": ticket_id}, result=res))

            if res.get("found"):
                reply = (
                    f"Here is the latest update on your ticket **{res['ticket_id']}**:\n\n"
                    f"• **Fault:** {res['title']}\n"
                    f"• **Location:** {res['location']}\n"
                    f"• **Trade Discipline:** {res['trade']}\n"
                    f"• **Priority Level:** {res['urgency_score']}/5\n"
                    f"• **Current Status:** `{res['status']}`\n"
                    f"• **Assigned Specialist:** {res['assigned_technician']} ({res['technician_phone']})\n"
                    f"• **Estimated Arrival:** {res['estimated_arrival']}\n\n"
                    f"**Latest Activity Log:**\n> {res['latest_update']}\n\n"
                    f"Would you like me to request an escalation or add notes for the technician?"
                )
            else:
                reply = f"I searched the system but could not find a ticket numbered **{ticket_id}**. Could it be under a different room or ID?"
            return ChatResponse(reply=reply, tool_calls=records, student_id=student_id)

        # 2. Pattern: Search tickets by location / area (e.g. "bathroom", "3rd floor", "block b")
        if any(w in msg for w in ["3rd floor", "third floor", "block b", "block a", "block c", "bathroom", "laundry", "corridor", "hallway", "reported", "anyone reported"]):
            # Extract candidate location
            loc_candidate = "Block B"
            if "3rd floor" in msg or "third floor" in msg:
                loc_candidate = "3rd Floor"
            elif "laundry" in msg:
                loc_candidate = "Laundry"
            elif "bathroom" in msg:
                loc_candidate = "Bathroom"
            elif "block a" in msg:
                loc_candidate = "Block A"
            elif "block c" in msg:
                loc_candidate = "Block C"

            res = search_tickets_by_location(location=loc_candidate)
            records.append(ToolCallRecord(tool_name="search_tickets_by_location", arguments={"location": loc_candidate}, result=res))

            if res["count"] > 0:
                ticket_list_str = "\n".join([
                    f"- **{t['ticket_id']}** ({t['location']}): {t['title']} — Status: `{t['status']}` (Tech: {t['technician'] or 'Unassigned'})"
                    for t in res["tickets"]
                ])
                reply = (
                    f"Yes! Here are the active tickets logged for **{loc_candidate}**:\n\n"
                    f"{ticket_list_str}\n\n"
                    f"If your issue is different from the above, you can submit a new photo for AI triage!"
                )
            else:
                reply = f"No active tickets are currently logged for **'{loc_candidate}'**. If there is an issue, please send a photo and description so I can triage it for you right away!"
            return ChatResponse(reply=reply, tool_calls=records, student_id=student_id)

        # 3. Pattern: List student's own tickets ("my tickets", "my requests", "what issues have i filed")
        if any(w in msg for w in ["my ticket", "my requests", "i filed", "what do i have", "my open"]):
            res = list_student_my_tickets(student_id=student_id)
            records.append(ToolCallRecord(tool_name="list_student_my_tickets", arguments={"student_id": student_id}, result=res))

            if res["total_tickets"] > 0:
                list_str = "\n".join([
                    f"- **{t['ticket_id']}** ({t['location']}): {t['title']} | Status: `{t['status']}` (Priority {t['urgency']}/5)"
                    for t in res["tickets"]
                ])
                reply = (
                    f"You have **{res['total_tickets']}** ticket(s) registered under student ID **{student_id}**:\n\n"
                    f"{list_str}\n\n"
                    f"Let me know if you would like full tracking details or an ETA for any of these."
                )
            else:
                reply = f"You do not have any open maintenance tickets currently registered under student ID **{student_id}**."
            return ChatResponse(reply=reply, tool_calls=records, student_id=student_id)

        # 4. Pattern: Policy or SLA questions
        if any(w in msg for w in ["policy", "sla", "hours", "contact", "phone", "warden", "how long", "urgent", "rule"]):
            res = explain_hostel_maintenance_policy()
            records.append(ToolCallRecord(tool_name="explain_hostel_maintenance_policy", arguments={}, result=res))
            reply = (
                f"### 📋 Hostel Maintenance SLA & Emergency Policy\n\n"
                f"• **24/7 Duty Warden Hotline:** `{res['emergency_hotline']}`\n"
                f"• **Standard Operating Hours:** {res['operating_hours']}\n\n"
                f"**Resolution Response Times by Urgency Score:**\n"
                f"- **Level 5 (Critical Emergency):** {res['service_level_agreements']['Level 5 (Critical Emergency)']}\n"
                f"- **Level 4 (Urgent):** {res['service_level_agreements']['Level 4 (Urgent)']}\n"
                f"- **Level 3 (Moderate):** {res['service_level_agreements']['Level 3 (Moderate)']}\n"
                f"- **Level 2 (Minor):** {res['service_level_agreements']['Level 2 (Minor)']}\n"
                f"- **Level 1 (Cosmetic):** {res['service_level_agreements']['Level 1 (Cosmetic)']}\n\n"
                f"Feel free to ask me to check on an existing ticket or report a new fault!"
            )
            return ChatResponse(reply=reply, tool_calls=records, student_id=student_id)

        # Default helpful assistant reply
        reply = (
            f"Hello! I'm your Hostel AI Maintenance Concierge.\n\n"
            f"Here are things I can assist you with right now:\n"
            f"1. **Check ticket status:** e.g., *\"What is the status of ticket #1024?\"*\n"
            f"2. **Check area issues:** e.g., *\"Has anyone reported the 3rd floor bathroom light?\"*\n"
            f"3. **View your open requests:** e.g., *\"List my open tickets\"*\n"
            f"4. **Escalate a worsening fault:** e.g., *\"Escalate ticket 1024, water is spreading fast!\"*\n"
            f"5. **Hostel SLAs & Policies:** e.g., *\"What are the maintenance response times?\"*\n\n"
            f"How can I help you today?"
        )
        return ChatResponse(reply=reply, tool_calls=[], student_id=student_id)


# Global concierge service instance
chat_concierge = ChatConciergeService()
