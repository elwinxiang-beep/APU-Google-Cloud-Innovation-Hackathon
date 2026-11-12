import os
import random
import re
import sys
import joblib
import train_model

MODEL_FILENAME = "hostel_urgency_model.joblib"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, MODEL_FILENAME)

# Global model cache
_model = None
URGENT_KEYWORD_PATTERN = re.compile(
    r"\b(?:fires?|spark(?:s|ed|ing)?|short[\s-]+circuits?|smoke|"
    r"flood(?:s|ed|ing)?|leak(?:s|ed|ing)?|injur(?:y|ies|ed)|"
    r"shatter(?:s|ed|ing)?|cannot\s+lock|broken\s+(?:window\s+)?glass)\b",
    re.IGNORECASE
)
MEDIUM_KEYWORD_PATTERN = re.compile(r"\bbroken\b", re.IGNORECASE)

# Urgency definitions and resolution SLAs
SLA_INFO = {
    "Urgent": {
        "badge": "🚨 URGENT",
        "sla": "Immediately (Within 2 hours)",
        "color": "#ef4444",
        "message": "[!] ALERT: This issue is flagged as URGENT. An emergency warden/technician has been notified."
    },
    "Medium": {
        "badge": "⚠️ MEDIUM",
        "sla": "Within 24 hours",
        "color": "#f59e0b",
        "message": "[*] Noted. A maintenance staff member will visit by tomorrow."
    },
    "Normal": {
        "badge": "🟢 NORMAL",
        "sla": "Within 48 hours",
        "color": "#10b981",
        "message": "[i] Request received. It will be scheduled into the regular maintenance queue."
    }
}

FILE_FORMAT_INFO = {
    "title": "HostelKaki Upload & Document File Formats",
    "image_formats": [".jpg", ".jpeg", ".png", ".webp", ".heic"],
    "image_specs": "Mandatory incident photo evidence. Max file size: 10MB.",
    "video_formats": [".mp4", ".webm", ".mov"],
    "video_specs": "Optional short video clip (10-30s) showing active leaks, smoke, or mechanical sound. Max file size: 20MB.",
    "report_formats": [".html", ".json", ".pdf"],
    "report_specs": "Maintenance receipts with standardized Ticket ID (#HK-2026-XXXX)."
}

def load_or_train_model():
    """Load the ML model from disk, training it automatically if not found."""
    global _model
    if os.path.exists(MODEL_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
            return _model
        except Exception as e:
            print(f"[!] Warning: Failed to load existing model ({e}). Retraining...")

    # Train model using train_model.py
    _model, _ = train_model.train_and_save_model(MODEL_FILENAME)
    return _model

def get_model():
    """Get the cached ML model or initialize it."""
    global _model
    if _model is None:
        _model = load_or_train_model()
    return _model

def retrain_model():
    """Forces retraining of the ML model via train_model.py."""
    global _model
    _model, _ = train_model.train_and_save_model(MODEL_FILENAME)
    return _model

def predict_urgency(issue_description: str):
    """Predict urgency class and confidence probability for an issue description."""
    if URGENT_KEYWORD_PATTERN.search(issue_description):
        return "Urgent", 100.0
    if MEDIUM_KEYWORD_PATTERN.search(issue_description):
        return "Medium", 100.0

    model = get_model()
    urgency = str(model.predict([issue_description])[0])
    probabilities = model.predict_proba([issue_description])[0]
    confidence = float(max(probabilities) * 100)
    return urgency, confidence

def is_file_format_query(text: str) -> bool:
    """Detect if the user is asking about file formats, upload types, or media specifications."""
    t = text.lower()
    keywords = [
        "file format", "format", "upload", "extension", "type of file",
        "image format", "video format", "jpg", "png", "mp4", "webm",
        "what file", "which file", "allowed file", "supported file", "media format"
    ]
    return any(k in t for k in keywords)

def is_greeting_query(text: str) -> bool:
    """Detect simple greetings."""
    t = text.lower().strip()
    return t in ["hi", "hello", "hey", "halo", "morning", "good morning", "good evening", "help", "who are you"]

def process_query(user_input: str) -> dict:
    """
    Process any user query and return a structured response dictionary.
    Handles:
      1. File format specifications (photo, video, HTML/JSON reports)
      2. Greetings & general assistance
      3. Incident reporting & ML urgency triage with SLAs
    """
    query = user_input.strip()
    if not query:
        return {
            "type": "empty",
            "text": "Please enter an issue description or inquiry."
        }

    # 1. Greetings
    if is_greeting_query(query):
        return {
            "type": "greeting",
            "text": (
                "👋 Hello! I am the HostelKaki AI Maintenance Concierge.\n\n"
                "You can:\n"
                "• Describe a hostel maintenance issue (e.g., 'Pipe burst in bathroom', 'AC blowing warm air')\n"
                "• Ask about accepted upload file formats in our HTML portal\n"
                "• Inquire about ticket tracking and SLAs"
            )
        }

    # 2. File Format Inquiries
    if is_file_format_query(query):
        img_fmts = ", ".join(FILE_FORMAT_INFO["image_formats"])
        vid_fmts = ", ".join(FILE_FORMAT_INFO["video_formats"])
        rpt_fmts = ", ".join(FILE_FORMAT_INFO["report_formats"])
        text = (
            "📁 **HostelKaki File Format Specifications**:\n\n"
            f"📷 **Photo Evidence (Mandatory in HTML Form):**\n"
            f"• Supported Formats: {img_fmts}\n"
            f"• Specifications: {FILE_FORMAT_INFO['image_specs']}\n\n"
            f"🎥 **Video Evidence (Optional in HTML Form):**\n"
            f"• Supported Formats: {vid_fmts}\n"
            f"• Specifications: {FILE_FORMAT_INFO['video_specs']}\n\n"
            f"📄 **Report & Receipt Export Formats:**\n"
            f"• Supported Formats: {rpt_fmts}\n"
            f"• Auto-generated Ticket ID format: #HK-2026-XXXX"
        )
        return {
            "type": "file_format",
            "file_info": FILE_FORMAT_INFO,
            "text": text
        }

    # 3. Incident Urgency Triage (Machine Learning Pipeline)
    urgency, confidence = predict_urgency(query)
    info = SLA_INFO.get(urgency, SLA_INFO["Normal"])
    random_id = random.randint(1000, 9999)
    ticket_id = f"HK-2026-{random_id}"

    text = (
        f"🎫 **Ticket Generated:** #{ticket_id}\n"
        f"📝 **Reported Issue:** \"{query}\"\n"
        f"⚡ **Urgency Level:** {info['badge']} ({confidence:.1f}% confidence)\n"
        f"⏱️ **Target Resolution SLA:** {info['sla']}\n"
        f"📌 **Status & Action:** {info['message']}\n\n"
        f"💡 *Remember to attach photo evidence in JPG/PNG/WEBP format when submitting on the web portal.*"
    )

    return {
        "type": "incident",
        "ticket_id": ticket_id,
        "query": query,
        "urgency": urgency,
        "badge": info["badge"],
        "color": info["color"],
        "confidence": confidence,
        "sla": info["sla"],
        "message": info["message"],
        "text": text
    }

def run_chatbox():
    """Terminal CLI mode for chatbot."""
    get_model()
    print("=" * 65)
    print("🏨 HostelKaki AI Maintenance Chatbot & Triage Console")
    print("Type your issue, ask 'file format', or type 'exit' to quit.")
    print("=" * 65)

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nChatbot: Goodbye! Have a safe stay.")
            break

        if not user_input:
            continue
        if user_input.lower() in ["exit", "quit"]:
            print("Chatbot: Goodbye! Have a safe stay.")
            break

        response = process_query(user_input)
        print(f"\nChatbot:\n{response['text']}")

def main():
    if "--gui" in sys.argv:
        import chatbot_gui
        chatbot_gui.main()
    else:
        run_chatbox()

if __name__ == "__main__":
    main()
