import sys
from pathlib import Path

# Ensure project root in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.data.benchmark_cases import BENCHMARK_CASES
from app.services.triage_engine import triage_engine
from app.services.gemini_client import gemini_manager


def run_benchmark_evaluation():
    print("=" * 80)
    print(" 🏥 HOSTEL FAULT AI TRIAGE BENCHMARK EVALUATION (GEMINI BRAIN)")
    mode = f"Live Gemini API ({gemini_manager.model_name})" if gemini_manager.is_live else "Simulation / Diagnostic Heuristic Mode"
    print(f" Engine Mode: {mode}")
    print(f" Total Test Cases: {len(BENCHMARK_CASES)}")
    print("=" * 80)

    trade_correct = 0
    urgency_exact = 0
    total_urgency_error = 0

    print(f"{'ID':<6} {'Expected Trade':<14} {'Predicted Trade':<14} {'Exp Urg':<8} {'Pred Urg':<9} {'Match'}")
    print("-" * 80)

    for case in BENCHMARK_CASES:
        image_path = PROJECT_ROOT / "benchmark" / "images" / case["image_file"]
        image_bytes = None
        if image_path.exists():
            image_bytes = image_path.read_bytes()

        result = triage_engine.triage_fault(
            description=case["casual_text"],
            image_bytes=image_bytes,
            image_mime="image/png",
            location="Hostel Dormitory"
        )

        expected_trade = case["expected_trade"]
        secondary = case.get("secondary_trade")
        pred_trade = result.trade_category.value

        trade_match = (pred_trade == expected_trade) or (secondary and pred_trade == secondary)
        if trade_match:
            trade_correct += 1

        urg_diff = abs(result.urgency_score - case["expected_urgency"])
        total_urgency_error += urg_diff
        if urg_diff == 0:
            urgency_exact += 1

        status_str = "✅ PASS" if (trade_match and urg_diff <= 1) else "⚠️ CLOSE" if trade_match else "❌ FAIL"

        print(f"{case['id']:<6} {expected_trade:<14} {pred_trade:<14} {case['expected_urgency']:<8} {result.urgency_score:<9} {status_str}")

    n = len(BENCHMARK_CASES)
    trade_acc = (trade_correct / n) * 100
    urg_acc = (urgency_exact / n) * 100
    mae = total_urgency_error / n

    print("=" * 80)
    print(f" BENCHMARK SUMMARY RESULTS:")
    print(f" • Trade Category Accuracy:     {trade_acc:.1f}% ({trade_correct}/{n})")
    print(f" • Exact Urgency Match:          {urg_acc:.1f}% ({urgency_exact}/{n})")
    print(f" • Mean Absolute Urgency Error:  {mae:.2f} score points")
    print("=" * 80)


if __name__ == "__main__":
    run_benchmark_evaluation()
