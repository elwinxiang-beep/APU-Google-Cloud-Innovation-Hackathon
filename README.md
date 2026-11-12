# HostelKaki - Residential Maintenance Issue Portal 🏢🔧

**"An application to report your findings of a maintenance issue"**

HostelKaki is a modern web application tailored for student residential hostels to report and track maintenance incidents with interactive floorplan localization, mandatory photo evidence, optional video capture, **automatic Ticket ID generation**, and **role-based visibility** (Student vs. Facility Staff).

---

# 🌟1. Key Updates & Features

### 1. 🔒 Role-Based Visibility (Staff vs. Student)
- **Only Facility Staff can view the full maintenance directory**:
  - The comprehensive list of all reported student incidents across every hostel block is **restricted exclusively to Facility Staff**.
  - When logged in as a **Student Resident**:
    - The full directory is hidden behind a confidential privacy barrier.
    - Students can easily submit new incident reports.
    - Students can track their personal issue using their unique **Ticket ID** (e.g. `HK-2026-1082`).
    - Students have a "My Submitted Reports" section to review their own tickets.
  - When logged in as **Facility Staff**:
    - Complete access to the **Maintenance Ticket Directory**.
    - Search by **Ticket ID**, Room, Category, or Keyword.
    - Filter by Status (`All`, `Pending`, `In Progress`, `Resolved`).
    - Ability to update ticket statuses and log work/technician notes.

### 2. 🎫 Automatic Ticket ID Generation
- Every report submitted automatically generates an official, standardized Ticket ID in the format:  
  **`#HK-2026-XXXX`** (e.g., `#HK-2026-4821`).
- Upon submission, a **Ticket Receipt Modal** pops up with:
  - The generated Ticket ID in large, bold monospace text.
  - A **[📋 Copy Ticket ID]** 1-click button.
  - Ticket summary (Location, Category, Floorplan reference).
  - Quick option to "Track This Ticket" immediately.

### 3. 🔍 Dedicated Ticket ID Search for Staff
- The staff directory includes a prominent search bar:
  `🔍 Search by Ticket ID (e.g. HK-2026-1082) or Unit, Location, Keyword...`
- Staff can type or paste any Ticket ID to instantly pull up the student's report, photos, video, and floorplan location pin.

### 4. 🗺️ Interactive Floorplan Pinning & Media Upload
- **Mandatory Photo Upload**: Form ensures an image is attached before submitting.
- **Optional Video Upload**: Built-in video player preview.
- **Click-to-Select Floorplan**: Visual SVG layout with room auto-detection (Rooms 301–305, Pantry, Common Bath, Laundry Room, Study Lounge).

---

## 🚀 How to Run Locally

Double-click `index.html` to open it in Chrome, Edge, or any web browser.

Or run a local server:
```powershell
python -m http.server 8000
```
Then visit **`http://localhost:8000`**.

---

## 👥 Testing the Two Perspectives

Use the **Switch Account** button (or drawer quick toggle):
1. **Student Mode (Alex Tan)**:
   - Submit a report.
   - Note down the generated Ticket ID (e.g. `HK-2026-XXXX`).
   - Notice the main directory is confidential.
   - Use the **Track Your Reported Ticket** box to look up your issue!
2. **Staff Mode (Encik Rahman)**:
   - Unlock the full directory!
   - Search by the Ticket ID in the search bar.
   - Change the status from `Pending` → `In Progress` → `Resolved` and add technician notes.

### 5. 🤖 AI Maintenance Chatbot & Triage Console (Web GUI & Python GUI)
- **Machine Learning Urgency Classifier**:
  - Powered by `train_model.py` (TF-IDF Vectorizer + balanced Logistic Regression pipeline).
  - Automatically classifies hostel incident reports into **Urgent** (within 2 hours), **Medium** (within 24 hours), or **Normal** (within 48 hours) with confidence score.
  - Generates official standardized Ticket IDs (`#HK-2026-XXXX`).
- **Interactive Web Chatbox Area (HTML & JS GUI)**:
  - Accessible via floating launcher button `[🤖 AI Concierge & Triage]` and sidebar navigation.
  - Features real-time status inquiry, emergency triage, and upload file format guidance.
- **Dedicated Desktop Python GUI (`chatbot_gui.py`)**:
  - High-DPI Windows Tkinter interface with styled chat bubbles, urgency badges, live retraining button, and HTML export.
  - Seamlessly integrates `chatbot.py` and `train_model.py`.

### 6. 📁 Strict File Format Specifications (HTML & Evidence Verification)
- **Photo Evidence (Mandatory)**:
  - Formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`
  - Specifications: Clear, well-lit photo of defect. Max file size: **10MB**.
- **Video Evidence (Optional)**:
  - Formats: `.mp4`, `.webm`, `.mov`
  - Specifications: Short clip (10–30s) showing active leaks, electrical sparks, or abnormal fan/AC vibrations. Max file size: **20MB**.
- **System Receipt & Export Formats**:
  - Formats: `.html`, `.json`, `.pdf`
  - Monospace Ticket ID tracking (`#HK-2026-XXXX`).

---

## 🚀 How to Run Locally

### 1. Web Portal & Web Chatbot
Double-click `index.html` to open it in Chrome, Edge, or any web browser.

Or run a local server:
```powershell
python -m http.server 8000
```
Then visit **`http://localhost:8000`**. Click the bottom-right **[🤖 AI Concierge & Triage]** button to open the web chatbox!

### 2. Python AI Chatbot GUI
Launch the standalone Python desktop application:
```powershell
python chatbot_gui.py
```
Or run via `chatbot.py`:
```powershell
python chatbot.py --gui
```
(Terminal CLI mode: `python chatbot.py`)

### 3. Retraining the ML Model
To retrain the urgency classification model on demand:
```powershell
python train_model.py
```
Or click the **[🔄 Retrain ML Model]** button in the Python GUI.

---

## 👥 Testing the Perspectives & AI Chatbot

1. **Student Mode (Alex Tan)**:
   - Submit a report with photo/video conforming to accepted formats (`.jpg`, `.png`, `.mp4`).
   - Note down the generated Ticket ID (e.g. `HK-2026-XXXX`).
   - Open the **AI Concierge Chatbox** (bottom-right) and ask: *"What file formats can I upload?"* or test triage with *"Water pipe burst, room is flooding"*.
2. **Staff Mode (Encik Rahman)**:
   - Unlock the full directory!
   - Search by the Ticket ID in the search bar.
   - Change the status from `Pending` → `In Progress` → `Resolved` and add technician notes.

# 🗂️2. Project File Structure

```text
HostelKaki/
├── index.html        # Unified Single-Page Application (Home, Report Form, Student Tracker, AI Chatbox GUI & Modals)
├── app.js            # Core state management, Firebase real-time sync, AI Concierge & Triage logic
├── styles.css        # Custom styles, responsive scrollbars, glassmorphism & chat animations
├── firebase-db.js    # Firebase Firestore cloud database configuration & real-time listeners
├── train_model.py    # Machine learning training pipeline (TF-IDF + Logistic Regression) saving hostel_urgency_model.joblib
├── chatbot.py        # Chatbot core logic, SLA definitions, query triage & CLI interface
├── chatbot_gui.py    # Standalone Python Desktop GUI for AI chatbox, triage, retraining & transcript export
├── hostel_urgency_model.joblib # Serialized ML classification model artifact
└── README.md         # Project documentation & hackathon guide
```