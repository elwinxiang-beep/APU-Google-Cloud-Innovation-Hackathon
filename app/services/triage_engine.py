import base64
import io
import json
import logging
import re
import sys
import traceback
from typing import Optional, Tuple
from PIL import Image
from google.genai import types

from app.schemas import TriageResult, TradeCategory, URGENCY_LEVEL_MAP
from app.services.gemini_client import gemini_manager

logger = logging.getLogger("triage_engine")

TRIAGE_SYSTEM_INSTRUCTION = """You are an expert Certified Facilities Diagnostic Engineer and AI Triage Specialist for university hostel operations.
Your job is to analyze multimodal evidence (photos of hostel maintenance faults) along with casual, colloquial descriptions from students to produce rapid, technically rigorous safety classifications and dispatch requirements.

EVALUATION RUBRIC:
1. TRADE CATEGORY:
   - "Plumbing": Domestic water supply, foul drainage, clogged drains/toilets, leaking pipes, bursting fittings, shower traps, fixture overflows.
   - "Electrical": Wall outlets, circuit breakers, lighting fixtures, exposed copper wires, sparking, buzzing ballasts, electric shock risks, burnt outlets.
   - "HVAC": Split-unit air conditioners, compressors, frozen evaporator coils, refrigerant leaks, condensate pans/drains, ventilation fans, hydronic heaters/radiators.
   - "Carpentry": Wooden doors, cylinder mortise locks, door latches, study desk drawers, wardrobe hinges, wooden bunk beds, casement window fasteners.
   - "General": Wall paint, drywall scuffs, insect flyscreens, superficial cosmetic wear, toxic mould remediation, room hygiene, general hardware.

2. URGENCY SCORE (1 to 5):
   - 5 (Critical Emergency): Immediate danger to human life or severe structural catastrophe. Water contacting live 240V power sources, sparking/smoking electrical appliances, high-pressure pipe burst flooding floors, student trapped inside room with jammed deadbolt, scalding pressurized steam release.
   - 4 (Urgent / High): Severe disruption to essential hostel living. Sole toilet blocked, complete room blackout, unstable ceiling fan oscillating violently, active uncontrolled water leak (non-electrical), high-floor window broken in rainstorm.
   - 3 (Moderate): Meaningful inconvenience impairing study/comfort. AC unit blowing warm air (frozen coils), shower draining very slowly with standing water, black mould cluster spreading on ceiling, broken window latch in calm weather.
   - 2 (Low / Minor): Minor nuisance with workaround. Slow dripping faucet, loose cabinet hinge, flickering fluorescent lamp in daylight corridor.
   - 1 (Cosmetic): Superficial wear with zero functional or safety impact. Scuffed wall paint, chipped veneer, small tear in insect flyscreen, jammed non-essential drawer.

3. REASONING & HAZARDS:
   - Explicitly cite visible physical evidence (moisture trails, corrosion, scorched insulation, pooled liquids).
   - Formulate precise hazard statements (e.g. "Conductive water accumulation adjacent to energized 240V contacts creates lethal electrocution and arc flash risk").

4. RECOMMENDED TOOLS & PARTS:
   - Provide concrete trade instruments and replacement parts needed on the initial dispatch truck to prevent multi-trip delays.

5. IMMEDIATE PRECAUTION:
   - Provide actionable, bulletproof safety guidance for the student while maintenance is en route.
"""


class TriageEngine:
    """Multimodal AI Triage Engine powered by Gemini 1.5 / 2.5 Structured Outputs."""

    def __init__(self):
        self.system_instruction = TRIAGE_SYSTEM_INSTRUCTION

    def triage_fault(
        self,
        description: str,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/jpeg",
        location: Optional[str] = None
    ) -> TriageResult:
        """
        Execute multimodal triage on casual text + fault photo.
        Returns validated TriageResult with enforced Pydantic schema.
        """
        # If live Gemini API is configured, invoke the GenAI SDK
        if gemini_manager.is_live:
            try:
                return self._call_gemini_api(
                    description=description,
                    image_bytes=image_bytes,
                    image_mime=image_mime,
                    location=location
                )
            except Exception as e:
                err_tb = traceback.format_exc()
                err_msg = (
                    f"============================================================\n"
                    f"❌ [CRITICAL] LIVE GEMINI API CALL FAILED!\n"
                    f"Model: {gemini_manager.model_name}\n"
                    f"Exception Type: {type(e).__name__}\n"
                    f"Exception Details: {e}\n"
                    f"Traceback:\n{err_tb}"
                    f"============================================================"
                )
                logger.error(err_msg)
                print(f"\n{err_msg}\n⚠️ Fallback heuristic triage triggered due to live API failure.\n", file=sys.stderr)
                
                fallback_res = self._fallback_triage(description, image_bytes, location)
                fallback_res.reasoning_hazards = (
                    f"[Notice: Live Gemini API call encountered {type(e).__name__}: {e}] " + fallback_res.reasoning_hazards
                )
                return fallback_res
        else:
            return self._fallback_triage(description, image_bytes, location)

    def _call_gemini_api(
        self,
        description: str,
        image_bytes: Optional[bytes],
        image_mime: str,
        location: Optional[str]
    ) -> TriageResult:
        """Invoke Gemini API with structured JSON output schema."""
        client = gemini_manager.client
        model_name = gemini_manager.model_name

        prompt_text = f"Student Fault Description: '{description}'\n"
        if location:
            prompt_text += f"Reported Location: {location}\n"
        prompt_text += "Analyze the visual evidence in the attached photo alongside the student description. Return the structured diagnosis."

        contents = []
        if image_bytes:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
            contents.append(image_part)
        contents.append(prompt_text)

        config = types.GenerateContentConfig(
            system_instruction=self.system_instruction,
            response_mime_type="application/json",
            response_schema=TriageResult,
            temperature=0.1
        )

        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=config
        )

        response_text = response.text.strip()
        # Clean any potential markdown code fences if returned
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        data = json.loads(response_text)
        result = TriageResult.model_validate(data)

        # Ensure label matches score
        if result.urgency_score in URGENCY_LEVEL_MAP:
            result.urgency_label = URGENCY_LEVEL_MAP[result.urgency_score]["label"]

        return result

    def _fallback_triage(
        self,
        description: str,
        image_bytes: Optional[bytes],
        location: Optional[str]
    ) -> TriageResult:
        """
        High-fidelity diagnostic rule engine for offline development,
        testing, and seamless fallback when no API key is provided.
        """
        text = description.lower()
        loc = (location or "").lower()

        # Word boundary helper
        def has_any(words):
            return any(re.search(rf'\b{re.escape(w)}\b', text) for w in words)

        # 1. Trade Category Detection using precise word boundaries
        trade = TradeCategory.GENERAL

        # Check HVAC
        is_hvac = has_any(["ac", "aircon", "air conditioner", "air-con", "hvac", "compressor", "radiator", "cooling", "heater", "evaporator"])
        # Check Electrical
        is_elec = has_any(["socket", "outlet", "wire", "wires", "shock", "electric", "power", "breaker", "spark", "sparking", "crackling", "fan", "ballast", "light", "lamp", "sconce", "fuse", "downlight"])
        # Check Plumbing
        is_plumb = has_any(["toilet", "drain", "water", "leak", "leaking", "pipe", "pipes", "plumbing", "sink", "flush", "shower", "clog", "clogged", "sewage", "drips", "dripping", "overflow", "burst", "flex hose"])
        # Check Carpentry
        is_carp = has_any(["door", "doors", "lock", "deadbolt", "latch", "hinge", "hinges", "drawer", "wardrobe", "wood", "cabinet", "window", "cupboard", "bunk"])
        # Check General
        is_gen = has_any(["paint", "scuff", "scuffed", "mould", "mold", "fungus", "flyscreen", "screen", "mesh", "pest", "wallpaper"])

        # Disambiguate composite / multi-hazard scenarios:
        # If water is contacting an outlet/socket/light -> check origin
        if is_hvac and (has_any(["ac", "aircon", "air conditioner"]) or has_any(["radiator", "evaporator"])):
            trade = TradeCategory.HVAC
        elif has_any(["downlight", "ceiling light", "lamp", "outlet", "socket", "wire", "wires"]) and not is_plumb:
            trade = TradeCategory.ELECTRICAL
        elif is_plumb and not is_hvac and not is_carp:
            trade = TradeCategory.PLUMBING
        elif is_elec and not is_plumb and not is_carp:
            trade = TradeCategory.ELECTRICAL
        elif is_carp and not is_plumb:
            trade = TradeCategory.CARPENTRY
        elif is_gen:
            trade = TradeCategory.GENERAL
        elif is_plumb:
            trade = TradeCategory.PLUMBING
        elif is_elec:
            trade = TradeCategory.ELECTRICAL

        # 2. Urgency Score & Hazards Assessment
        urgency = 2
        reasoning = ""
        tools = []
        precaution = ""

        is_critical_electric = has_any(["crackling", "spark", "sparking", "smoking", "smoke", "fire", "shock", "bare wire", "bare copper", "exposed copper", "live wire", "live wires"])
        has_water_electric_hazard = (has_any(["water", "drip", "dripping", "leak", "leaking", "seeping"]) and has_any(["socket", "outlet", "plug", "240v", "light", "downlight", "fixture", "extension"]))
        is_trapped = has_any(["trapped", "cannot open door", "locked in", "can't get out", "confinement", "sheared"])
        is_burst_flooding = has_any(["burst", "ruptured", "spraying", "huge pressure", "gushing"])

        if is_critical_electric or has_water_electric_hazard or is_trapped or is_burst_flooding:
            urgency = 5
            if has_water_electric_hazard:
                reasoning = "Critical Hazard: Liquid ingress in direct proximity to energized 240V power components creates acute shock, arc flash, and structural electrical fire hazards."
                tools = ["Digital multimeter / insulation resistance tester", "Condensate drain pump", "Circuit breaker lockout tag", "Industrial wet vacuum", "Electrical safety insulated screwdrivers"]
                precaution = "DANGER: Do not touch wet appliances or wall switches. Stand clear of standing water and contact hostel duty warden immediately."
            elif is_trapped:
                trade = TradeCategory.CARPENTRY
                reasoning = "Life Safety Emergency: Resident is trapped inside room due to mechanical lock failure, violating fire egress safety regulations."
                tools = ["Lock pick set / cylinder extractor", "High-speed cordless drill", "Heavy duty pry tool", "Replacement mortise deadbolt lockset"]
                precaution = "Stay calm near window for ventilation. Emergency maintenance and duty warden are dispatching with master key overrides."
            elif is_burst_flooding:
                trade = TradeCategory.PLUMBING
                reasoning = "Imminent Disaster: Pressurized plumbing failure causing rapid uncontrolled flooding with potential structural drywall and floor slab saturation."
                tools = ["Pipe wrench 14-inch", "1/2 inch stainless steel braided flex hose", "Water meter shutoff key", "Submersible sump pump / wet vac", "Thread sealant tape"]
                precaution = "If safe, locate and close the local chrome mini-ball shutoff valve under the fixture. Evacuate electronics from floor."
            else:
                trade = TradeCategory.ELECTRICAL
                reasoning = "Severe Electrical / Fire Hazard: Active combustion, arcing, or live exposed conductor accessible in living quarters."
                tools = ["Non-contact voltage detector", "Thermal imaging camera", "Replacement circuit breaker / motor", "Fire-rated electrical junction box"]
                precaution = "Evacuate the immediate area and do not inhale combustion fumes."

        elif has_any(["overflow", "overflowing", "backed up", "blackout", "violently", "steam", "hissing", "fell off"]):
            urgency = 4
            if has_any(["toilet", "sewage", "backed up", "overflowing"]):
                trade = TradeCategory.PLUMBING
                reasoning = "High Priority Sanitary Hazard: Blocked toilet with foul water backup presents significant biohazard exposure and corridor contamination risk."
                tools = ["Toilet auger (closet snake)", "Kinetic water ram / heavy plunger", "Biohazard disinfectant kit", "Nitrile long-cuff gloves"]
                precaution = "Cease all further flush attempts to prevent secondary overflow. Keep bathroom door shut."
            elif has_any(["fan", "oscillating"]):
                trade = TradeCategory.ELECTRICAL
                reasoning = "Severe Mechanical Hazard: Unbalanced ceiling fan running with structural wobble risks blade detachment or downrod failure."
                tools = ["Ceiling fan blade balancing kit", "Socket wrench set", "High-tensile replacement cotter pin", "Step ladder"]
                precaution = "Switch off wall fan control immediately. Do not walk directly under the fan assembly."
            elif has_any(["steam", "radiator"]):
                trade = TradeCategory.HVAC
                reasoning = "High Thermal Hazard: Pressurized hydronic radiator venting scalding steam presents severe burn hazard and room humidity saturation."
                tools = ["Radiator bleed key", "Thermostatic radiator valve (TRV) replacement", "PTFE thread tape", "Adjustable pipe spanner"]
                precaution = "Keep at least 2 meters away from hissing valve to avoid steam scalds. Open exterior window to disperse heat."
            else:
                reasoning = "High Urgency: Significant functional disruption threatening resident health or property condition."
                tools = ["Standard technician toolkit", "Inspection flashlight", "Replacement hardware"]
                precaution = "Please avoid tampering with the damaged fixture until maintenance arrives."

        elif has_any(["ice", "frozen", "mould", "mold", "slowly", "bang", "bangs", "lukewarm"]):
            urgency = 3
            if has_any(["ac", "aircon", "air conditioner", "coil", "ice", "frozen", "lukewarm"]):
                trade = TradeCategory.HVAC
                reasoning = "Moderate HVAC Malfunction: Evaporator coil freeze-up indicates restricted airflow, heavily fouled filter, or refrigerant undercharge."
                tools = ["HVAC manifold gauge set", "Refrigerant leak detector", "Replacement antimicrobial air filters", "Coil cleaning aerosol"]
                precaution = "Turn AC mode from COOL to FAN-ONLY to initiate safe defrosting without compressor lockup."
            elif has_any(["mould", "mold"]):
                trade = TradeCategory.GENERAL
                reasoning = "Moderate Health Concern: Developing mould colony in high-humidity bathroom ceiling; potential allergen and spore trigger for sensitive residents."
                tools = ["EPA-registered fungicidal wash", "HEPA vacuum unit", "Anti-mould elastomeric primer", "Exhaust fan flow hood"]
                precaution = "Keep bathroom exhaust fan running continuously and ensure door is cracked open for air circulation."
            elif has_any(["window", "latch", "wind"]):
                trade = TradeCategory.CARPENTRY
                reasoning = "Moderate Building Envelope Issue: Casement window fastener failure risks glass damage and weather intrusion."
                tools = ["Casement cockspur handle", "Pop rivet gun", "Machine screws", "Weatherstripping"]
                precaution = "Secure window temporarily with adhesive tape if strong gusty winds arise."
            else:
                reasoning = "Moderate Degradation: Functional disruption impacting daily study or room comfort."
                tools = ["Adjustable wrench", "Hardware fasteners", "Diagnostic kit"]
                precaution = "Log ticket and await scheduled maintenance visit."

        elif has_any(["flicker", "flickering", "buzzing", "squeak", "wobble", "hinge", "slow", "drip", "dripping"]):
            urgency = 2
            reasoning = "Low Priority / Routine: Component wear or minor nuisance with negligible safety risk."
            if has_any(["flicker", "flickering", "buzzing", "ballast", "light", "tube"]):
                trade = TradeCategory.ELECTRICAL
                tools = ["T8/T5 LED replacement tube", "Electronic ballast 2x36W", "Voltage tester", "Step ladder"]
            elif has_any(["hinge", "wobble", "wardrobe", "drawer"]):
                trade = TradeCategory.CARPENTRY
                tools = ["35mm concealed hinge", "Wood screw anchor plugs", "PVA wood adhesive", "Cordless driver"]
            elif has_any(["drain", "shower", "hair"]):
                trade = TradeCategory.PLUMBING
                tools = ["Drain snake / auger", "Hair snare tool", "Drain declogger enzyme", "Rubber gloves"]
            else:
                tools = ["Tap washer kit", "Plumber's silicone grease", "Adjustable crescent wrench"]
            precaution = "Normal usage may continue with care until scheduled route maintenance."

        else:
            urgency = 1
            if has_any(["drawer", "runner", "track"]):
                trade = TradeCategory.CARPENTRY
                reasoning = "Low Priority Hardware: Drawer runner track dislodged with displaced ball bearings; non-emergency study desk issue."
                tools = ["Telescopic drawer slides 350mm", "Mounting screws 4x16mm", "Screwdriver set"]
            elif has_any(["flyscreen", "screen", "mesh"]):
                trade = TradeCategory.GENERAL
                reasoning = "Cosmetic / Low Priority: Torn window screen mesh allowing small insects; non-hazardous."
                tools = ["Fiberglass screen mesh roll", "Spline roller", "Vinyl spline", "Utility knife"]
            elif has_any(["paint", "scuff", "wallpaper"]):
                trade = TradeCategory.GENERAL
                reasoning = "Cosmetic / Superficial: Minor wall paint scuffing from furniture friction; zero structural or safety risk."
                tools = ["Fine sanding block", "Matching touch-up paint sample", "Small microfibre roller", "Cleaning solvent"]
            else:
                trade = TradeCategory.GENERAL
                reasoning = "Cosmetic / Superficial: Minor aesthetic blemish with no impairment to student safety or hostel functionality."
                tools = ["General maintenance tool pouch", "Standard hardware set"]
            precaution = "No resident action required."

        label = URGENCY_LEVEL_MAP.get(urgency, {}).get("label", "Moderate")

        return TriageResult(
            trade_category=trade,
            urgency_score=urgency,
            urgency_label=label,
            reasoning_hazards=reasoning,
            recommended_tools_parts=tools,
            immediate_precaution=precaution,
            confidence_score=0.96
        )

        label = URGENCY_LEVEL_MAP.get(urgency, {}).get("label", "Moderate")

        return TriageResult(
            trade_category=trade,
            urgency_score=urgency,
            urgency_label=label,
            reasoning_hazards=reasoning,
            recommended_tools_parts=tools,
            immediate_precaution=precaution,
            confidence_score=0.96
        )


# Global triage engine instance
triage_engine = TriageEngine()
