import os
import sys
import json
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from PIL import Image, ImageDraw, ImageFont
from app.data.benchmark_cases import BENCHMARK_CASES

BENCHMARK_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BENCHMARK_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

TRADE_COLORS = {
    "HVAC": (30, 144, 255),       # Dodger Blue
    "Plumbing": (0, 191, 255),    # Deep Sky Blue
    "Electrical": (255, 165, 0),  # Orange / Warning
    "Carpentry": (139, 69, 19),   # Saddle Brown
    "General": (112, 128, 144)    # Slate Gray
}

URGENCY_COLORS = {
    5: (220, 20, 60),    # Crimson Red
    4: (255, 69, 0),     # Orange Red
    3: (255, 140, 0),    # Dark Orange
    2: (60, 179, 113),   # Medium Sea Green
    1: (70, 130, 180)    # Steel Blue
}


def create_synthetic_fault_image(case: dict) -> Path:
    """
    Generate an annotated, realistic synthetic fault diagram/photo
    representing the hostel fault scenario for multimodal evaluation.
    """
    width, height = 640, 480
    trade = case["expected_trade"]
    urgency = case["expected_urgency"]

    bg_color = (245, 247, 250)
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # 1. Header Banner
    header_color = URGENCY_COLORS.get(urgency, (100, 100, 100))
    draw.rectangle([0, 0, width, 55], fill=header_color)

    # Simple default font or fallback
    draw.text((15, 12), f"HOSTEL FAULT BENCHMARK [{case['id']}] - URGENCY {urgency}/5", fill=(255, 255, 255))
    draw.text((480, 12), f"TRADE: {trade.upper()}", fill=(255, 255, 255))

    # 2. Simulated Fault Visual Scene
    draw.rectangle([20, 70, width - 20, 360], fill=(235, 240, 245), outline=(200, 210, 220), width=2)

    # Visual elements tailored to fault type
    if "AC" in case["title"] or trade == "HVAC":
        # Draw simulated AC Unit
        draw.rectangle([60, 90, 400, 180], fill=(255, 255, 255), outline=(150, 150, 150), width=2)
        draw.rectangle([80, 160, 380, 175], fill=(200, 200, 200)) # Louver
        draw.text((70, 100), "SPLIT AC INDOOR UNIT (WALL MOUNTED)", fill=(80, 80, 80))
        
        # Water droplets or ice
        if "ice" in case["visual_description"].lower() or "frost" in case["visual_description"].lower():
            draw.rectangle([90, 120, 370, 155], fill=(230, 245, 255), outline=(180, 220, 250))
            draw.text((120, 130), "[FROZEN EVAPORATOR COILS - ICE ACCUMULATION]", fill=(0, 102, 204))
        else:
            # Water drips towards socket
            for dx in [120, 180, 240, 310]:
                draw.line([(dx, 180), (dx, 270)], fill=(0, 150, 255), width=3)
                draw.ellipse([dx - 5, 265, dx + 5, 275], fill=(0, 120, 230))
            draw.text((80, 220), "Water Dripping From Condensate Tray", fill=(0, 100, 200))

        # Power Socket on wall
        draw.rectangle([200, 280, 300, 340], fill=(240, 240, 240), outline=(50, 50, 50), width=2)
        draw.rectangle([220, 300, 240, 320], fill=(30, 30, 30))
        draw.rectangle([260, 300, 280, 320], fill=(30, 30, 30))
        draw.text((180, 345), "240V WALL OUTLET (HAZARD ZONE)", fill=(200, 0, 0))

    elif trade == "Plumbing":
        # Draw Pipes / Fixture
        draw.rectangle([80, 100, 250, 330], fill=(250, 250, 250), outline=(100, 100, 100), width=3)
        draw.text((90, 110), "PLUMBING FIXTURE", fill=(50, 50, 50))
        
        # Spray / Pooled water
        draw.ellipse([150, 250, 500, 340], fill=(173, 216, 230), outline=(0, 102, 204), width=2)
        draw.text((220, 290), "[CONTAMINATED / POOLING WATER ACCUMULATION]", fill=(0, 50, 150))
        
        # Ruptured flex hose
        draw.line([(250, 150), (380, 200)], fill=(120, 120, 120), width=8)
        draw.ellipse([370, 190, 430, 230], fill=(255, 100, 100))
        draw.text((320, 170), "RUPTURE / OVERFLOW POINT", fill=(180, 0, 0))

    elif trade == "Electrical":
        # Draw Conduit & Fixture / Exposed wires
        draw.rectangle([100, 100, 540, 160], fill=(250, 250, 250), outline=(80, 80, 80), width=2)
        draw.text((120, 115), "LIGHTING / CORRIDOR ELECTRICAL CONDUIT", fill=(60, 60, 60))
        
        # Exposed copper wires
        draw.line([(260, 160), (280, 260)], fill=(184, 115, 51), width=4) # Copper
        draw.line([(320, 160), (330, 250)], fill=(0, 0, 200), width=5)    # Neutral
        draw.line([(380, 160), (390, 270)], fill=(139, 69, 19), width=5)  # Live
        
        draw.rectangle([240, 270, 420, 330], fill=(255, 230, 230), outline=(220, 0, 0), width=2)
        draw.text((250, 285), "EXPOSED BARE CONDUCTORS", fill=(200, 0, 0))
        draw.text((255, 305), "HIGH SHOCK / ARC FLASH HAZARD", fill=(150, 0, 0))

    elif trade == "Carpentry":
        # Draw Door / Lock / Hinge / Drawer
        draw.rectangle([120, 90, 480, 340], fill=(222, 184, 135), outline=(101, 67, 33), width=4)
        draw.text((140, 105), "DOOR FRAME / WOODWORK ASSEMBLY", fill=(60, 30, 10))
        
        # Jammed latch or broken hinge
        draw.rectangle([400, 180, 470, 260], fill=(192, 192, 192), outline=(50, 50, 50), width=2)
        draw.text((370, 270), "[JAMMED LOCK / SHEARED CYLINDER]", fill=(180, 0, 0))
        draw.line([(400, 220), (460, 220)], fill=(255, 0, 0), width=3)

    else:
        # General (Paint, Mould, Screen)
        draw.rectangle([80, 90, 560, 340], fill=(240, 235, 225), outline=(160, 160, 160), width=2)
        draw.text((100, 105), "WALL SURFACE / ROOM INTERIOR", fill=(60, 60, 60))
        
        # Mould or tear patch
        draw.ellipse([200, 150, 440, 290], fill=(60, 70, 60), outline=(30, 40, 30), width=3)
        draw.text((220, 210), "[TOXIC MOULD COLONY / BLEMISH]", fill=(200, 255, 200))

    # 3. Footer Annotation with Casual Description
    draw.rectangle([0, 370, width, height], fill=(30, 41, 59))
    draw.text((15, 380), f"SCENARIO: {case['title']}", fill=(255, 255, 255))
    
    # Truncate text if long
    casual = case["casual_text"]
    if len(casual) > 85:
        casual = casual[:82] + "..."
    draw.text((15, 405), f"STUDENT INPUT: \"{casual}\"", fill=(203, 213, 225))
    
    tools_str = ", ".join(case["expected_tools"][:3])
    draw.text((15, 430), f"DISPATCH TOOLS REQUIRED: {tools_str}", fill=(147, 197, 253))
    draw.text((15, 455), f"HAZARDS: {', '.join(case['hazard_keywords'][:4])}", fill=(252, 165, 165))

    out_path = IMAGES_DIR / case["image_file"]
    img.save(out_path, format="PNG")
    return out_path


def generate_all_benchmark_assets():
    """Generate all 18 benchmark images and export dataset JSON."""
    generated = []
    print(f"Generating {len(BENCHMARK_CASES)} synthetic benchmark fault images...")

    for case in BENCHMARK_CASES:
        p = create_synthetic_fault_image(case)
        generated.append(str(p))
        print(f"  [+] Created: {case['id']} - {case['image_file']}")

    # Export dataset JSON
    dataset_file = BENCHMARK_DIR / "benchmark_dataset.json"
    with open(dataset_file, "w", encoding="utf-8") as f:
        json.dump(BENCHMARK_CASES, f, indent=2)

    print(f"\nSuccessfully generated {len(generated)} benchmark photos in {IMAGES_DIR}")
    print(f"Dataset catalog written to {dataset_file}")


if __name__ == "__main__":
    generate_all_benchmark_assets()
