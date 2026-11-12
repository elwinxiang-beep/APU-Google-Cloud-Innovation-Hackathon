from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, conint


class TradeCategory(str, Enum):
    """Hostel maintenance trade categories."""
    PLUMBING = "Plumbing"
    ELECTRICAL = "Electrical"
    HVAC = "HVAC"
    CARPENTRY = "Carpentry"
    GENERAL = "General"


class UrgencyLevel(BaseModel):
    """Explanation of urgency score level."""
    score: int
    label: str
    sla_hours: int


URGENCY_LEVEL_MAP = {
    1: {"label": "Cosmetic", "sla_hours": 120, "description": "Superficial wear, chipped paint, minor scuffs. No functional impediment."},
    2: {"label": "Low / Minor", "sla_hours": 72, "description": "Minor inconvenience, squeaky hinges, dripping faucet with slow drip. Low risk."},
    3: {"label": "Moderate", "sla_hours": 24, "description": "Impairs daily activity (e.g. lukewarm AC, broken study drawer, slow drain). Needs attention soon."},
    4: {"label": "Urgent / High", "sla_hours": 6, "description": "Major disruption or property damage risk (e.g. single working toilet blocked, room lock failed, no heat in cold weather)."},
    5: {"label": "Critical Emergency", "sla_hours": 1, "description": "Immediate life safety, fire, electrocution, or severe flood hazard (e.g. water near live wires, gas smell, structural collapse)."}
}


class TriageResult(BaseModel):
    """
    Structured Output Schema for Gemini Multimodal Fault Triage.
    Enforced via Google GenAI response_schema.
    """
    trade_category: TradeCategory = Field(
        description="The primary trade discipline required to resolve this fault."
    )
    urgency_score: conint(ge=1, le=5) = Field(
        description="Urgency score from 1 (Cosmetic) to 5 (Critical Emergency)."
    )
    urgency_label: str = Field(
        default="Moderate",
        description="Textual classification corresponding to score (Cosmetic, Low, Moderate, Urgent, Critical Emergency)."
    )
    reasoning_hazards: str = Field(
        description="Detailed technical reasoning identifying visual/auditory hazards, danger to life/property, and why this score was assigned."
    )
    recommended_tools_parts: List[str] = Field(
        default_factory=list,
        description="List of specific equipment, diagnostic instruments, and replacement parts the technician should bring on first visit."
    )
    immediate_precaution: Optional[str] = Field(
        default=None,
        description="Immediate safety instructions for the student or resident while waiting for dispatch (e.g., 'Do not touch switch', 'Ventilate room')."
    )
    confidence_score: Optional[float] = Field(
        default=0.95,
        description="Model confidence in diagnosis between 0.0 and 1.0."
    )


class TriageRequest(BaseModel):
    """Input payload for text-only or base64 multimodal triage."""
    description: str = Field(..., description="Casual student fault description, e.g. 'water is pouring from ceiling'")
    image_base64: Optional[str] = Field(None, description="Base64-encoded image string (data:image/jpeg;base64,... or raw base64)")
    location: Optional[str] = Field(None, description="Hostel room or common area location, e.g. 'Block B, Room 304'")
    student_id: Optional[str] = Field(None, description="Student matriculation or user ID")


class TicketStatus(str, Enum):
    LOGGED = "Logged"
    TRIAGED = "Triaged"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    AWAITING_PARTS = "Awaiting Parts"
    RESOLVED = "Resolved"
    CANCELLED = "Cancelled"


class MaintenanceTicket(BaseModel):
    """Hostel maintenance ticket model."""
    ticket_id: str
    student_id: str
    student_name: str
    location: str
    trade_category: TradeCategory
    urgency_score: int
    title: str
    description: str
    status: TicketStatus
    assigned_technician: Optional[str] = None
    technician_phone: Optional[str] = None
    created_at: str
    updated_at: str
    estimated_arrival: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    image_attached: bool = False


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="Student query in natural language")
    student_id: Optional[str] = Field("STU-8821", description="Current logged-in student ID")
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)


class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: dict
    result: dict


class ChatResponse(BaseModel):
    reply: str
    tool_calls: List[ToolCallRecord] = Field(default_factory=list)
    student_id: str
