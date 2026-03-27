# Full-Screen QR Code Rotation Feature

## Overview

Add an option to display the donation QR code in a full-column view that rotates with the normal PENGUMUMAN + DONASI view on a configurable timer. This allows jamaah to easily scan the QR code from a distance.

## User Stories

1. As a mosque administrator, I want to enable a full-screen QR display mode so that jamaah can scan the donation QR from across the room.
2. As a mosque administrator, I want to configure how long the QR is displayed so I can balance between showing donation info and enabling scans.
3. As a display viewer, I want a smooth transition between the info view and QR view so the experience is not jarring.

## Requirements

### Functional Requirements

1. **FR1**: New setting "Tampilkan QR Layar Penuh" to enable/disable the full-column QR rotation
2. **FR2**: New setting "Durasi Tampil QR" to configure rotation interval (default: 10 seconds)
3. **FR3**: Rotation only occurs when BOTH `donation_qr_enabled` AND `donation_qr_fullscreen_enabled` are true
4. **FR4**: Transition should be smooth (fade effect)
5. **FR5**: Rotation should pause/respect "disable transitions" setting for low-RAM devices (instant switch, no animation)

### Non-Functional Requirements

1. **NFR1**: Must not impact performance on low-RAM devices
2. **NFR2**: Must maintain existing QR functionality (small QR in donations card)
3. **NFR3**: Must work with existing dark mode and calm mode states

## Technical Design

### Settings Schema

Two new settings stored in `settings` table:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `donation_qr_fullscreen_enabled` | string | `"false"` | Enable full-column QR rotation |
| `donation_qr_fullscreen_interval` | string | `"10"` | Seconds to show full QR |

### File Changes

#### 1. `public/admin.html`
- Add new settings inputs in the "Donasi & Infaq" section, grouped with existing QR settings
- Checkbox: "Tampilkan QR Layar Penuh" (id: `setting-donation-qr-fullscreen-enabled`)
- Number input: "Durasi Tampil QR (detik)" (id: `setting-donation-qr-fullscreen-interval`)

#### 2. `public/admin.js`
- Add to `populateSettings()`: Load and display the two new settings
- Add to save handler: Include new settings in the POST to `/api/settings`
- Add input change handlers if needed for validation

#### 3. `public/display.html`
- Add new element inside `column-left` for full-screen QR display:
  ```html
  <div class="qr-fullscreen-display" id="qr-fullscreen-display" style="display: none;">
    <div class="qr-fullscreen-content">
      <div class="qr-fullscreen-label">Scan untuk Donasi</div>
      <img class="qr-fullscreen-image" id="qr-fullscreen-image" alt="QR Code Donasi">
      <div class="qr-fullscreen-subtext" id="qr-fullscreen-subtext"></div>
    </div>
  </div>
  ```

#### 4. `public/display.js`
- Add new state variables:
  - `qrFullscreenInterval` - interval reference
  - `isQRFullscreenVisible` - current visibility state
- Add new functions:
  - `startQRFullscreenRotation()` - initialize rotation interval
  - `stopQRFullscreenRotation()` - clear interval
  - `toggleQRFullscreenView(show)` - toggle CSS class on column-left
  - `updateQRFullscreenDisplay()` - set QR image source and subtext
- Modify `updateDisplayElements()`:
  - Call `startQRFullscreenRotation()` when both QR settings are enabled
  - Call `stopQRFullscreenRotation()` when disabled
- Modify `fetchData()`:
  - Ensure rotation restarts if settings change
- Cleanup: Add to `beforeunload` handler to clear interval

#### 5. `public/style.css`
- Add `.qr-fullscreen-display` styles:
  - Full height of column-left
  - Centered flex layout
  - Larger QR image (40vh)
  - Smooth opacity transition
- Add `.column-left.qr-fullscreen` class:
  - Hide `.card-announcements` and `.card-donations`
  - Show `.qr-fullscreen-display`
- Dark mode support for new elements
- Respect `body.no-transitions` for instant switching

### Rotation Logic

```
On settings load/change:
  IF donation_qr_enabled AND donation_qr_fullscreen_enabled:
    Start rotation interval
  ELSE:
    Stop rotation, ensure normal view is shown

Rotation interval (every N seconds):
  Toggle isQRFullscreenVisible
  IF isQRFullscreenVisible:
    Add 'qr-fullscreen' class to column-left
    Update QR image source
  ELSE:
    Remove 'qr-fullscreen' class from column-left
```

### Transition Behavior

- **Normal mode**: 0.5s opacity fade transition
- **Low-RAM mode** (`disable_transitions=true`): Instant switch, no animation

## Edge Cases

1. **No QR image uploaded**: Rotation should not start even if enabled
2. **During adhan/prayer states**: Rotation continues (doesn't interfere with prayer state machine)
3. **Settings change mid-rotation**: Clear existing interval, start fresh with new settings
4. **QR deleted while rotation active**: Stop rotation, return to normal view

## Testing Checklist

- [ ] Enable full-screen QR, verify rotation starts
- [ ] Disable full-screen QR, verify rotation stops
- [ ] Change interval, verify new interval is used
- [ ] Verify smooth transition animation
- [ ] Enable "disable transitions", verify instant switch
- [ ] Delete QR image, verify rotation stops gracefully
- [ ] Verify dark mode styling
- [ ] Verify during adhan/prayer states
- [ ] Verify on low-RAM device
