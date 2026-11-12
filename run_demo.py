import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.triage_engine import triage_engine
from app.services.chat_concierge import chat_concierge
from app.services.gemini_client import gemini_manager
from app.data.benchmark_cases import BENCHMARK_CASES


def print_banner():
    print("=" * 80)
    print(" 🏥 GEMINI HOSTEL MAINTENANCE BRAIN (Person 1: AI & GenAI Engineer)")
    mode = f"Live Gemini API ({gemini_manager.model_name})" if gemini_manager.is_live else "Simulation / Diagnostic Mode"
    print(f" Engine Status: {mode}")
    print("=" * 80)


def demo_multimodal_triage():
    print("\n[1] DEMO: Multimodal Fault Triage Engine")
    print("-" * 80)
    case = BENCHMARK_CASES[0] # TC-01: Leaking AC above 240V socket
    print(f"Scenario: {case['title']}")
    print(f"Student Casual Input: \"{case['casual_text']}\"")

    img_path = PROJECT_ROOT / "benchmark" / "images" / case["image_file"]
    img_bytes = img_path.read_bytes() if img_path.exists() else None

    result = triage_engine.triage_fault(
        description=case["casual_text"],
        image_bytes=img_bytes,
        image_mime="image/png",
        location="Block B, Room 304"
    )

    print("\n=== Structured JSON Schema Output (Enforced via Pydantic) ===")
    print(json.dumps(result.model_dump(), indent=2))


def demo_chat_concierge():
    print("\n[2] DEMO: Status Concierge Chat Agent (Function Calling / Tool Use)")
    print("-" * 80)
    
    queries = [
        "What is the status of ticket #1024?",
        "Has anyone reported the 3rd floor bathroom light?",
        "List all my open requests",
        "Escalate ticket 1024! The water is leaking faster onto the power outlet!"
    ]

    for q in queries:
        print(f"\n👤 Student: \"{q}\"")
        resp = chat_concierge.handle_message(q, student_id="STU-8821")
        if resp.tool_calls:
            for tc in resp.tool_calls:
                print(f"  ⚡ Tool Call Executed: {tc.tool_name}({json.dumps(tc.arguments)})")
        print(f"🤖 Concierge Reply:\n{resp.reply}")


def main():
    print_banner()
    demo_multimodal_triage()
    demo_chat_concierge()
    print("\n" + "=" * 80)
    print(" Interactive Web Dashboard: Run 'python -m app.main' and open http://127.0.0.1:8000")
    print("=" * 80)


if __name__ == "__main__":
    main()
