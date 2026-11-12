"""Curated Benchmark Dataset of 18 Realistic Hostel Fault Scenarios.
Covers all 5 Trade Categories (Plumbing, Electrical, HVAC, Carpentry, General)
across all Urgency Levels (1 = Cosmetic to 5 = Critical Emergency).
"""
from typing import List, Dict, Any, Optional
from app.schemas import TradeCategory


BENCHMARK_CASES: List[Dict[str, Any]] = [
    {
        "id": "TC-01",
        "title": "Leaking AC above Electrical Socket",
        "casual_text": "Bro my room AC in Block B is literally dripping dirty water right onto my 240V power outlet and multi-plug extension cord! Heard slight crackling sound.",
        "expected_trade": TradeCategory.HVAC.value,
        "secondary_trade": TradeCategory.ELECTRICAL.value,
        "expected_urgency": 5,
        "hazard_keywords": ["water", "electrical", "240v", "outlet", "electrocution", "fire", "sparking", "crackling"],
        "expected_tools": ["multimeter", "condensate pump", "drain line cleaner", "circuit tester", "catch bucket", "insulation tape"],
        "image_file": "tc01_ac_leak_socket.png",
        "visual_description": "Wall split-unit AC with condensed water droplet streams pooling directly onto a wall socket with power strip plugged in."
    },
    {
        "id": "TC-02",
        "title": "Blocked Overflowing Communal Toilet",
        "casual_text": "The 2nd floor communal toilet is completely backed up. Someone flushed and brownish foul water is overflowing onto the tiled hallway floor.",
        "expected_trade": TradeCategory.PLUMBING.value,
        "secondary_trade": None,
        "expected_urgency": 4,
        "hazard_keywords": ["contamination", "biohazard", "overflow", "blackwater", "slip hazard", "flooding"],
        "expected_tools": ["toilet auger", "heavy duty plunger", "wet vac", "disinfectant", "protective gloves"],
        "image_file": "tc02_toilet_overflow.png",
        "visual_description": "Ceramic toilet bowl filled to rim with murky contaminated water spilling over the edges onto bathroom floor tiles."
    },
    {
        "id": "TC-03",
        "title": "Flickering Hallway Fluorescent Light & Buzzing",
        "casual_text": "The light outside room 314 in the hallway keeps strobing and flashing like a strobe light, and the ballast is emitting an annoying high-pitched buzzing.",
        "expected_trade": TradeCategory.ELECTRICAL.value,
        "secondary_trade": None,
        "expected_urgency": 2,
        "hazard_keywords": ["strobe", "ballast overheating", "nuisance", "flicker"],
        "expected_tools": ["fluorescent tube", "LED replacement tube", "electronic ballast", "step ladder", "voltage tester"],
        "image_file": "tc03_hallway_flickering_light.png",
        "visual_description": "Ceiling fixture with 4-foot fluorescent tube with blackened ends flickering unevenly in corridor."
    },
    {
        "id": "TC-04",
        "title": "Exposed Frayed Live Wires on Wall Sconce",
        "casual_text": "Someone bumped into the wall light bracket in the stairwell and the cover snapped off. Bare copper wires are hanging out right at head height.",
        "expected_trade": TradeCategory.ELECTRICAL.value,
        "secondary_trade": None,
        "expected_urgency": 5,
        "hazard_keywords": ["bare copper", "exposed live wire", "electrocution", "stairwell", "head height", "shock hazard"],
        "expected_tools": ["wire strippers", "voltage pen tester", "wire nuts", "electrical tape", "replacement fixture bracket"],
        "image_file": "tc04_exposed_wires.png",
        "visual_description": "Broken plastic light enclosure with stripped live and neutral copper wire ends protruding into walking path."
    },
    {
        "id": "TC-05",
        "title": "Jammed Deadbolt Lock Trapping Student in Room",
        "casual_text": "I turned my bedroom door key and the cylinder sheared inside! The latch won't retract and I have an exam in 40 minutes, I cannot open the door from inside.",
        "expected_trade": TradeCategory.CARPENTRY.value,
        "secondary_trade": TradeCategory.GENERAL.value,
        "expected_urgency": 5,
        "hazard_keywords": ["trapped", "confinement", "fire egress", "blocked exit", "emergency"],
        "expected_tools": ["lock picking kit", "cylinder extractor", "replacement mortise lock", "cordless drill", "chisel"],
        "image_file": "tc05_jammed_deadbolt.png",
        "visual_description": "Wooden hostel bedroom door with broken key visible in cylinder and jammed latch bolt."
    },
    {
        "id": "TC-06",
        "title": "Standing Water in Shower from Hair Clog",
        "casual_text": "Water drains super slowly in shower stall 3. By the end of a 5 minute shower there is 2 inches of standing dirty water around your ankles.",
        "expected_trade": TradeCategory.PLUMBING.value,
        "secondary_trade": None,
        "expected_urgency": 2,
        "hazard_keywords": ["slow drainage", "hair blockage", "soap scum", "hygiene", "standing water"],
        "expected_tools": ["drain snake / auger", "hair snare", "drain chemical cleaner", "pliers", "rubber gloves"],
        "image_file": "tc06_shower_drain_clog.png",
        "visual_description": "Chrome shower floor strainer with visible hair accumulation and soapy standing pool."
    },
    {
        "id": "TC-07",
        "title": "Burst Pipe under Pantry Sink Spraying High Pressure",
        "casual_text": "Urgent! The flex hose under the Level 2 pantry sink just ruptured! Water is spraying with huge pressure all over the cabinets and onto the kitchen floor!",
        "expected_trade": TradeCategory.PLUMBING.value,
        "secondary_trade": None,
        "expected_urgency": 5,
        "hazard_keywords": ["burst pipe", "high pressure spray", "flooding", "water damage", "structural floor soaking"],
        "expected_tools": ["pipe wrench", "braided flex hose 1/2 inch", "shutoff key", "Teflon thread tape", "mop / wet vac"],
        "image_file": "tc07_burst_sink_pipe.png",
        "visual_description": "Ruptured stainless steel braided supply line spraying a continuous jet of water against sink cabinet interior."
    },
    {
        "id": "TC-08",
        "title": "AC Blowing Lukewarm Air with Frozen Evaporator Coils",
        "casual_text": "Our room air conditioner has been running on 16C for 3 hours but it only blows warm humid air. When I opened the front grill there is a thick block of white ice.",
        "expected_trade": TradeCategory.HVAC.value,
        "secondary_trade": None,
        "expected_urgency": 3,
        "hazard_keywords": ["frozen coil", "refrigerant leak", "compressor strain", "clogged filter", "airflow restriction"],
        "expected_tools": ["manifold gauges", "refrigerant leak detector", "coil cleaning foam", "air filter replacements", "temperature probe"],
        "image_file": "tc08_ac_frozen_coils.png",
        "visual_description": "Split AC indoor unit front cover open showing evaporator aluminum fins caked in white frost and frostbite."
    },
    {
        "id": "TC-09",
        "title": "Wobbly Wardrobe Hinge with Stripped Screws",
        "casual_text": "The top hinge on my dorm wardrobe came loose. The screw holes in the particle board look completely stripped and the heavy door is sagging at an angle.",
        "expected_trade": TradeCategory.CARPENTRY.value,
        "secondary_trade": None,
        "expected_urgency": 2,
        "hazard_keywords": ["stripped screw", "sagging door", "falling hazard", "pinch point"],
        "expected_tools": ["wood anchors / dowels", "PVA wood glue", "cordless driver", "replacement euro concealed hinges", "wood filler"],
        "image_file": "tc09_wobbly_wardrobe_hinge.png",
        "visual_description": "Melamine wardrobe carcass with top metal hinge pulled away from crumbly screw holes."
    },
    {
        "id": "TC-10",
        "title": "Window Latch Broken & Glass Panes Rattling in Wind",
        "casual_text": "The casement window fastener on the 5th floor won't clamp shut. Whenever the wind blows the window bangs loudly and rain starts blowing inside.",
        "expected_trade": TradeCategory.CARPENTRY.value,
        "secondary_trade": TradeCategory.GENERAL.value,
        "expected_urgency": 3,
        "hazard_keywords": ["window sash", "glass breakage risk", "wind intrusion", "rain ingress", "high floor safety"],
        "expected_tools": ["casement window cockspur handle", "pop rivet gun", "machine screws", "screwdriver set", "weatherstripping"],
        "image_file": "tc10_broken_window_latch.png",
        "visual_description": "Aluminum window frame with broken handle mechanism failing to engage keeper bracket."
    },
    {
        "id": "TC-11",
        "title": "Water Dripping from Ceiling into Recessed Light Fixture",
        "casual_text": "Water is actively seeping through the plasterboard ceiling and dripping straight through the center of our bathroom ceiling downlight. Drops are hitting the lightbulb.",
        "expected_trade": TradeCategory.PLUMBING.value,
        "secondary_trade": TradeCategory.ELECTRICAL.value,
        "expected_urgency": 5,
        "hazard_keywords": ["water in luminaire", "ceiling leak", "electrical fire", "short circuit", "plaster collapse", "shock"],
        "expected_tools": ["moisture meter", "voltage tester", "bucket", "pipe inspection camera", "step ladder"],
        "image_file": "tc11_water_dripping_downlight.png",
        "visual_description": "Brown water ring stain on white plasterboard ceiling with water drops falling from recessed circular LED downlight."
    },
    {
        "id": "TC-12",
        "title": "Spreading Toxic Black Mould Colony on Bathroom Ceiling",
        "casual_text": "There's a massive patch of dark velvety black mould expanding across our ensuite shower ceiling and grout. It smells musty and my roommate has asthma.",
        "expected_trade": TradeCategory.GENERAL.value,
        "secondary_trade": TradeCategory.HVAC.value,
        "expected_urgency": 3,
        "hazard_keywords": ["black mould", "fungal spores", "respiratory hazard", "ventilation failure", "asthma trigger"],
        "expected_tools": ["fungicidal spray", "HEPA respirator mask", "stiff scrubber", "mould-resistant primer/paint", "exhaust airflow anemometer"],
        "image_file": "tc12_black_mould_ceiling.png",
        "visual_description": "Extensive dark speckled mould cluster spreading across shower ceiling gypsum and tile grout."
    },
    {
        "id": "TC-13",
        "title": "Wobbling Ceiling Fan Grinding & Screws Loosening",
        "casual_text": "The ceiling fan in common room 101 is violently oscillating on medium speed and makes a heavy metallic clanking sound. Looks like the downrod pin is slipping.",
        "expected_trade": TradeCategory.ELECTRICAL.value,
        "secondary_trade": TradeCategory.CARPENTRY.value,
        "expected_urgency": 4,
        "hazard_keywords": ["falling object hazard", "severe imbalance", "blade detachment", "mechanical failure"],
        "expected_tools": ["fan balancing kit", "socket wrench set", "cotter pin / lock bolt", "ladder", "bearing lubricant"],
        "image_file": "tc13_wobbly_ceiling_fan.png",
        "visual_description": "Three-blade ceiling fan suspended by downrod with noticeable tilt and loose canopy screws."
    },
    {
        "id": "TC-14",
        "title": "Torn Window Flyscreen Insect Mesh",
        "casual_text": "The wire flyscreen on my study window has a 10cm tear in the bottom corner. Mosquitoes and beetles are crawling in at night.",
        "expected_trade": TradeCategory.GENERAL.value,
        "secondary_trade": None,
        "expected_urgency": 1,
        "hazard_keywords": ["insect entry", "nuisance", "screen tear", "cosmetic / low impact"],
        "expected_tools": ["fiberglass screen mesh roll", "spline roller", "vinyl spline", "utility knife"],
        "image_file": "tc14_torn_flyscreen.png",
        "visual_description": "Black fiberglass window screen with diagonal tear near aluminum extrusion frame."
    },
    {
        "id": "TC-15",
        "title": "Scuffed Wall Paint & Peeling Wallpaper Corner",
        "casual_text": "Behind where the desk chair sits, the white paint is scuffed with black rubber marks and a small 5cm strip of paint is flaking off.",
        "expected_trade": TradeCategory.GENERAL.value,
        "secondary_trade": None,
        "expected_urgency": 1,
        "hazard_keywords": ["cosmetic", "scuff marks", "peeling paint", "no functional damage"],
        "expected_tools": ["sugar soap / wall cleaner", "sandpaper 180 grit", "touch-up interior emulsion paint", "small roller"],
        "image_file": "tc15_scuffed_paint.png",
        "visual_description": "Drywall with grey shoe/chair scuff marks and small flaked paint patch."
    },
    {
        "id": "TC-16",
        "title": "Kitchen Range Hood Exhaust Fan Smoking & Acrid Smell",
        "casual_text": "Turned on the kitchen exhaust fan over stove #2 and within 10 seconds thick white smoke started wafting from the vent with a burning plastic smell!",
        "expected_trade": TradeCategory.ELECTRICAL.value,
        "secondary_trade": TradeCategory.HVAC.value,
        "expected_urgency": 5,
        "hazard_keywords": ["smoke", "burning plastic", "motor seizure", "fire hazard", "electrical fire"],
        "expected_tools": ["replacement shaded-pole fan motor", "voltage tester", "fire safety lockout tag", "wire crimpers", "screwdrivers"],
        "image_file": "tc16_smoking_exhaust_fan.png",
        "visual_description": "Stainless steel range hood with grease filters and smoke haze emerging from blower motor housing."
    },
    {
        "id": "TC-17",
        "title": "Hydronic Radiator Hissing Boiling Steam from Bleed Valve",
        "casual_text": "The heater radiator in room 405 is banging loudly like metal pipes hammering, and hot steam is hissing out around the top valve screw.",
        "expected_trade": TradeCategory.HVAC.value,
        "secondary_trade": TradeCategory.PLUMBING.value,
        "expected_urgency": 4,
        "hazard_keywords": ["scalding steam", "high pressure radiator", "burn hazard", "water hammer", "valve failure"],
        "expected_tools": ["radiator bleed key", "thermostatic valve replacement", "Teflon tape", "adjustable spanner", "catch tray"],
        "image_file": "tc17_radiator_steam_hiss.png",
        "visual_description": "Cast iron radiator with steam plume escaping from corroded bleeder vent valve."
    },
    {
        "id": "TC-18",
        "title": "Desk Study Drawer Jammed on Damaged Ball-Bearing Runner",
        "casual_text": "The middle drawer of my study desk slipped off its metal roller runner. The small ball bearings spilled out and the drawer is wedged half-open.",
        "expected_trade": TradeCategory.CARPENTRY.value,
        "secondary_trade": None,
        "expected_urgency": 1,
        "hazard_keywords": ["jammed drawer", "loose ball bearings", "runner track failure", "minor inconvenience"],
        "expected_tools": ["telescopic drawer slide pair 350mm", "screws 4x16mm", "crosshead screwdriver", "pliers"],
        "image_file": "tc18_jammed_drawer.png",
        "visual_description": "Particle board study desk drawer stuck skewed at 30 degrees with visible steel ball bearings on track."
    }
]


def get_all_benchmarks() -> List[Dict[str, Any]]:
    """Return all curated benchmark fault scenarios."""
    return BENCHMARK_CASES


def get_benchmark_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    """Look up a specific benchmark case."""
    clean_id = case_id.strip().upper()
    for case in BENCHMARK_CASES:
        if case["id"].upper() == clean_id:
            return case
    return None
