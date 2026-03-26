# Dark Mode for Display Page - Design Spec

**Date:** 2026-03-26
**Status:** Draft
**Scope:** Display page only (not admin panel)

## Overview

Add a dark mode feature to the masjid display page with two style options:
1. **Soft Dark** - Dark gray backgrounds, modern app-like appearance
2. **Calm Mode Style** - Emerald gradient, matching the existing prayer-time aesthetic

The feature is controlled via the admin panel settings.

## Requirements

### Functional Requirements
- Admin can enable/disable dark mode via checkbox
- Admin can select between two dark mode styles via dropdown
- Dark mode applies to the display page only
- Dark mode is automatically disabled during ADZAN and PRAYER states (those states have their own styling)

### Non-Functional Requirements
- Instant transition (no animation) to avoid distraction on TV displays
- No flicker on page load
- Must work with existing features: glassmorphism cards, background images, Ka'bah video

## Settings Schema

Two new settings keys stored in the `settings` table:

| Key | Type | Values | Default |
|-----|------|--------|---------|
| `dark_mode_enabled` | string | `"true"`, `"false"` | `"false"` |
| `dark_mode_style` | string | `"soft"`, `"calm"` | `"soft"` |

## UI Design

### Admin Panel (Pengaturan Section)

Location: In the "Tampilan" subsection, after "Show Live Indicator"

```
[✓] Enable Dark Mode

    Style: [Soft Dark ▼]
```

- Style dropdown only visible when "Enable Dark Mode" is checked
- Dropdown options:
  - "Soft Dark" (value: `soft`)
  - "Calm Mode Style" (value: `calm`)

### Display Page

**Soft Dark Style:**
- Background: Dark navy (#0F0F1A)
- Cards: Semi-transparent dark with subtle borders
- Text: White/light gray
- Accent colors remain the same (gold, emerald)
- Glassmorphism effect adapted for dark backgrounds

**Calm Mode Style:**
- Background: Emerald gradient (reuse from `body.calm-mode`)
- Same treatment as Soft Dark for cards and text
- Creates a unified look with the prayer-time state

## Technical Design

### Server Changes (`server.js`)

Add default values in the `defaultSettings` object (around line 68):

```javascript
dark_mode_enabled: 'false',
dark_mode_style: 'soft'
```

### CSS Changes (`style.css`)

**CSS Specificity Strategy:**
Dark mode uses `body.dark-mode.dark-soft` and `body.dark-mode.dark-calm` selectors. These have higher specificity than `body.calm-mode` and `body.adhan-mode` (which only use a single class), ensuring dark mode can be properly toggled on/off. However, during ADZAN and PRAYER states, JavaScript will remove dark mode classes before adding state-specific classes.

**Complete CSS Rules (add at end of file, before media queries):**

```css
/* ==================== DARK MODE ==================== */

/* Dark Mode - Soft Style */
body.dark-mode.dark-soft {
  --bg-primary: #0F0F1A;
  --bg-card: rgba(30, 30, 50, 0.85);
  --bg-glass: rgba(30, 30, 50, 0.7);
  --color-text: #E8E8E8;
  --color-text-muted: #9CA3AF;
  --color-text-light: #6B7280;
}

/* Dark Mode - Calm Style */
body.dark-mode.dark-calm {
  background: linear-gradient(135deg, #081C15 0%, #1B4332 100%) !important;
  --bg-card: rgba(27, 67, 50, 0.6);
  --bg-glass: rgba(27, 67, 50, 0.5);
  --color-text: #E8E8E8;
  --color-text-muted: #9CA3AF;
  --color-text-light: #6B7280;
}

/* Dark mode overrides for elements with hardcoded colors */

/* Header */
body.dark-mode .header {
  background: var(--bg-glass);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Prayer cards */
body.dark-mode .prayer-card {
  background: var(--bg-glass);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

body.dark-mode .prayer-card .name {
  color: var(--color-text);
}

body.dark-mode .prayer-card .time {
  color: var(--color-accent);
}

body.dark-mode .prayer-card .iqomah {
  color: var(--color-text-muted);
}

/* Optional time cards */
body.dark-mode .optional-time-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

body.dark-mode .optional-time-card .name,
body.dark-mode .optional-time-card .time {
  color: var(--color-accent);
}

/* Info cards */
body.dark-mode .info-card {
  background: var(--bg-glass);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

body.dark-mode .info-card-title {
  color: var(--color-text);
}

/* Announcements */
body.dark-mode .announcement-title {
  color: var(--color-text);
}

body.dark-mode .announcement-content {
  color: var(--color-text-muted);
}

/* Donations */
body.dark-mode .donation-category {
  color: var(--color-text-muted);
}

body.dark-mode .donation-amount {
  color: var(--color-accent);
}

body.dark-mode .donation-progress-bar {
  background: rgba(255, 255, 255, 0.1);
}

body.dark-mode .donation-progress-fill {
  background: linear-gradient(90deg, var(--color-primary-light), var(--color-accent));
}

body.dark-mode .donation-percent {
  color: var(--color-text);
}

body.dark-mode .donation-qr-section {
  border-left-color: rgba(255, 255, 255, 0.1);
}

/* Info section (hadiths) */
body.dark-mode .info-container {
  background: var(--bg-glass);
  border-left-color: var(--color-accent);
}

body.dark-mode .info-text {
  color: var(--color-text);
}

body.dark-mode .info-source {
  color: var(--color-text-muted);
}

/* Video placeholder */
body.dark-mode .video-placeholder {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

body.dark-mode .video-placeholder-text {
  color: var(--color-text-muted);
}

/* Background overlay - add dark tint */
body.dark-mode .bg-overlay.active {
  background-color: rgba(0, 0, 0, 0.3);
  background-blend-mode: multiply;
}

/* IQOMAH section */
body.dark-mode .iqomah-title {
  color: var(--color-danger);
}

body.dark-mode .iqomah-time {
  color: var(--color-accent);
}

/* Countdown pill - keep gradient but ensure visibility */
body.dark-mode .countdown-pill {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), var(--shadow-glow);
}

/* Footer in dark mode - slightly darker for better contrast */
body.dark-mode .footer {
  background: linear-gradient(135deg, #0D1F17 0%, #1B4332 100%);
}
```

**Defensive CSS for State Modes:**

To ensure ADZAN and PRAYER states always display correctly even if there's a brief overlap in class application, add these rules:

```css
/* Ensure state modes override dark mode visuals */
body.adhan-mode {
  background: var(--bg-primary) !important;
}

body.calm-mode {
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%) !important;
}
```

### JavaScript Changes (`display.js`)

**Create a dedicated function for dark mode management:**

```javascript
// ==================== DARK MODE ====================
function updateDarkMode() {
  const darkModeEnabled = settings.dark_mode_enabled === 'true';
  const darkModeStyle = settings.dark_mode_style || 'soft';

  // Remove dark mode classes first
  document.body.classList.remove('dark-mode', 'dark-soft', 'dark-calm');

  // Apply dark mode only if enabled and not in special states
  // ADZAN uses adhan-mode, PRAYER uses calm-mode - both have their own styling
  if (darkModeEnabled && currentState !== AppState.ADZAN && currentState !== AppState.PRAYER) {
    document.body.classList.add('dark-mode', `dark-${darkModeStyle}`);
  }
}
```

**Call from `updateDisplayElements()`:**

```javascript
function updateDisplayElements() {
  // ... existing code ...

  // Update dark mode (call at the end)
  updateDarkMode();
}
```

**Initial Page Load Behavior:**

On first page load, `settings` is initialized as `{}`. When `fetchData()` retrieves actual settings, `settingsChanged` will be `true` (comparing empty object to populated settings). This triggers `updateDisplayElements()` which calls `updateDarkMode()`, ensuring dark mode is correctly applied immediately on load without flicker.

**Call from state transition functions** to ensure dark mode is removed when entering ADZAN or PRAYER states:

```javascript
function setAdzanState(prayer) {
  // ... existing code ...
  updateDarkMode(); // Will remove dark mode since state is ADZAN
}

function setPrayerInProgress(prayerName) {
  // ... existing code ...
  updateDarkMode(); // Will remove dark mode since state is PRAYER
}

function setCountdownToNextPrayer(prayerIndex) {
  // ... existing code ...
  updateDarkMode(); // Will apply dark mode if enabled (state is WAITING_ADZAN)
}

function setIqomahCountdown(remainingMinutes, prayer) {
  // ... existing code ...
  updateDarkMode(); // Will apply dark mode if enabled (state is IQOMAH)
}
```

### JavaScript Changes (`admin.js`)

**Add helper function:**

```javascript
function toggleDarkModeStyleVisibility() {
  const enabled = document.getElementById('setting-dark-mode-enabled').checked;
  const styleGroup = document.getElementById('dark-mode-style-group');
  styleGroup.style.display = enabled ? 'block' : 'none';
}
```

**In `populateSettings()`:**

```javascript
// Dark mode settings
document.getElementById('setting-dark-mode-enabled').checked = appData.settings.dark_mode_enabled === 'true';
document.getElementById('setting-dark-mode-style').value = appData.settings.dark_mode_style || 'soft';
toggleDarkModeStyleVisibility();
```

**In save handler (inside the settings object):**

```javascript
dark_mode_enabled: document.getElementById('setting-dark-mode-enabled').checked ? 'true' : 'false',
dark_mode_style: document.getElementById('setting-dark-mode-style').value
```

### HTML Changes (`admin.html`)

Add to the "Tampilan" subsection in settings (after the live indicator setting):

```html
<!-- Dark Mode Settings -->
<div class="form-group">
  <label class="checkbox-label">
    <input type="checkbox" id="setting-dark-mode-enabled" onchange="toggleDarkModeStyleVisibility()">
    <span>🌙 Enable Dark Mode</span>
  </label>
</div>
<div id="dark-mode-style-group" class="form-group" style="display: none; margin-left: 1.5rem;">
  <label>Style</label>
  <select id="setting-dark-mode-style">
    <option value="soft">Soft Dark</option>
    <option value="calm">Calm Mode Style</option>
  </select>
</div>
```

## State Interaction

| State | Dark Mode Applied? | Notes |
|-------|-------------------|-------|
| IDLE | Yes (if enabled) | Default state |
| WAITING_ADZAN | Yes (if enabled) | Countdown to adzan |
| ADZAN | No | Uses `adhan-mode` styling, dark mode classes removed |
| IQOMAH | Yes (if enabled) | Countdown before prayer, dark mode reapplied |
| PRAYER | No | Uses `calm-mode` styling, dark mode classes removed |
| FINISHED | Yes (if enabled) | Returns to IDLE with dark mode |

**State Transition Flow:**
1. WAITING_ADZAN → ADZAN: Dark mode removed (adhan-mode takes over)
2. ADZAN → IQOMAH: Dark mode reapplied (adhan-mode removed)
3. IQOMAH → PRAYER: Dark mode removed (calm-mode takes over)
4. PRAYER → FINISHED/IDLE: Dark mode reapplied (calm-mode removed)

## Background Image Handling

When dark mode is enabled with a background image:
- The `.bg-overlay` element gets an additional dark tint via `background-blend-mode: multiply`
- This ensures text readability while still showing the background image
- The existing `background_opacity` setting still applies

## Files to Modify

| File | Changes |
|------|---------|
| `server.js` | Add default values for `dark_mode_enabled` and `dark_mode_style` |
| `public/style.css` | Add dark mode CSS variables, body classes, and element overrides |
| `public/display.js` | Add `updateDarkMode()` function, call from state transitions and `updateDisplayElements()` |
| `public/admin.html` | Add dark mode toggle checkbox and style dropdown |
| `public/admin.js` | Add `toggleDarkModeStyleVisibility()`, populate and save settings |

## Testing Checklist

- [ ] Dark mode toggle enables/disables correctly
- [ ] Style dropdown appears only when dark mode is enabled
- [ ] Soft Dark style applies correct colors
- [ ] Calm Mode style applies emerald gradient
- [ ] Dark mode is disabled during ADZAN state
- [ ] Dark mode is disabled during PRAYER state
- [ ] Dark mode is re-enabled during IQOMAH state
- [ ] Dark mode persists after page refresh
- [ ] Background image works with dark mode (dark tint applied)
- [ ] All text remains readable in both styles
- [ ] Glassmorphism cards look correct in both styles
- [ ] Marquee/footer remains visible
- [ ] Ka'bah video section works correctly
- [ ] No flicker on page load
- [ ] Transition between states is smooth (no visual conflicts)
