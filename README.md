# HostelKaki - Residential Maintenance Issue Portal 🏢🔧

**"An application to report your findings of a maintenance issue"**

HostelKaki is a modern web application tailored for student residential hostels to report and track maintenance incidents with interactive floorplan localization, mandatory photo evidence, optional video capture, **automatic Ticket ID generation**, and **role-based visibility** (Student vs. Facility Staff).

---

## 🌟 Key Updates & Features

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
