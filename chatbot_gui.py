"""
HostelKaki AI Maintenance Bot & Triage Console - Python GUI
Built for APU Google Cloud Innovation Hackathon

Integrates directly with:
  - train_model.py (ML pipeline training & retraining)
  - chatbot.py (Urgency triage, SLA resolution, file format specs)
"""

import os
import sys
import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

# High DPI awareness for crisp rendering on Windows
try:
    import ctypes
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except Exception:
    pass

import chatbot
import train_model

class HostelChatbotGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("HostelKaki — Residential AI Maintenance Chatbot & Triage Console")
        self.root.geometry("860x760")
        self.root.minsize(700, 600)
        self.root.configure(bg="#f8fafc")

        # Color Theme
        self.COLORS = {
            "bg_page": "#f8fafc",
            "bg_card": "#ffffff",
            "header_bg": "#0f172a",
            "primary": "#1579f5",
            "primary_hover": "#0e60e1",
            "urgent": "#ef4444",
            "medium": "#f59e0b",
            "normal": "#10b981",
            "text_dark": "#0f172a",
            "text_muted": "#64748b",
            "border": "#e2e8f0",
            "user_bubble": "#e0edff",
            "bot_bubble": "#ffffff"
        }

        self.chat_history = []
        self._build_ui()
        self._check_and_display_initial_status()

    def _build_ui(self):
        # 1. Header Frame
        header = tk.Frame(self.root, bg=self.COLORS["header_bg"], height=80, padx=20, pady=14)
        header.pack(fill="x", side="top")

        title_frame = tk.Frame(header, bg=self.COLORS["header_bg"])
        title_frame.pack(side="left", fill="y")

        lbl_logo = tk.Label(
            title_frame, text="🏢 HostelKaki AI Concierge",
            font=("Segoe UI", 16, "bold"), fg="#ffffff", bg=self.COLORS["header_bg"]
        )
        lbl_logo.pack(anchor="w")

        lbl_sub = tk.Label(
            title_frame, text="Machine Learning Maintenance Triage • SLA Target Dispatch • Media Format Verifier",
            font=("Segoe UI", 9), fg="#94a3b8", bg=self.COLORS["header_bg"]
        )
        lbl_sub.pack(anchor="w")

        # Header Right Controls (Retrain, File Formats, Status)
        header_actions = tk.Frame(header, bg=self.COLORS["header_bg"])
        header_actions.pack(side="right", fill="y")

        self.status_lbl = tk.Label(
            header_actions, text="● Model: Active",
            font=("Segoe UI", 9, "bold"), fg="#34d399", bg=self.COLORS["header_bg"]
        )
        self.status_lbl.pack(side="right", padx=(10, 0))

        btn_formats = tk.Button(
            header_actions, text="📁 File Formats",
            font=("Segoe UI", 9, "bold"), bg="#334155", fg="#f8fafc",
            activebackground="#475569", activeforeground="#ffffff",
            relief="flat", padx=10, pady=4, cursor="hand2",
            command=self.show_file_formats
        )
        btn_formats.pack(side="right", padx=6)

        btn_retrain = tk.Button(
            header_actions, text="🔄 Retrain ML Model",
            font=("Segoe UI", 9, "bold"), bg=self.COLORS["primary"], fg="#ffffff",
            activebackground=self.COLORS["primary_hover"], activeforeground="#ffffff",
            relief="flat", padx=10, pady=4, cursor="hand2",
            command=self.retrain_model_gui
        )
        btn_retrain.pack(side="right", padx=6)

        # 2. Preset Quick-Action Chips
        chip_bar = tk.Frame(self.root, bg="#f1f5f9", padx=16, pady=8, highlightthickness=1, highlightbackground=self.COLORS["border"])
        chip_bar.pack(fill="x")

        lbl_quick = tk.Label(chip_bar, text="Quick Scenarios:", font=("Segoe UI", 9, "bold"), fg=self.COLORS["text_muted"], bg="#f1f5f9")
        lbl_quick.pack(side="left", padx=(0, 8))

        presets = [
            ("🌊 Pipe Burst", "Water pipe burst, room is flooding"),
            ("⚡ Electrical Spark", "Sparks coming out of the electrical outlet"),
            ("❄️ AC Warm Air", "Air conditioner is blowing warm air"),
            ("🪑 Loose Drawer", "Study desk drawer handle is loose"),
            ("📁 Upload File Formats?", "What file formats can I upload for photo and video?"),
            ("🎫 Ticket Lookup", "How do I track my ticket HK-2026-1082?"),
        ]

        for label_text, query_text in presets:
            btn = tk.Button(
                chip_bar, text=label_text,
                font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#334155",
                activebackground="#e2e8f0", relief="flat", padx=8, pady=3,
                cursor="hand2",
                command=lambda q=query_text: self.send_preset_query(q)
            )
            btn.pack(side="left", padx=4)

        # 3. Main Chat Conversation Display
        chat_frame = tk.Frame(self.root, bg=self.COLORS["bg_page"], padx=16, pady=12)
        chat_frame.pack(fill="both", expand=True)

        self.chat_box = tk.Text(
            chat_frame, wrap="word", font=("Segoe UI", 10),
            bg=self.COLORS["bg_card"], fg=self.COLORS["text_dark"],
            relief="flat", padx=16, pady=16,
            highlightthickness=1, highlightbackground=self.COLORS["border"]
        )
        self.chat_box.pack(side="left", fill="both", expand=True)

        scrollbar = ttk.Scrollbar(chat_frame, orient="vertical", command=self.chat_box.yview)
        scrollbar.pack(side="right", fill="y")
        self.chat_box.config(yscrollcommand=scrollbar.set)

        # Configure Text Tags for Rich Typography & Urgency Colors
        self.chat_box.tag_config("user_header", font=("Segoe UI", 10, "bold"), foreground="#1579f5", justify="right")
        self.chat_box.tag_config("user_msg", font=("Segoe UI", 10), foreground="#0f172a", justify="right")
        self.chat_box.tag_config("bot_header", font=("Segoe UI", 10, "bold"), foreground="#0f172a")
        self.chat_box.tag_config("bot_msg", font=("Segoe UI", 10), foreground="#334155")
        self.chat_box.tag_config("urgent_badge", font=("Segoe UI", 10, "bold"), foreground="#ffffff", background="#ef4444")
        self.chat_box.tag_config("medium_badge", font=("Segoe UI", 10, "bold"), foreground="#ffffff", background="#f59e0b")
        self.chat_box.tag_config("normal_badge", font=("Segoe UI", 10, "bold"), foreground="#ffffff", background="#10b981")
        self.chat_box.tag_config("ticket_badge", font=("Consolas", 10, "bold"), foreground="#1e293b", background="#e2e8f0")
        self.chat_box.tag_config("format_tag", font=("Segoe UI", 9, "bold"), foreground="#0369a1", background="#e0f2fe")
        self.chat_box.tag_config("divider", font=("Segoe UI", 8), foreground="#cbd5e1")
        self.chat_box.config(state="disabled")

        # 4. Input Area & Action Bar
        input_container = tk.Frame(self.root, bg="#ffffff", padx=16, pady=12, highlightthickness=1, highlightbackground=self.COLORS["border"])
        input_container.pack(fill="x", side="bottom")

        # Entry Row
        entry_row = tk.Frame(input_container, bg="#ffffff")
        entry_row.pack(fill="x")

        self.input_entry = ttk.Entry(entry_row, font=("Segoe UI", 11))
        self.input_entry.pack(side="left", fill="x", expand=True, ipady=6, padx=(0, 10))
        self.input_entry.bind("<Return>", lambda e: self.send_message())
        self.input_entry.focus()

        btn_send = tk.Button(
            entry_row, text="Send Issue 🚀",
            font=("Segoe UI", 10, "bold"), bg=self.COLORS["primary"], fg="#ffffff",
            activebackground=self.COLORS["primary_hover"], activeforeground="#ffffff",
            relief="flat", padx=18, pady=6, cursor="hand2",
            command=self.send_message
        )
        btn_send.pack(side="right")

        # Bottom Tools Row
        tools_row = tk.Frame(input_container, bg="#ffffff")
        tools_row.pack(fill="x", pady=(8, 0))

        lbl_hint = tk.Label(
            tools_row, text="💡 Tip: Enter an issue for ML urgency classification & SLA, or ask for allowed upload file formats.",
            font=("Segoe UI", 8), fg="#94a3b8", bg="#ffffff"
        )
        lbl_hint.pack(side="left")

        btn_clear = tk.Button(
            tools_row, text="🧹 Clear Chat",
            font=("Segoe UI", 8), bg="#f1f5f9", fg="#475569",
            activebackground="#e2e8f0", relief="flat", padx=8, pady=2, cursor="hand2",
            command=self.clear_chat
        )
        btn_clear.pack(side="right", padx=(6, 0))

        btn_export = tk.Button(
            tools_row, text="📄 Export to HTML",
            font=("Segoe UI", 8, "bold"), bg="#f1f5f9", fg="#1e293b",
            activebackground="#e2e8f0", relief="flat", padx=8, pady=2, cursor="hand2",
            command=self.export_to_html
        )
        btn_export.pack(side="right")

    def _check_and_display_initial_status(self):
        """Displays initial greeting and checks model loading status."""
        try:
            chatbot.get_model()
            self.status_lbl.config(text="● Model: Active (joblib)", fg="#34d399")
        except Exception as e:
            self.status_lbl.config(text="● Model: Retraining...", fg="#fbbf24")
            chatbot.retrain_model()
            self.status_lbl.config(text="● Model: Active", fg="#34d399")

        greeting = (
            "👋 Welcome to HostelKaki Residential AI Maintenance Assistant!\n\n"
            "This AI bot is powered by train_model.py (TF-IDF + Logistic Regression) and chatbot.py.\n"
            "• Type any hostel maintenance defect to predict Urgency (Urgent / Medium / Normal) and target SLA.\n"
            "• Ask: 'What file formats can I upload in HTML?' to see photo and video specifications.\n"
            "• Use the quick chips above or click '🔄 Retrain ML Model' anytime."
        )
        self._append_bot_message(greeting)

    def send_preset_query(self, query):
        self.input_entry.delete(0, tk.END)
        self.input_entry.insert(0, query)
        self.send_message()

    def send_message(self):
        user_text = self.input_entry.get().strip()
        if not user_text:
            return

        self.input_entry.delete(0, tk.END)
        self._append_user_message(user_text)

        # Process through chatbot.py
        response = chatbot.process_query(user_text)
        self._append_structured_bot_response(response)

    def _append_user_message(self, text):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        self.chat_history.append({"sender": "You", "time": now, "text": text, "type": "user"})

        self.chat_box.config(state="normal")
        self.chat_box.insert(tk.END, f"\n[Resident • {now}]\n", "user_header")
        self.chat_box.insert(tk.END, f"{text}\n\n", "user_msg")
        self.chat_box.insert(tk.END, "─" * 70 + "\n", "divider")
        self.chat_box.config(state="disabled")
        self.chat_box.see(tk.END)

    def _append_bot_message(self, text):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        self.chat_history.append({"sender": "HostelKaki AI", "time": now, "text": text, "type": "bot"})

        self.chat_box.config(state="normal")
        self.chat_box.insert(tk.END, f"\n🤖 HostelKaki AI Concierge • {now}\n", "bot_header")
        self.chat_box.insert(tk.END, f"{text}\n\n", "bot_msg")
        self.chat_box.insert(tk.END, "─" * 70 + "\n", "divider")
        self.chat_box.config(state="disabled")
        self.chat_box.see(tk.END)

    def _append_structured_bot_response(self, resp):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        self.chat_history.append({"sender": "HostelKaki AI", "time": now, "data": resp, "type": "bot"})

        self.chat_box.config(state="normal")
        self.chat_box.insert(tk.END, f"\n🤖 HostelKaki AI Concierge • {now}\n", "bot_header")

        resp_type = resp.get("type")

        if resp_type == "incident":
            ticket_id = resp.get("ticket_id")
            urgency = resp.get("urgency")
            conf = resp.get("confidence", 0.0)
            sla = resp.get("sla", "")
            action_msg = resp.get("message", "")

            # Ticket Line
            self.chat_box.insert(tk.END, "Ticket Reference: ")
            self.chat_box.insert(tk.END, f" #{ticket_id} ", "ticket_badge")
            self.chat_box.insert(tk.END, "\n")

            # Urgency Line with Badge
            self.chat_box.insert(tk.END, "Triage Urgency:   ")
            badge_tag = "normal_badge"
            if urgency == "Urgent":
                badge_tag = "urgent_badge"
            elif urgency == "Medium":
                badge_tag = "medium_badge"
            self.chat_box.insert(tk.END, f"  {urgency.upper()}  ", badge_tag)
            self.chat_box.insert(tk.END, f" (Confidence: {conf:.1f}%)\n")

            # SLA & Instructions
            self.chat_box.insert(tk.END, f"⏱️ Target SLA:    {sla}\n")
            self.chat_box.insert(tk.END, f"📌 Action Plan:   {action_msg}\n\n")

            # Accepted format note in HTML
            self.chat_box.insert(tk.END, "📁 Allowed HTML Form Media: ", "bot_msg")
            self.chat_box.insert(tk.END, " .JPG / .PNG / .WEBP ", "format_tag")
            self.chat_box.insert(tk.END, " (Photo)  ")
            self.chat_box.insert(tk.END, " .MP4 / .WEBM ", "format_tag")
            self.chat_box.insert(tk.END, " (Video ≤ 20MB)\n\n")

        elif resp_type == "file_format":
            self.chat_box.insert(tk.END, resp.get("text") + "\n\n", "bot_msg")

        else:
            self.chat_box.insert(tk.END, resp.get("text", "") + "\n\n", "bot_msg")

        self.chat_box.insert(tk.END, "─" * 70 + "\n", "divider")
        self.chat_box.config(state="disabled")
        self.chat_box.see(tk.END)

    def show_file_formats(self):
        """Displays accepted file formats modal or message."""
        info = chatbot.FILE_FORMAT_INFO
        details = (
            "HostelKaki Portal — Supported Upload File Formats in HTML\n\n"
            "📷 PHOTO EVIDENCE (MANDATORY):\n"
            f"  • Accepted Extensions: {', '.join(info['image_formats'])}\n"
            f"  • Specs: {info['image_specs']}\n\n"
            "🎥 VIDEO EVIDENCE (OPTIONAL):\n"
            f"  • Accepted Extensions: {', '.join(info['video_formats'])}\n"
            f"  • Specs: {info['video_specs']}\n\n"
            "📄 TICKET & REPORT EXPORTS:\n"
            f"  • Formats: {', '.join(info['report_formats'])}\n"
            f"  • Specs: {info['report_specs']}\n\n"
            "These file formats are strictly validated in index.html and app.js."
        )
        messagebox.showinfo("📁 HTML File Format Specifications", details)
        self.send_preset_query("What file formats are accepted in HTML?")

    def retrain_model_gui(self):
        """Triggers train_model.py retraining live from GUI."""
        self.status_lbl.config(text="● Model: Training...", fg="#fbbf24")
        self.root.update()

        try:
            _, output_path = chatbot.retrain_model()
            self.status_lbl.config(text="● Model: Active (Retrained)", fg="#34d399")
            messagebox.showinfo(
                "Training Complete",
                f"Model pipeline successfully trained via train_model.py!\n\n"
                f"Artifact saved to:\n{output_path}\n\n"
                "The chatbot is now updated with the latest TF-IDF weights and classification parameters."
            )
            self._append_bot_message("🔄 The ML urgency classifier has been retrained successfully via train_model.py and is live!")
        except Exception as e:
            self.status_lbl.config(text="● Model: Error", fg="#ef4444")
            messagebox.showerror("Retrain Failed", f"An error occurred while training: {e}")

    def clear_chat(self):
        self.chat_history.clear()
        self.chat_box.config(state="normal")
        self.chat_box.delete("1.0", tk.END)
        self.chat_box.config(state="disabled")
        self._check_and_display_initial_status()

    def export_to_html(self):
        """Exports conversation and file format specs to a styled HTML document."""
        if not self.chat_history:
            messagebox.showwarning("Export Notice", "No conversation history to export.")
            return

        default_filename = f"hostel_chat_transcript_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        save_path = filedialog.asksaveasfilename(
            defaultextension=".html",
            filetypes=[("HTML File", "*.html"), ("All Files", "*.*")],
            initialfile=default_filename
        )
        if not save_path:
            return

        html_content = self._generate_html_transcript()
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        messagebox.showinfo("Export Successful", f"Chat transcript exported to HTML:\n{save_path}")

    def _generate_html_transcript(self):
        now_str = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")
        rows = ""
        for item in self.chat_history:
            sender = item.get("sender", "System")
            time_str = item.get("time", "")
            is_user = item.get("type") == "user"
            bubble_class = "user-bubble" if is_user else "bot-bubble"
            align_class = "justify-end" if is_user else "justify-start"

            content_html = ""
            if "data" in item:
                d = item["data"]
                if d.get("type") == "incident":
                    content_html = f"""
                    <div class="ticket-tag">Ticket Reference: #{d.get('ticket_id')}</div>
                    <div style="margin: 8px 0;"><strong>Reported Issue:</strong> {d.get('query')}</div>
                    <div><span class="badge badge-{d.get('urgency').lower()}">{d.get('urgency').upper()}</span> (Confidence: {d.get('confidence', 0):.1f}%)</div>
                    <div style="margin-top:6px;"><strong>Target SLA:</strong> {d.get('sla')}</div>
                    <div style="color: #475569; font-size: 13px; margin-top: 4px;">{d.get('message')}</div>
                    """
                else:
                    content_html = f"<div>{d.get('text', '').replace(chr(10), '<br>')}</div>"
            else:
                content_html = f"<div>{item.get('text', '').replace(chr(10), '<br>')}</div>"

            rows += f"""
            <div class="message-row {align_class}">
              <div class="message-bubble {bubble_class}">
                <div class="message-meta"><strong>{sender}</strong> • {time_str}</div>
                <div class="message-content">{content_html}</div>
              </div>
            </div>
            """

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HostelKaki AI Chatbot Transcript</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 30px; }}
    .container {{ max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 30px; }}
    .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; color: white; }}
    .badge-urgent {{ background: #ef4444; }}
    .badge-medium {{ background: #f59e0b; }}
    .badge-normal {{ background: #10b981; }}
    .ticket-tag {{ display: inline-block; font-family: monospace; background: #e2e8f0; padding: 3px 8px; border-radius: 6px; font-weight: bold; }}
    .format-card {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin-bottom: 25px; font-size: 13px; }}
    .message-row {{ display: flex; margin-bottom: 15px; }}
    .justify-end {{ justify-content: flex-end; }}
    .justify-start {{ justify-content: flex-start; }}
    .message-bubble {{ max-width: 78%; padding: 14px 18px; border-radius: 16px; line-height: 1.5; }}
    .user-bubble {{ background: #1579f5; color: white; border-bottom-right-radius: 4px; }}
    .bot-bubble {{ background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }}
    .user-bubble .message-meta {{ color: #bfdbfe; font-size: 11px; margin-bottom: 5px; }}
    .bot-bubble .message-meta {{ color: #64748b; font-size: 11px; margin-bottom: 5px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; color: #1579f5;">HostelKaki AI Maintenance Chatbot Transcript</h2>
      <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">Generated on {now_str} • Powered by train_model.py ML Classifier</p>
    </div>

    <!-- Supported File Formats Reference in HTML -->
    <div class="format-card">
      <strong style="color: #166534;">📁 Supported File Formats in HostelKaki HTML Portal:</strong><br>
      • <strong>Photo Evidence (Mandatory):</strong> .jpg, .jpeg, .png, .webp, .heic (Max 10MB)<br>
      • <strong>Video Evidence (Optional):</strong> .mp4, .webm, .mov (Max 20MB)<br>
      • <strong>Report Exports:</strong> .html, .json, .pdf (Standard Ticket ID #HK-2026-XXXX)
    </div>

    <div class="messages">
      {rows}
    </div>
  </div>
</body>
</html>"""

def main():
    root = tk.Tk()
    app = HostelChatbotGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
