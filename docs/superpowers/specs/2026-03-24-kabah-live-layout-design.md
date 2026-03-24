# Ka'bah Live Layout Design

**Date:** 2026-03-24
**Project:** Masjid Display System
**Feature:** 3-Column Control Center Layout

---

## Overview

Redesign the main content area of the display page from a vertical grid layout to a horizontal 3-column layout. The left column stacks Announcements and Donations vertically, the center column displays the main clock and countdown, and the right column reserves space for a future Live Ka'bah video module.

---

## Scope

### What Changes
- Main content area (previously hero section + info block) becomes a 3-column layout

### What Stays the Same
- Header (mosque name, date display, live indicator)
- Imsak/Syuruq optional times section
- Prayer cards horizontal row
- Hadith/Info section
- Footer marquee

---

## Layout Architecture

### Grid Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER (unchanged)                       │
├────────────────┬──────────────────────────┬────────────────────┤
│                │                          │                    │
│   LEFT (30%)   │      CENTER (40%)        │    RIGHT (30%)     │
│                │                          │                    │
│  Announcements │     Main Clock           │   Ka'bah Video     │
│      +         │        +                 │    Placeholder     │
│   Donations    │    Countdown Pill        │     (16:9)         │
│                │                          │                    │
├────────────────┴──────────────────────────┴────────────────────┤
│                    IMSAK / SYURUQ (unchanged)                    │
├─────────────────────────────────────────────────────────────────┤
│                    PRAYER CARDS ROW (unchanged)                  │
├─────────────────────────────────────────────────────────────────┤
│                    HADITH SECTION (unchanged)                    │
├─────────────────────────────────────────────────────────────────┤
│                    FOOTER MARQUEE (unchanged)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Column Ratios
- **Left Column:** 30%
- **Center Column:** 40%
- **Right Column:** 30%
- **Gap:** 24px between columns
- **Container padding:** 32px margin

---

## Design Specifications

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary Green | `#1E3A2B` | Deep Emerald - text, active states |
| Accent Green | `#74D5A8` | Mint - countdown time accent |
| Background | `#F8F9FA` | Off-white page background |
| Glass Surface | `rgba(255, 255, 255, 0.80)` | Card backgrounds |
| Text | `#212529` | Dark charcoal body text |
| Text Muted | `#6C757D` | Secondary text |

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Clock Time | Poppins | 800 (ExtraBold) | clamp(4rem, 12vw, 8rem) |
| Clock Seconds | Poppins | 600 | clamp(1.5rem, 4vw, 3rem) |
| Card Titles | Poppins | 700 | 0.85rem |
| Body Text | Inter | 400-500 | 0.8rem |
| Countdown Time | Poppins | 700 | 1.1rem |

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.80);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.5);
border-radius: 20px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
```

---

## Component Details

### 1. Left Column - Announcements & Donations

Two glassmorphism cards stacked vertically with equal flex distribution.

**Announcements Card:**
- Icon: 📢
- Title: "PENGUMUMAN"
- Content: Vertical list of announcement titles (with content if available)
- Behavior: Auto-rotate if more than configured limit

**Donations Card:**
- Icon: ❤️
- Title: "DONASI"
- Content: Donation items with progress bars (for target-based) or amount only (for infaq rutin)
- 2-column grid layout for donation items
- Behavior: Auto-rotate if more than configured limit

### 2. Center Column - Clock & Countdown

**Clock:**
- Large digital time display (HH:mm)
- Seconds shown 40% smaller with 50% opacity
- Uses Poppins ExtraBold

**Countdown Pill:**
- Dark emerald pill-shaped badge
- Shows "Menuju Adzan [Prayer Name]" + countdown time
- Mint accent color for time display
- Subtle shadow for depth

**States:**
- Default: Countdown to next prayer
- Adhan time: Shows "WAKTU ADZAN [PRAYER]"
- Iqomah: Shows iqomah countdown
- Prayer in progress: Shows prayer name with subtext

### 3. Right Column - Ka'bah Video Placeholder

**Container:**
- 16:9 aspect ratio
- Rounded corners (20px)
- Overflow hidden

**Placeholder State (video OFF):**
- Semi-transparent emerald background
- Dashed border
- Centered Ka'bah icon (🕋)
- Text: "VIDEO LIVE KA'BAH (OFF)"
- Subtle backdrop blur

**Active State (video ON - future):**
- Video fills container with `object-fit: cover`
- Rounded corners preserved

**Configuration:**
- Video URL will be configurable via admin settings
- Default state is OFF/placeholder

---

## CSS Implementation

### Main Container Grid
```css
.main-container {
  display: grid;
  grid-template-rows: auto 1fr auto auto auto auto;
  height: 100vh;
  padding: 1.5vh 2vw;
  gap: 1.5vh;
  overflow: hidden;
}
```

### 3-Column Section
```css
.main-three-column {
  display: grid;
  grid-template-columns: 30% 40% 30%;
  gap: 24px;
  padding: 16px 0;
  align-items: start;
}

.column-left,
.column-center,
.column-right {
  display: flex;
  flex-direction: column;
}

.column-left {
  gap: 20px;
}

.column-center {
  align-items: center;
  justify-content: center;
}

.column-right {
  align-items: center;
}
```

---

## HTML Structure

```html
<!-- ==================== 3-COLUMN MAIN SECTION ==================== -->
<section class="main-three-column">

  <!-- Left Column: Announcements + Donations -->
  <div class="column-left">
    <div class="info-card card-announcements">
      <div class="info-card-header">
        <span class="info-card-icon">📢</span>
        <h3 class="info-card-title">PENGUMUMAN</h3>
      </div>
      <div class="announcements-container" id="announcements-list">
        <!-- Dynamic content -->
      </div>
    </div>

    <div class="info-card card-donations">
      <div class="info-card-header">
        <span class="info-card-icon">❤️</span>
        <h3 class="info-card-title">DONASI</h3>
      </div>
      <div class="donations-container" id="donations-list">
        <!-- Dynamic content -->
      </div>
    </div>
  </div>

  <!-- Center Column: Clock + Countdown -->
  <div class="column-center">
    <div class="clock-container">
      <div class="clock-time" id="current-time">00:00</div>
      <div class="clock-seconds" id="current-seconds">:00</div>
    </div>

    <div class="countdown-pill" id="countdown-pill">
      <span class="countdown-label" id="countdown-label">Menuju Adzan Subuh</span>
      <span class="countdown-time" id="countdown-time">07:45:10</span>
    </div>

    <!-- Iqomah and Prayer Progress sections (hidden states) -->
  </div>

  <!-- Right Column: Ka'bah Video -->
  <div class="column-right">
    <div class="video-container" id="video-container">
      <div class="video-placeholder" id="video-placeholder">
        <div class="video-placeholder-icon">🕋</div>
        <div class="video-placeholder-text">
          VIDEO LIVE KA'BAH<br>
          <span style="opacity: 0.6">(OFF)</span>
        </div>
      </div>
    </div>
  </div>

</section>
```

---

## Future Enhancements

1. **Video URL Configuration** - Add setting in admin panel for Ka'bah live stream URL
2. **Video State Toggle** - Add enable/disable checkbox for video display
3. **Multiple Video Sources** - Support for different stream providers
4. **Video Error Handling** - Fallback to placeholder if stream fails

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/display.html` | Restructure main content area to 3-column layout |
| `public/style.css` | Add new CSS classes for 3-column grid and video container |
| `public/display.js` | Update selectors if needed, add video placeholder logic |
| `server.js` | Add default settings for video URL (future) |
| `public/admin.html` | Add video URL configuration (future) |
| `public/admin.js` | Handle video settings (future) |

---

## Acceptance Criteria

- [ ] Header remains unchanged
- [ ] Left column displays Announcements and Donations stacked vertically
- [ ] Center column displays large clock with smaller seconds
- [ ] Center column displays countdown pill below clock
- [ ] Right column displays Ka'bah video placeholder (16:9)
- [ ] Glassmorphism styling applied to all cards
- [ ] Emerald green theme consistent throughout
- [ ] Prayer cards row remains unchanged below 3-column section
- [ ] Hadith section remains unchanged
- [ ] Footer marquee remains unchanged
- [ ] Layout optimized for 1920x1080 landscape TV display
