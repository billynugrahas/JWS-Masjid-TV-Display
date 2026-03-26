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

Location: After existing display settings, before or near "Show Live Indicator"

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
- Background: Dark navy/gray (#0F0F1A or #1A1A2E)
- Cards: Semi-transparent dark with subtle borders
- Text: White/light gray
- Accent colors remain the same (gold, emerald)
- Glassmorphism effect adapted for dark backgrounds

**Calm Mode Style:**
- Background: Emerald gradient (reuse from `body.calm-mode`)
- Same treatment as Soft Dark for cards and text
- Creates a unified look with the prayer-time state

## Technical Design

### CSS Changes (`style.css`)

Add new CSS variables for dark mode inside a `body.dark-mode` selector:

```css
/* Dark Mode - Soft Style */
body.dark-mode.dark-soft {
  --bg-primary: #0F0F1A;
  --bg-card: rgba(30, 30, 50, 0.85);
  --bg-glass: rgba(30, 30, 50, 0.7);
  --color-text: #E8E8E8;
  --color-text-muted: #9CA3AF;
  /* ... other overrides */
}

/* Dark Mode - Calm Style */
body.dark-mode.dark-calm {
  background: linear-gradient(135deg, #081C15 0%, #1B4332 100%);
  --bg-card: rgba(27, 67, 50, 0.6);
  --bg-glass: rgba(27, 67, 50, 0.5);
  --color-text: #E8E8E8;
  --color-text-muted: #9CA3AF;
  /* ... other overrides */
}
```

### JavaScript Changes (`display.js`)

In `updateDisplayElements()` function, add:

```javascript
// Dark mode handling
const darkModeEnabled = settings.dark_mode_enabled === 'true';
const darkModeStyle = settings.dark_mode_style || 'soft';

// Remove any existing dark mode classes
document.body.classList.remove('dark-mode', 'dark-soft', 'dark-calm');

// Apply dark mode only if enabled and not in special states
if (darkModeEnabled && currentState !== AppState.ADZAN && currentState !== AppState.PRAYER) {
  document.body.classList.add('dark-mode', `dark-${darkModeStyle}`);
}
```

### JavaScript Changes (`admin.js`)

In `populateSettings()`:
```javascript
document.getElementById('setting-dark-mode-enabled').checked = appData.settings.dark_mode_enabled === 'true';
document.getElementById('setting-dark-mode-style').value = appData.settings.dark_mode_style || 'soft';
// Toggle style dropdown visibility
toggleDarkModeStyleVisibility();
```

In save handler:
```javascript
dark_mode_enabled: document.getElementById('setting-dark-mode-enabled').checked ? 'true' : 'false',
dark_mode_style: document.getElementById('setting-dark-mode-style').value
```

### HTML Changes (`admin.html`)

Add to settings section:
```html
<div class="setting-item">
  <label class="setting-label">
    <input type="checkbox" id="setting-dark-mode-enabled" onchange="toggleDarkModeStyleVisibility()">
    <span>🌙</span> Enable Dark Mode
  </label>
  <div id="dark-mode-style-group" class="setting-sub-item" style="display: none;">
    <label>Style</label>
    <select id="setting-dark-mode-style">
      <option value="soft">Soft Dark</option>
      <option value="calm">Calm Mode Style</option>
    </select>
  </div>
</div>
```

## State Interaction

| State | Dark Mode Applied? | Notes |
|-------|-------------------|-------|
| IDLE | Yes (if enabled) | Default state |
| WAITING_ADZAN | Yes (if enabled) | Countdown to adzan |
| ADZAN | No | Uses `adhan-mode` styling |
| IQOMAH | Yes (if enabled) | Countdown before prayer |
| PRAYER | No | Uses `calm-mode` styling |
| FINISHED | Yes (if enabled) | Brief transition state |

## Files to Modify

| File | Changes |
|------|---------|
| `public/style.css` | Add dark mode CSS variables and body classes |
| `public/display.js` | Apply dark mode classes in `updateDisplayElements()` |
| `public/admin.html` | Add dark mode toggle and style dropdown |
| `public/admin.js` | Add settings population and save logic |

## Testing Checklist

- [ ] Dark mode toggle enables/disables correctly
- [ ] Style dropdown appears only when dark mode is enabled
- [ ] Soft Dark style applies correct colors
- [ ] Calm Mode style applies emerald gradient
- [ ] Dark mode is disabled during ADZAN state
- [ ] Dark mode is disabled during PRAYER state
- [ ] Dark mode persists after page refresh
- [ ] Background image still works with dark mode (with overlay)
- [ ] All text remains readable in both styles
- [ ] Glassmorphism cards look correct in both styles
- [ ] Marquee/footer remains visible
- [ ] Ka'bah video section works correctly
