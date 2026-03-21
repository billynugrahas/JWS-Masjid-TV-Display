This implementation plan is designed to guide an AI Agent (Developer or Designer) to transform the current mosque display into a high-end, modern, and functional interface.

🛠 UI/UX Improvement Implementation Plan
Phase 1: Visual Identity & Typography
Establish a "Fresh Modern Minimalist" aesthetic to ensure high readability from a distance.

Color Palette:

Background: #F8F9FA (Off-White/Mint White) for a clean, non-glaring look.

Primary Accent: #1B4332 (Deep Emerald Green) for headings and active states.

Secondary Accent: #D4AF37 (Soft Gold) for highlights and icons.

Text: #212529 (Dark Charcoal) for maximum contrast.

Typography:

Headlines/Clock: Use Poppins or Montserrat (Bold/Extra Bold).

Body/Labels: Use Inter or Roboto (Medium/Regular).

Arabic Script: Use Amiri or Noto Sans Arabic (Naskh style).

Phase 2: Structural Layout (Landscape Optimization)
Divide the screen into a clear visual hierarchy.

The Header (Info Bar):

Left: Mosque Logo + Name ("MASJID AL-MUHAJIRIN").

Right: Dual-calendar display (Masehi & Hijri side-by-side or stacked).

The Hero Section (Center Focus):

Display a large digital clock (HH:mm) with a smaller seconds counter.

Place a Floating Countdown Pill directly underneath (e.g., "Time to Adhan Subuh: 07:45:10").

The Prayer Grid (Main Information):

Create 5-6 horizontal cards with Glassmorphism effects (white translucent background with soft blur).

Implement an "Active State": The card for the next prayer time should have a glowing border or a solid green background to stand out.

The Information Zone:

A dedicated space below the clock for rotating Hadiths or Islamic quotes.

Use a fade-in/fade-out animation for smooth transitions every 30-60 seconds.

Phase 3: Functional Logic & State Management
Program the "behavior" of the display.

Dynamic Data Integration:

Sync with a Prayer Time API or a local JSON schedule.

Automate the Hijri Date calculation.

Status Transitions (UX Flow):

Adhan Mode: When the clock hits prayer time, trigger a full-screen overlay with "WAKTU ADZAN [Name]" and a soft notification sound.

Iqomah Countdown: After the Adhan, switch the hero section to an "Iqomah Countdown" (e.g., 10 minutes).

Prayer Mode (Dark Theme): During actual prayer times, the screen should automatically dim or turn black with a simple "Luruskan Shaf" (Straighten the Rows) text to avoid distracting congregants.

Phase 4: Footer & Communication
Categorized Running Text:

Implement a marquee at the very bottom.

Feature: Use color-coded labels like [DONASI], [PENGUMUMAN], or [KAJIAN] to help people scan information quickly.