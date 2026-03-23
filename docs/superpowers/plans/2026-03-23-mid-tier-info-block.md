# Mid-Tier Information Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-card glassmorphism information block (Announcements + Donations) between the clock and prayer cards on the display page.

**Architecture:** Server-side adds donations to the `/api/state` endpoint. Client-side adds new HTML section, CSS styles, and JS rendering functions with visibility toggled by prayer state.

**Tech Stack:** Express.js, vanilla JavaScript, CSS with glassmorphism effects

**Spec:** `docs/superpowers/specs/2026-03-23-mid-tier-info-block-design.md`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `server.js` | Modify | Add donations to `/api/state` response |
| `public/display.html` | Modify | Add new info-block section HTML |
| `public/style.css` | Modify | Add glassmorphism card styles |
| `public/display.js` | Modify | Add rendering functions + state visibility |

---

### Task 1: Add Donations to API State Endpoint

**Files:**
- Modify: `server.js:433-453`

- [ ] **Step 1: Add donations query to `/api/state`**

In `server.js`, locate the `/api/state` endpoint (around line 433) and add donations to the response:

```javascript
app.get('/api/state', (req, res) => {
  const settings = {};
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  const prayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();
  const hadiths = db.prepare('SELECT * FROM hadiths WHERE is_active = 1').all();
  const announcements = db.prepare("SELECT * FROM announcements WHERE status = 'published' AND (expiry_date IS NULL OR expiry_date > date('now'))").all();
  const runningTexts = db.prepare('SELECT * FROM running_texts WHERE is_active = 1 ORDER BY priority DESC').all();
  const donations = db.prepare('SELECT * FROM donations ORDER BY updated_at DESC').all();

  res.json({
    settings,
    prayers,
    hadiths,
    announcements,
    donations,
    runningTexts,
    serverTime: new Date().toISOString()
  });
});
```

- [ ] **Step 2: Test the endpoint**

```bash
# If jq is installed:
curl -s http://localhost:3000/api/state | jq '.donations'

# Alternative (no jq):
curl -s http://localhost:3000/api/state | grep -o '"donations":\[.*\]' | head -1
```

Expected: JSON array of donation objects (may be empty `[]` if no donations added)

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat(api): add donations to /api/state response

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Add HTML Structure for Info Block

**Files:**
- Modify: `public/display.html` (insert between line 82 and line 84)

- [ ] **Step 1: Add the info-block section HTML**

In `display.html`, locate the hero-section closing tag (`</section>` at line 82) and the optional-times-section opening tag (line 84). Insert the new section between them:

```html
    <!-- ==================== MID-TIER INFO BLOCK ==================== -->
    <section class="info-block-section" id="info-block-section">
      <div class="info-block-grid">
        <!-- Announcements Card -->
        <div class="info-card info-card-announcements">
          <div class="info-card-header">
            <span class="info-card-icon">📢</span>
            <h3 class="info-card-title">PENGUMUMAN</h3>
          </div>
          <ul class="info-card-list" id="announcements-list">
            <li>Memuat pengumuman...</li>
          </ul>
        </div>

        <!-- Donations Card -->
        <div class="info-card info-card-donations">
          <div class="info-card-header">
            <span class="info-card-icon">❤️</span>
            <h3 class="info-card-title">DONASI</h3>
          </div>
          <div class="donations-container" id="donations-list">
            <span style="color: var(--color-text-muted); font-size: 0.8rem;">Memuat data donasi...</span>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 2: Verify HTML placement**

Open `display.html` and confirm the new section is between `</section>` (hero-section) and `<section class="optional-times-section"`.

- [ ] **Step 3: Commit**

```bash
git add public/display.html
git commit -m "feat(display): add mid-tier info block HTML structure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Add CSS Styles for Info Block

**Files:**
- Modify: `public/style.css` (add after existing prayer card styles, around line 508)

- [ ] **Step 1: Add info block CSS styles**

In `style.css`, add these styles after the `.prayer-card.active .iqomah` rule (around line 507), before the INFO / HADITH SECTION:

```css
/* ==================== MID-TIER INFO BLOCK ==================== */
.info-block-section {
  padding: 0 1vw;
  flex-shrink: 0;
}

.info-block-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.5rem, 1vw, 1rem);
}

.info-card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  padding: clamp(0.5rem, 1vh, 1rem) clamp(0.75rem, 1.5vw, 1.5rem);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.5vw;
  margin-bottom: 0.5vh;
}

.info-card-icon {
  font-size: clamp(1rem, 1.5vh, 1.25rem);
}

.info-card-title {
  font-family: var(--font-display);
  font-size: clamp(0.7rem, 1.2vh, 0.9rem);
  font-weight: 700;
  color: #1E3A2B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

/* Announcements list */
.info-card-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card-list li {
  font-family: var(--font-body);
  font-size: clamp(0.65rem, 1.1vh, 0.8rem);
  color: var(--color-text);
  padding: 0.25vh 0;
  padding-left: 1rem;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-card-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #1E3A2B;
  font-weight: bold;
}

/* Donations container */
.donations-container {
  display: flex;
  flex-direction: column;
  gap: 0.5vh;
}

.donation-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25vw;
}

.donation-category {
  font-family: var(--font-body);
  font-size: clamp(0.6rem, 1vh, 0.75rem);
  color: var(--color-text-muted);
}

.donation-amount {
  font-family: var(--font-display);
  font-size: clamp(0.7rem, 1.2vh, 0.95rem);
  font-weight: 700;
  color: #1E3A2B;
}

.donation-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(30, 58, 43, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.donation-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E3A2B, #2D6A4F);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Hide info block during Adhan state */
body.adhan-mode .info-block-section {
  display: none;
}
```

- [ ] **Step 2: Verify CSS integration**

Check that the new styles don't conflict with existing styles by looking for duplicate class names. The new classes (`info-block-section`, `info-card`, etc.) are unique.

- [ ] **Step 3: Commit**

```bash
git add public/style.css
git commit -m "feat(display): add glassmorphism styles for mid-tier info block

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Add JavaScript Rendering and State Management

**Files:**
- Modify: `public/display.js`

- [ ] **Step 1: Add donations to state variables**

At the top of `display.js` (around line 22), add `donations` to the state variables:

```javascript
let donations = [];
```

Add it after the `let announcements = [];` line.

- [ ] **Step 2: Update fetchData to store donations**

In the `fetchData()` function (around line 141), add donations extraction after announcements:

```javascript
donations = data.donations || [];
```

The function should now look like:
```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();

    settings = data.settings || {};
    prayerTimes = data.prayers || [];
    hadiths = data.hadiths && data.hadiths.length > 0 ? data.hadiths : defaultHadiths;
    runningTexts = data.runningTexts || [];
    announcements = data.announcements || [];
    donations = data.donations || [];

    updateDisplayElements();
    renderPrayerGrid();
    renderOptionalTimes();
    renderMarquee();
    renderAnnouncementsList();
    renderDonationsList();
    startHadithRotation();
    checkPrayerState();
  } catch (error) {
    console.error('Error fetching data:', error);
    hadiths = defaultHadiths;
  }
}
```

- [ ] **Step 3: Add formatCurrency helper function**

Add this function after the existing `formatCountdown` function (around line 617):

```javascript
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
```

- [ ] **Step 4: Add renderAnnouncementsList function**

Add this function after `formatCurrency`:

```javascript
function renderAnnouncementsList() {
  const list = document.getElementById('announcements-list');
  if (!list) return;

  const published = announcements.slice(0, 3); // Max 3 items (already filtered by API)

  if (published.length === 0) {
    list.innerHTML = '<li style="color: var(--color-text-muted);">Tidak ada pengumuman</li>';
    return;
  }

  list.innerHTML = published.map(a => `<li>${a.title}</li>`).join('');
}
```

- [ ] **Step 5: Add renderDonationsList function**

Add this function after `renderAnnouncementsList`:

```javascript
function renderDonationsList() {
  const container = document.getElementById('donations-list');
  if (!container) return;

  if (donations.length === 0) {
    container.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.8rem;">Tidak ada data donasi</span>';
    return;
  }

  container.innerHTML = donations.map(d => {
    const progress = d.target > 0 ? Math.min((d.amount / d.target) * 100, 100) : 0;
    return `
      <div class="donation-item">
        <span class="donation-category">${d.category}:</span>
        <span class="donation-amount">${formatCurrency(d.amount)}</span>
        ${d.target > 0 ? `
          <div class="donation-progress-bar">
            <div class="donation-progress-fill" style="width: ${progress}%"></div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}
```

- [ ] **Step 6: Add adhan-mode class toggle to setAdzanState**

In the `setAdzanState()` function (around line 532), add the body class:

```javascript
function setAdzanState(prayer) {
  currentState = AppState.ADZAN;
  currentPrayerIndex = prayerTimes.indexOf(prayer);
  nextPrayerIndex = currentPrayerIndex;

  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'none';
  document.getElementById('countdown-pill').style.display = 'flex';
  document.body.classList.add('adhan-mode');  // <-- ADD THIS LINE

  document.getElementById('countdown-label').textContent = `WAKTU ADZAN ${prayer.name.toUpperCase()}`;
  document.getElementById('countdown-time').textContent = prayer.time;

  updatePrayerHighlight(currentPrayerIndex);
  playBeep();
}
```

- [ ] **Step 7: Remove adhan-mode class in setCountdownToNextPrayer**

In the `setCountdownToNextPrayer()` function (around line 487), add the class removal:

```javascript
function setCountdownToNextPrayer(prayerIndex) {
  nextPrayerIndex = prayerIndex;
  currentPrayerIndex = -1;
  currentState = AppState.WAITING_ADZAN;

  // Hide other sections
  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'none';
  document.getElementById('countdown-pill').style.display = 'flex';
  document.body.classList.remove('adhan-mode');  // <-- ADD THIS LINE
  document.body.classList.remove('calm-mode');   // Also ensure calm-mode is removed
```

- [ ] **Step 8: Remove adhan-mode class in setIqomahCountdown**

In the `setIqomahCountdown()` function (around line 548), add the class removal:

```javascript
function setIqomahCountdown(remainingMinutes, prayer) {
  currentState = AppState.IQOMAH;
  currentPrayerIndex = prayerTimes.indexOf(prayer);
  nextPrayerIndex = currentPrayerIndex;

  document.getElementById('countdown-pill').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'none';
  document.getElementById('iqomah-section').style.display = 'block';
  document.body.classList.remove('adhan-mode');  // <-- ADD THIS LINE
  document.body.classList.remove('calm-mode');
```

- [ ] **Step 9: Test in browser**

1. Start the server: `npm start`
2. Open `http://localhost:3000/display`
3. Verify the info block appears below the clock
4. Check that announcements and donations render correctly
5. To test Adhan hiding:
   - Open browser DevTools console
   - Run: `document.body.classList.add('adhan-mode')`
   - Verify info block disappears
   - Run: `document.body.classList.remove('adhan-mode')`
   - Verify info block reappears

- [ ] **Step 10: Commit**

```bash
git add public/display.js
git commit -m "feat(display): add rendering and state management for info block

- Add renderAnnouncementsList and renderDonationsList functions
- Add adhan-mode body class toggle for visibility
- Add formatCurrency helper for IDR formatting

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Test Data Setup (Optional)

**Files:**
- None (API calls only)

- [ ] **Step 1: Create test announcement (if none exist)**

Check if announcements exist, or create test data:

```bash
# Check existing announcements
curl -s http://localhost:3000/api/announcements

# If empty, create a test announcement:
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{"title":"Kajian Rutin Sabtu","content":"Kajian rutin setiap Sabtu ba\'da Maghrib","status":"published"}'
```

- [ ] **Step 2: Create test donation (if none exist)**

```bash
# Check existing donations
curl -s http://localhost:3000/api/donations

# If empty, create test donations:
curl -X POST http://localhost:3000/api/donations \
  -H "Content-Type: application/json" \
  -d '{"category":"Infaq Jumat","amount":2500000,"target":0,"description":""}'

curl -X POST http://localhost:3000/api/donations \
  -H "Content-Type: application/json" \
  -d '{"category":"Dana Renovasi","amount":45000000,"target":100000000,"description":"Pembangunan mihrab baru"}'
```

---

### Task 6: Final Integration Testing

**Files:**
- None (verification only)

- [ ] **Step 1: Full display test**

```bash
npm start
```

Open `http://localhost:3000/display` and verify:
- [ ] Info block appears between clock and optional times
- [ ] Announcements card shows up to 3 items with bullets
- [ ] Donations card shows categories with formatted amounts
- [ ] Progress bars appear for donations with targets
- [ ] Glassmorphism effect matches prayer cards
- [ ] Layout doesn't push prayer cards off-screen

- [ ] **Step 2: Test with Docker (if applicable)**

```bash
docker compose up -d --build
```

Open `http://localhost:5000/display` and repeat verification.

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(display): final adjustments for mid-tier info block

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Add donations to API | `server.js` |
| 2 | Add HTML structure | `public/display.html` |
| 3 | Add CSS styles | `public/style.css` |
| 4 | Add JS rendering | `public/display.js` |
| 5 | Test data setup (optional) | - |
| 6 | Integration test | - |

**Total commits:** 5
