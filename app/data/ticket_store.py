import datetime
from typing import Dict, List, Optional
from app.schemas import MaintenanceTicket, TicketStatus, TradeCategory


class TicketStore:
    """In-memory ticket repository preloaded with realistic hostel tickets."""

    def __init__(self):
        self._tickets: Dict[str, MaintenanceTicket] = {}
        self._seed_sample_tickets()

    def _seed_sample_tickets(self):
        """Seed realistic hostel tickets with diverse statuses, technicians, and trades."""
        samples = [
            MaintenanceTicket(
                ticket_id="TICK-1024",
                student_id="STU-8821",
                student_name="Alex Chen",
                location="Block B, Room 304",
                trade_category=TradeCategory.HVAC,
                urgency_score=4,
                title="Leaking split AC dripping onto electrical desk setup",
                description="My AC is leaking heavily right over my extension cord on the study table. Water is accumulating fast.",
                status=TicketStatus.IN_PROGRESS,
                assigned_technician="Dave Miller (HVAC Specialist)",
                technician_phone="+65 9123 4567",
                created_at="2026-11-11 09:15:00",
                updated_at="2026-11-11 11:30:00",
                estimated_arrival="Within 45 minutes (approx 12:15 PM)",
                notes=[
                    "09:15 - Ticket logged via student portal.",
                    "09:30 - AI Triage flagged electrical hazard (Urgency 4). High priority dispatch triggered.",
                    "10:00 - Assigned to Dave Miller.",
                    "11:30 - Technician Dave: 'Picked up condensate drain pump and coil cleaner from central depot, en route to Block B.'"
                ],
                image_attached=True,
            ),
            MaintenanceTicket(
                ticket_id="TICK-1025",
                student_id="STU-8821",
                student_name="Alex Chen",
                location="Block B, Room 304 Bathroom",
                trade_category=TradeCategory.PLUMBING,
                urgency_score=2,
                title="Slow shower drain with hair blockage",
                description="Water pools around feet during shower, takes 15 mins to drain out.",
                status=TicketStatus.ASSIGNED,
                assigned_technician="Ravi Kumar (Plumber)",
                technician_phone="+65 9234 5678",
                created_at="2026-11-10 14:00:00",
                updated_at="2026-11-11 08:30:00",
                estimated_arrival="Today between 3:00 PM - 5:00 PM",
                notes=[
                    "Nov 10 14:00 - Ticket logged.",
                    "Nov 11 08:30 - Scheduled for afternoon plumbing batch route in Block B."
                ],
                image_attached=False,
            ),
            MaintenanceTicket(
                ticket_id="TICK-1018",
                student_id="STU-9042",
                student_name="Samantha Lee",
                location="Block B, 3rd Floor Communal Bathroom",
                trade_category=TradeCategory.ELECTRICAL,
                urgency_score=3,
                title="Flickering fluorescent tube light in communal shower",
                description="Light strobes continuously when switched on, making high-pitched buzzing hum.",
                status=TicketStatus.AWAITING_PARTS,
                assigned_technician="Marcus Vance (Electrician)",
                technician_phone="+65 9345 6789",
                created_at="2026-11-09 18:20:00",
                updated_at="2026-11-10 16:45:00",
                estimated_arrival="Tomorrow morning (Nov 12, 10:00 AM)",
                notes=[
                    "Nov 09 18:20 - Logged by Samantha.",
                    "Nov 10 11:00 - Technician Marcus inspected: Electronic ballast is burnt out. 4ft LED retrofit tubes requested from supplier."
                ],
                image_attached=True,
            ),
            MaintenanceTicket(
                ticket_id="TICK-1002",
                student_id="STU-8821",
                student_name="Alex Chen",
                location="Block B, Room 304",
                trade_category=TradeCategory.CARPENTRY,
                urgency_score=1,
                title="Loose wardrobe door hinge",
                description="Top hinge of wardrobe door is wobbling and squeaking.",
                status=TicketStatus.RESOLVED,
                assigned_technician="Kenji Sato (Carpenter)",
                technician_phone="+65 9456 7890",
                created_at="2026-11-05 10:00:00",
                updated_at="2026-11-06 14:15:00",
                estimated_arrival="Completed",
                notes=[
                    "Nov 05 10:00 - Logged.",
                    "Nov 06 14:15 - Replaced stripped screws with 35mm wood anchors and realigned cabinet door. Tested OK."
                ],
                image_attached=False,
            ),
            MaintenanceTicket(
                ticket_id="TICK-1030",
                student_id="STU-7751",
                student_name="Priya Patel",
                location="Block A, Room 112",
                trade_category=TradeCategory.CARPENTRY,
                urgency_score=5,
                title="Room door latch completely jammed, student trapped inside",
                description="Deadbolt jammed inside doorframe. Handle spins freely. Cannot exit the room.",
                status=TicketStatus.IN_PROGRESS,
                assigned_technician="Emergency Locksmith Unit (Fast Response)",
                technician_phone="+65 9888 1111",
                created_at="2026-11-11 10:45:00",
                updated_at="2026-11-11 10:50:00",
                estimated_arrival="Urgent on-site (ETA 10 mins)",
                notes=[
                    "10:45 - Emergency code triggered: student confinement hazard.",
                    "10:50 - Duty Warden and Locksmith dispatched immediately."
                ],
                image_attached=False,
            ),
            MaintenanceTicket(
                ticket_id="TICK-1033",
                student_id="STU-6310",
                student_name="Liam Wilson",
                location="Block C, Ground Floor Laundry Room",
                trade_category=TradeCategory.PLUMBING,
                urgency_score=4,
                title="Washing machine drain backing up and flooding floor",
                description="Water gushing out of rear discharge standpipe whenever washer cycles.",
                status=TicketStatus.ASSIGNED,
                assigned_technician="Ravi Kumar (Plumber)",
                technician_phone="+65 9234 5678",
                created_at="2026-11-11 08:00:00",
                updated_at="2026-11-11 08:20:00",
                estimated_arrival="Today by 1:30 PM",
                notes=[
                    "08:00 - Report received from laundry monitor.",
                    "08:20 - Isolation valve shut off. Plumber assigned for drain augering."
                ],
                image_attached=True,
            )
        ]
        for t in samples:
            self._tickets[t.ticket_id.upper()] = t

    def get_ticket(self, ticket_id: str) -> Optional[MaintenanceTicket]:
        """Fetch ticket by ID (case-insensitive)."""
        clean_id = ticket_id.strip().upper()
        if not clean_id.startswith("TICK-") and clean_id.isdigit():
            clean_id = f"TICK-{clean_id}"
        return self._tickets.get(clean_id)

    def search_tickets(
        self,
        student_id: Optional[str] = None,
        location: Optional[str] = None,
        trade: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[MaintenanceTicket]:
        """Filter tickets based on various criteria."""
        results = list(self._tickets.values())

        if student_id and isinstance(student_id, str):
            s_clean = student_id.strip().upper()
            results = [t for t in results if s_clean in t.student_id.upper()]

        if location and isinstance(location, str):
            loc_clean = location.strip().lower()
            results = [t for t in results if loc_clean in t.location.lower()]

        if trade and isinstance(trade, str):
            trade_clean = trade.strip().lower()
            results = [t for t in results if trade_clean in t.trade_category.value.lower()]

        if status and isinstance(status, str):
            stat_clean = status.strip().lower()
            results = [t for t in results if stat_clean in t.status.value.lower()]

        return sorted(results, key=lambda x: x.created_at, reverse=True)

    def add_ticket(
        self,
        student_id: str,
        student_name: str,
        location: str,
        trade_category: TradeCategory,
        urgency_score: int,
        title: str,
        description: str,
        image_attached: bool = False
    ) -> MaintenanceTicket:
        """Create and store a newly triaged ticket."""
        new_num = 1000 + len(self._tickets) + 1
        ticket_id = f"TICK-{new_num}"
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        ticket = MaintenanceTicket(
            ticket_id=ticket_id,
            student_id=student_id,
            student_name=student_name,
            location=location,
            trade_category=trade_category,
            urgency_score=urgency_score,
            title=title,
            description=description,
            status=TicketStatus.TRIAGED,
            created_at=now_str,
            updated_at=now_str,
            notes=[f"{now_str} - Triaged by Gemini AI Engine. Urgency Score: {urgency_score}/5 ({trade_category.value})."],
            image_attached=image_attached
        )
        self._tickets[ticket_id] = ticket
        return ticket

    def escalate_ticket(self, ticket_id: str, reason: str) -> Optional[MaintenanceTicket]:
        """Escalate an existing ticket with student justification."""
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ticket.urgency_score = min(5, ticket.urgency_score + 1)
        ticket.updated_at = now_str
        ticket.notes.append(f"{now_str} - [ESCALATED BY STUDENT] Reason: {reason}. Urgency adjusted to {ticket.urgency_score}/5.")
        return ticket

    def list_all(self) -> List[MaintenanceTicket]:
        """Return all tickets in chronological order."""
        return sorted(self._tickets.values(), key=lambda x: x.created_at, reverse=True)


# Global singleton store instance
ticket_store = TicketStore()
