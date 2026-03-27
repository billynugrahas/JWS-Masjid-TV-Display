# Full-Screen QR Code Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable rotation between normal PENGUMUMAN+DONASI view and a full-column QR code display for easy scanning.

**Architecture:** CSS class toggle approach - add/remove a class on `.column-left` to switch between views. The fullscreen QR element exists in DOM but is hidden by default. JavaScript manages the rotation interval and toggles visibility.

**Tech Stack:** Vanilla JavaScript, CSS transitions, HTML. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-03-27-fullscreen-qr-rotation-design.md`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `public/admin.html` | Modify | Add 2 new settings inputs for fullscreen QR |
| `public/admin.js` | Modify | Load/save new settings, add to populateSettings() and save handler |
| `public/display.html` | Modify | Add fullscreen QR display element inside column-left |
| `public/display.js` | Modify | Add rotation logic, interval management, toggle functions |
| `public/style.css` | Modify | Add .qr-fullscreen styles, transition effects, dark mode support |
| `server.js` | Modify | Add default values for new settings |

---

## Task 1: Add Settings UI in Admin Panel

**Files:**
- Modify: `public/admin.html:552` (after the QR image upload section, before the closing div)

- [ ] **Step 1: Add fullscreen QR settings to admin.html**

Insert after line 552 (after the "Hapus QR Code" button div closes), inside the same card:

```html
              <hr style="border-color: var(--color-text-light); margin: 1rem 0;">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="setting-donation-qr-fullscreen-enabled">
                  <span>Tampilkan QR Layar Penuh</span>
                </label>
                <small style="color: var(--color-text-muted);">Rotasi tampilan QR dalam ukuran besar untuk memudahkan scan dari jauh</small>
              </div>
              <div class="form-group">
                <label>Durasi Tampil QR (detik)</label>
                <input type="number" id="setting-donation-qr-fullscreen-interval" value="10" min="5" max="60">
                <small style="color: var(--color-text-muted);">Durasi QR tampil sebelum kembali ke pengumuman/donasi</small>
              </div>
```

- [ ] **Step 2: Verify HTML structure**

Visually check that the new fields appear in the admin panel under Donasi & Infaq section, after the QR image upload area.

---

## Task 2: Add Settings Logic in Admin JavaScript

**Files:**
- Modify: `public/admin.js:1014-1027` (in populateSettings function)
- Modify: `public/admin.js:1241` (in save handler)

- [ ] **Step 1: Add loading logic in populateSettings()**

In `public/admin.js`, after line 1026 (after the donation QR preview logic), add:

```javascript
  // Fullscreen QR settings
  document.getElementById('setting-donation-qr-fullscreen-enabled').checked = appData.settings.donation_qr_fullscreen_enabled === 'true';
  document.getElementById('setting-donation-qr-fullscreen-interval').value = parseInt(appData.settings.donation_qr_fullscreen_interval) || 10;
```

- [ ] **Step 2: Add saving logic in the save handler**

In `public/admin.js`, after line 1241 (after `donation_qr_enabled`), add:

```javascript
      donation_qr_fullscreen_enabled: document.getElementById('setting-donation-qr-fullscreen-enabled').checked ? 'true' : 'false',
      donation_qr_fullscreen_interval: document.getElementById('setting-donation-qr-fullscreen-interval').value,
```

- [ ] **Step 3: Test the admin panel**

1. Open admin panel
2. Toggle "Tampilkan QR Layar Penuh" checkbox
3. Change "Durasi Tampil QR" value
4. Click "Simpan Semua"
5. Refresh page and verify settings are persisted

---

## Task 3: Add Default Settings in Server

**Files:**
- Modify: `server.js` (in defaultSettings object)

- [ ] **Step 1: Add default values for new settings**

Find the `defaultSettings` object in `server.js` and add the new settings:

```javascript
  donation_qr_fullscreen_enabled: 'false',
  donation_qr_fullscreen_interval: '10',
```

- [ ] **Step 2: Restart server and verify defaults work**

```bash
npm start
```

Check that new installs get the default values.

---

## Task 4: Add Fullscreen QR Element in Display HTML

**Files:**
- Modify: `public/display.html:85` (after the donations card, before column-left closes)

- [ ] **Step 1: Add fullscreen QR display element**

Insert after line 84 (after the card-donations div closes), inside column-left:

```html
        <!-- Fullscreen QR Display (for rotation mode) -->
        <div class="qr-fullscreen-display" id="qr-fullscreen-display" style="display: none;">
          <div class="qr-fullscreen-content">
            <div class="qr-fullscreen-icon">📱</div>
            <div class="qr-fullscreen-label">Scan untuk Donasi</div>
            <img class="qr-fullscreen-image" id="qr-fullscreen-image" alt="QR Code Donasi">
            <div class="qr-fullscreen-subtext" id="qr-fullscreen-subtext"></div>
          </div>
        </div>
```

- [ ] **Step 2: Verify HTML structure**

Check that the element is inside `.column-left` and after the donations card.

---

## Task 5: Add CSS Styles for Fullscreen QR

**Files:**
- Modify: `public/style.css` (add at end of file, before media queries)

- [ ] **Step 1: Add fullscreen QR display styles**

Add to `public/style.css`:

```css
/* ==================== FULLSCREEN QR DISPLAY ==================== */
.qr-fullscreen-display {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.column-left.qr-fullscreen .qr-fullscreen-display {
  display: flex;
  opacity: 1;
}

.qr-fullscreen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1.5vh;
  padding: 2vh;
}

.qr-fullscreen-icon {
  font-size: calc(clamp(2rem, 4vh, 3rem) * var(--font-scale));
}

.qr-fullscreen-label {
  font-family: var(--font-display);
  font-size: calc(clamp(1.2rem, 2.5vh, 1.8rem) * var(--font-scale));
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.qr-fullscreen-image {
  width: clamp(200px, 35vh, 350px);
  height: clamp(200px, 35vh, 350px);
  object-fit: contain;
  border-radius: var(--radius-lg);
  background: white;
  padding: 1vh;
  box-shadow: var(--shadow-lg);
}

.qr-fullscreen-subtext {
  font-family: var(--font-body);
  font-size: calc(clamp(0.85rem, 1.5vh, 1.1rem) * var(--font-scale));
  color: var(--color-text-muted);
  max-width: 80%;
}

/* Hide normal cards when in fullscreen QR mode */
.column-left.qr-fullscreen .card-announcements,
.column-left.qr-fullscreen .card-donations {
  opacity: 0;
  pointer-events: none;
  position: absolute;
}

/* Smooth transition for column-left */
.column-left {
  position: relative;
  transition: opacity 0.5s ease;
}

.column-left .card-announcements,
.column-left .card-donations {
  transition: opacity 0.5s ease;
}

/* No transitions mode - instant switching */
body.no-transitions .qr-fullscreen-display,
body.no-transitions .column-left,
body.no-transitions .column-left .card-announcements,
body.no-transitions .column-left .card-donations {
  transition: none;
}

/* Dark mode support */
body.dark-mode .qr-fullscreen-label {
  color: var(--color-accent);
}

body.dark-mode .qr-fullscreen-image {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* Calm mode - dim QR like other UI elements */
body.calm-mode .qr-fullscreen-display {
  opacity: 0.2;
  filter: blur(2px);
}
```

- [ ] **Step 2: Verify CSS loads without errors**

Open display page and check browser console for CSS errors.

---

## Task 6: Add Rotation Logic in Display JavaScript

**Files:**
- Modify: `public/display.js:28-29` (add new state variables after donationInterval)
- Modify: `public/display.js:376-391` (modify updateDisplayElements)
- Modify: `public/display.js:96-106` (add cleanup in beforeunload)

- [ ] **Step 1: Add state variables**

In `public/display.js`, after line 29 (`let announcementInterval = null;`), add:

```javascript
let qrFullscreenInterval = null;
let isQRFullscreenVisible = false;
```

- [ ] **Step 2: Add rotation functions**

Add these new functions at the end of `public/display.js` (before the audio functions, around line 1120):

```javascript
// ==================== QR FULLSCREEN ROTATION ====================
function startQRFullscreenRotation() {
  // Clear existing interval
  if (qrFullscreenInterval) {
    clearInterval(qrFullscreenInterval);
  }

  // Only start if both QR settings are enabled and we have an image
  const qrEnabled = settings.donation_qr_enabled === 'true' && settings.donation_qr_image;
  const fullscreenEnabled = settings.donation_qr_fullscreen_enabled === 'true';

  if (!qrEnabled || !fullscreenEnabled) {
    stopQRFullscreenRotation();
    return;
  }

  // Get interval from settings (default 10 seconds)
  const interval = (parseInt(settings.donation_qr_fullscreen_interval) || 10) * 1000;

  // Start rotation
  qrFullscreenInterval = setInterval(() => {
    isQRFullscreenVisible = !isQRFullscreenVisible;
    toggleQRFullscreenView(isQRFullscreenVisible);
  }, interval);
}

function stopQRFullscreenRotation() {
  if (qrFullscreenInterval) {
    clearInterval(qrFullscreenInterval);
    qrFullscreenInterval = null;
  }
  // Ensure we return to normal view
  isQRFullscreenVisible = false;
  toggleQRFullscreenView(false);
}

function toggleQRFullscreenView(show) {
  const columnLeft = document.querySelector('.column-left');
  const qrFullscreenImage = document.getElementById('qr-fullscreen-image');
  const qrFullscreenSubtext = document.getElementById('qr-fullscreen-subtext');

  if (!columnLeft) return;

  if (show && settings.donation_qr_image) {
    // Update QR image
    if (qrFullscreenImage) {
      qrFullscreenImage.src = settings.donation_qr_image;
    }
    // Update subtext with mosque name
    if (qrFullscreenSubtext) {
      qrFullscreenSubtext.textContent = settings.mosque_name || '';
    }
    // Add class to show fullscreen QR
    columnLeft.classList.add('qr-fullscreen');
  } else {
    // Remove class to show normal view
    columnLeft.classList.remove('qr-fullscreen');
  }
}

function updateQRFullscreenDisplay() {
  // Update the QR image source if fullscreen is currently visible
  const qrFullscreenImage = document.getElementById('qr-fullscreen-image');
  const qrFullscreenSubtext = document.getElementById('qr-fullscreen-subtext');

  if (qrFullscreenImage && settings.donation_qr_image) {
    qrFullscreenImage.src = settings.donation_qr_image;
  }
  if (qrFullscreenSubtext) {
    qrFullscreenSubtext.textContent = settings.mosque_name || '';
  }
}
```

- [ ] **Step 3: Integrate with updateDisplayElements()**

In `updateDisplayElements()` function, after the existing donation QR section (around line 391), add:

```javascript
  // Update fullscreen QR display
  updateQRFullscreenDisplay();

  // Start or stop QR fullscreen rotation
  const qrEnabled = settings.donation_qr_enabled === 'true' && settings.donation_qr_image;
  const fullscreenEnabled = settings.donation_qr_fullscreen_enabled === 'true';

  if (qrEnabled && fullscreenEnabled) {
    startQRFullscreenRotation();
  } else {
    stopQRFullscreenRotation();
  }
```

- [ ] **Step 4: Add cleanup in beforeunload handler**

In the `beforeunload` event handler (around line 96-106), add cleanup for the new interval:

```javascript
    if (qrFullscreenInterval) clearInterval(qrFullscreenInterval);
```

The handler should look like:
```javascript
  window.addEventListener('beforeunload', () => {
    clearInterval(clockInterval);
    clearInterval(dataInterval);
    clearInterval(prayerCheckInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    if (iqomahInterval) clearInterval(iqomahInterval);
    if (hadithInterval) clearInterval(hadithInterval);
    if (donationInterval) clearInterval(donationInterval);
    if (announcementInterval) clearInterval(announcementInterval);
    if (qrFullscreenInterval) clearInterval(qrFullscreenInterval);
  });
```

- [ ] **Step 5: Test the rotation functionality**

1. Enable "Tampilkan QR Code Donasi" in admin
2. Upload a QR image
3. Enable "Tampilkan QR Layar Penuh"
4. Set interval to 5 seconds for testing
5. Save settings
6. Open display page
7. Verify rotation between normal view and fullscreen QR every 5 seconds

---

## Task 7: Test Edge Cases

- [ ] **Step 1: Test with no QR image uploaded**

1. Disable QR or remove QR image
2. Verify rotation stops and normal view is shown

- [ ] **Step 2: Test with disable transitions enabled**

1. Enable "Nonaktifkan Transisi" in performance settings
2. Verify rotation switches instantly without fade animation

- [ ] **Step 3: Test during adhan/prayer states**

1. Trigger adhan or prayer state
2. Verify rotation continues (doesn't interfere with prayer state machine)

- [ ] **Step 4: Test dark mode**

1. Enable dark mode
2. Verify fullscreen QR displays correctly with dark mode colors

- [ ] **Step 5: Test settings persistence**

1. Change fullscreen settings
2. Save
3. Refresh display page
4. Verify settings are applied

---

## Task 8: Final Commit

- [ ] **Step 1: Commit all changes**

```bash
git add public/admin.html public/admin.js public/display.html public/display.js public/style.css server.js
git commit -m "$(cat <<'EOF'
feat: add fullscreen QR rotation for donation scanning

- Add settings: donation_qr_fullscreen_enabled, donation_qr_fullscreen_interval
- Add fullscreen QR display element with smooth transitions
- Add rotation logic with configurable interval
- Support dark mode and no-transitions mode
- Respect low-RAM device settings

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Testing Summary

| Test Case | Expected Result |
|-----------|-----------------|
| Enable fullscreen QR | Rotation starts between normal view and fullscreen QR |
| Disable fullscreen QR | Rotation stops, normal view shown |
| Change interval | New interval used on next settings save |
| No QR image uploaded | Rotation doesn't start |
| Disable transitions | Instant switch, no fade animation |
| Dark mode enabled | Fullscreen QR uses dark mode colors |
| During adhan/prayer | Rotation continues without interference |
| Page refresh | Settings persist, rotation resumes |
