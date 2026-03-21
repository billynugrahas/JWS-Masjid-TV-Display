Project Summary: Mosque Display System (STB-Based)
🎯 Goal

Build a lightweight, stable, web-based mosque display system that runs on a low-spec device and can be controlled remotely via browser.

⚙️ Hardware Setup
📺 Display Device
Device: ZTE B680H
OS: Armbian (Linux)
RAM: ~1 GB
📡 Access
Connected via WiFi
Admin uses phone/laptop browser
🏗️ System Architecture
[Admin (Phone/Laptop)]
        │
        ▼
   Web Admin Panel
        │
        ▼
[STB (Armbian)]
 ├── Web Server (Node.js / PHP)
 ├── Chromium (Kiosk Mode)
 └── Display Page (Fullscreen)
        │
        ▼
       TV
💻 Technology Stack (Optimized for 1GB RAM)
Frontend (Display + Admin)
HTML
CSS (no heavy frameworks)
Vanilla JavaScript
(optional: Alpine.js for light interactivity)
Backend
Node.js (Express) or PHP
Database
SQLite (recommended)
or simple JSON storage
🖥️ Core Pages
/display → Fullscreen TV display
/admin → Control panel (mobile-friendly)
🧩 Core Features
Mosque info (name, logo)
Prayer schedule
Countdown to next prayer
Iqomah countdown (custom per prayer)
Running text (editable)
Background image (changeable)
Calm display mode during prayer/khutbah
Optional Friday prayer & Tarawih modes
Beep sound for iqomah alert
🧠 Core Logic (State-Based System)
IDLE
↓
WAITING FOR ADZAN
↓
ADZAN
↓
IQOMAH (countdown)
↓
PRAYER (calm mode)
↓
FINISHED → back to IDLE

👉 UI behavior changes based on system state

⏱️ Time Handling
Use system time (Linux / NTP)
No RTC required (for now)
Implement local fallback if offline
🔄 Data Update Strategy
Use periodic polling (e.g. every 5 seconds)
Or WebSocket (optional)
🎨 UI Design Principles
Large fonts (readable from distance)
High contrast (e.g. white on dark)
Minimal clutter
Smooth but lightweight animations (CSS only)
🔧 System Requirements (Critical)
Auto-start on boot (kiosk mode)
Auto-recovery if browser crashes
Offline capability (cached data)
Stable performance (no heavy libraries)
🚫 What to Avoid
Heavy frameworks (React, Next.js, etc.)
Complex animations
Docker (for now)
Multiple services/containers
Over-engineering early
🚀 Development Roadmap
Phase 1
Display clock + prayer schedule
Phase 2
Countdown to adzan
Phase 3
Iqomah timer + sound
Phase 4
Running text + background
Phase 5
Admin panel (mobile-friendly)
🔮 Future Upgrade (Planned)
Add ESP32 + RTC as:
Time backup
Event trigger system

(Not required in current phase)

🏁 Final Conclusion
Use web-based system (no Docker)
Keep everything lightweight and stable

STB acts as:

Display + local server

Focus on:

Reliability over complexity