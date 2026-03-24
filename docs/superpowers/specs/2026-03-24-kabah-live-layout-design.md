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
| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| Primary Green | `var(--color-primary)` | `#1B4332` | Deep Emerald - text, active states |
| Primary Light | `var(--color-primary-light)` | `#2D6A4F` | Lighter emerald |
| Accent Green | `var(--color-accent)` | `#D4AF37` | Gold accent |
| Mint Accent | - | `#74D5A8` | Countdown time accent |
| Background | `var(--bg-primary)` | `#F8F9FA` | Off-white page background |
| Glass Surface | - | `rgba(255, 255, 255, 0.80)` | Card backgrounds |
| Text | `var(--color-text)` | `#212529` | Dark charcoal body text |
| Text Muted | `var(--color-text-muted)` | `#6C757D` | Secondary text |

> **Note:** Use existing CSS variables from `:root` in `style.css` for consistency.

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Clock Time | Poppins | 800 (ExtraBold) | clamp(4rem, 15vh, 12rem) |
| Clock Seconds | Poppins | 600 | clamp(1.5rem, 6vh, 4rem) |
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

## Migration Guide

### Row-to-Section Mapping

The new grid structure maps as follows:

| Row | Section | Notes |
|-----|---------|-------|
| 1 | `header` | Unchanged |
| 2 | `main-three-column` | **NEW** - Replaces old hero + info-block |
| 3 | `optional-times-section` | Unchanged (Imsak/Syuruq) |
| 4 | `prayer-section` | Unchanged |
| 5 | `info-section` | Unchanged (Hadith) |
| 6 | `footer` | Unchanged |

### What Gets Removed
- `.hero-section` - Content moves to center column of `.main-three-column`
- `.info-block-section` - Content moves to left column of `.main-three-column`

### CSS to Remove/Update
```css
/* REMOVE these selectors after migration: */
.hero-section { ... }
.info-block-section { ... }
body.adhan-mode .info-block-section { ... }
body.calm-mode .info-block-section { ... }

/* ADD these new selectors: */
.main-three-column { ... }
.column-left { ... }
.column-center { ... }
.column-right { ... }
body.adhan-mode .column-left { ... }
body.calm-mode .column-left { ... }
body.calm-mode .column-right { ... }
```

### Main Container Grid Update
```css
/* OLD */
.main-container {
  grid-template-rows: auto 1fr auto auto auto;
}

/* NEW */
.main-container {
  grid-template-rows: auto 1fr auto auto auto auto;
}
```

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

## State Handling

### Adhan Mode
When `body.adhan-mode` is active:
- Left column (Announcements + Donations): **Hidden** (`display: none`)
- Center column: Clock + Countdown remain visible, countdown shows "WAKTU ADZAN [PRAYER]"
- Right column: Video placeholder remains visible
- Layout adjusts: Grid becomes 50% center / 50% right (left column hidden)

```css
body.adhan-mode .main-three-column {
  grid-template-columns: 50% 50%;
}

body.adhan-mode .column-left {
  display: none;
}
```

### Calm Mode (During Prayer)
When `body.calm-mode` is active:
- Left column: Cards dimmed with reduced opacity (`opacity: 0.3`)
- Center column: Shows prayer progress section
- Right column: Video placeholder dimmed (`opacity: 0.3`)
- Overall UI takes subdued appearance

```css
body.calm-mode .column-left,
body.calm-mode .column-right {
  opacity: 0.3;
  pointer-events: none;
}
```

### Iqomah Mode
- Center column shows iqomah countdown
- Left and right columns remain visible but static

---

## Responsive Design

### Breakpoints (matching existing `style.css`)

| Breakpoint | Behavior |
|------------|----------|
| **> 1200px** | Full 3-column layout (30% / 40% / 30%) |
| **900px - 1200px** | 3-column maintained, gaps reduced to 16px |
| **600px - 900px** | Stack columns vertically: Clock → Announcements/Donations → Video |
| **< 600px** | Single column, video placeholder hidden |

### CSS Media Queries
```css
/* Tablet landscape (900px - 1200px) */
@media (max-width: 1200px) {
  .main-three-column {
    gap: 16px;
  }
}

/* Tablet portrait (600px - 900px) */
@media (max-width: 900px) {
  .main-three-column {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
  }

  .column-left {
    flex-direction: row;
    gap: 16px;
  }

  .column-left .info-card {
    flex: 1;
  }
}

/* Mobile (< 600px) */
@media (max-width: 600px) {
  .column-right {
    display: none;
  }
}
```

---

## Complete Video Container CSS

```css
/* Video Container */
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: rgba(30, 58, 43, 0.08);
}

/* Placeholder State */
.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(30, 58, 43, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 2px dashed rgba(30, 58, 43, 0.25);
  border-radius: 20px;
}

.video-placeholder-icon {
  font-size: clamp(2rem, 5vw, 4rem);
  opacity: 0.7;
}

.video-placeholder-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  color: #1E3A2B;
  text-align: center;
  line-height: 1.4;
  opacity: 0.8;
}

/* Active Video State (future) */
.video-container.active {
  border: none;
  background: transparent;
}

.video-container.active video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}
```

---

## JavaScript Updates

### Video Placeholder Logic
The video placeholder is **static for now**. No JavaScript changes required for the initial implementation.

Future implementation will add:
1. Setting `kabah_video_url` in server settings
2. Setting `kabah_video_enabled` (true/false)
3. JavaScript to check settings and toggle between placeholder and active video

### Selectors to Update
The existing selectors in `display.js` should continue to work:
- `#current-time` - Clock time
- `#current-seconds` - Clock seconds
- `#countdown-pill` - Countdown container
- `#countdown-label` - Countdown label text
- `#countdown-time` - Countdown time display

No selector changes needed - just HTML structure reorganization.

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

### Layout
- [ ] Header remains unchanged
- [ ] Left column displays Announcements and Donations stacked vertically
- [ ] Center column displays large clock with smaller seconds
- [ ] Center column displays countdown pill below clock
- [ ] Right column displays Ka'bah video placeholder (16:9 aspect ratio)
- [ ] Prayer cards row remains unchanged below 3-column section
- [ ] Hadith section remains unchanged
- [ ] Footer marquee remains unchanged

### Styling
- [ ] Glassmorphism styling applied to all cards
- [ ] Emerald green theme consistent throughout
- [ ] Clock uses vh-based sizing (matching existing pattern)
- [ ] Video placeholder has dashed border, Ka'bah icon, and "OFF" text

### State Handling
- [ ] Adhan mode: Left column hidden, layout adjusts to 50/50
- [ ] Calm mode: Left and right columns dimmed (opacity: 0.3)
- [ ] Iqomah mode: Center column shows iqomah countdown

### Responsive
- [ ] Desktop (>1200px): Full 3-column 30/40/30 layout
- [ ] Tablet (900-1200px): 3-column with reduced gaps
- [ ] Tablet portrait (600-900px): Stacked vertically
- [ ] Mobile (<600px): Video placeholder hidden

### Performance
- [ ] Layout optimized for 1920x1080 landscape TV display
- [ ] No layout shift during state transitions
- [ ] Smooth transitions between prayer states
