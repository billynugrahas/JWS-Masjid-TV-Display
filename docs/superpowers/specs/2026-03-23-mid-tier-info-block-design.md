# Design Spec: Mid-Tier Information Block

**Date:** 2026-03-23
**Status:** Approved for Implementation

## Overview

Add a new Mid-Tier Information Block to the main mosque display (`display.html`) featuring two side-by-side glassmorphism cards: one for Announcements and one for Donations. This block provides timely information to worshippers without interfering with prayer times.

## Requirements

### Functional Requirements

1. **Announcements Card (Left)**
   - Display megaphone icon (📢)
   - Show up to 3 published announcements as a bulleted list
   - Fetch from `/api/announcements/published` endpoint
   - Display announcement title only (not full content)

2. **Donations Card (Right)**
   - Display heart icon (❤️)
   - Show all donation categories from `/api/donations` endpoint
   - For donations with a `target` > 0, show progress bar
   - Format amounts as Indonesian Rupiah (Rp X.XXX.XXX)

3. **Visibility Behavior**
   - Visible during: IDLE, WAITING_ADZAN, IQOMAH, FINISHED states
   - Hidden during: ADZAN state only

4. **Layout Constraint**
   - Must not push prayer cards off-screen on 1920x1080 displays
   - Maximum height: ~10-12vh

### Non-Functional Requirements

- **Performance:** Render within existing 5-second data polling cycle
- **Accessibility:** Maintain readable font sizes for TV viewing
- **Consistency:** Match existing glassmorphism styling from prayer cards

## Design Details

### Layout Position

```
[HEADER]
[HERO SECTION - Clock + Countdown]
[MID-TIER INFO BLOCK]  <-- NEW
[OPTIONAL TIMES - Imsak/Syuruq]
[PRAYER GRID - 5 cards]
[HADITH SECTION]
[FOOTER MARQUEE]
```

### HTML Structure

```html
<!-- Mid-Tier Information Block -->
<section class="info-block-section" id="info-block-section">
  <div class="info-block-grid">
    <!-- Announcements Card -->
    <div class="info-card info-card-announcements">
      <div class="info-card-header">
        <span class="info-card-icon">📢</span>
        <h3 class="info-card-title">PENGUMUMAN</h3>
      </div>
      <ul class="info-card-list" id="announcements-list">
        <!-- Dynamic: <li>Title</li> -->
      </ul>
    </div>

    <!-- Donations Card -->
    <div class="info-card info-card-donations">
      <div class="info-card-header">
        <span class="info-card-icon">❤️</span>
        <h3 class="info-card-title">DONASI</h3>
      </div>
      <div class="donations-container" id="donations-list">
        <!-- Dynamic: Category + Amount + Progress Bar -->
      </div>
    </div>
  </div>
</section>
```

### CSS Styling

```css
/* Mid-Tier Information Block */
.info-block-section {
  padding: 0 1vw;
  max-height: 12vh;
}

.info-block-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.5rem, 1vw, 1rem);
  height: 100%;
}

.info-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 0.75rem;
  padding: clamp(0.5rem, 1vh, 1rem) clamp(0.75rem, 1.5vw, 1.5rem);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  font-family: 'Poppins', sans-serif;
  font-size: clamp(0.7rem, 1.2vh, 0.9rem);
  font-weight: 700;
  color: #1E3A2B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-card-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card-list li {
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.65rem, 1.1vh, 0.8rem);
  color: #212529;
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
}

/* Donation items */
.donation-item {
  margin-bottom: 0.5vh;
}

.donation-category {
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.6rem, 1vh, 0.75rem);
  color: #6C757D;
  display: block;
}

.donation-amount {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(0.75rem, 1.3vh, 1rem);
  font-weight: 700;
  color: #1E3A2B;
}

.donation-progress-bar {
  height: 4px;
  background: rgba(27, 67, 50, 0.2);
  border-radius: 2px;
  margin-top: 0.25vh;
  overflow: hidden;
}

.donation-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E3A2B, #2D6A4F);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Hide during Adhan state */
body.adhan-mode .info-block-section {
  display: none;
}
```

### JavaScript Logic

#### Data Fetching (display.js)

Add to existing `fetchData()` function:
- Store `donations` from `/api/state` response

#### Rendering Functions

```javascript
// Render announcements list
function renderAnnouncementsList() {
  const list = document.getElementById('announcements-list');
  if (!list) return;

  const published = announcements
    .filter(a => a.status === 'published')
    .slice(0, 3); // Max 3 items

  if (published.length === 0) {
    list.innerHTML = '<li style="color: var(--color-text-muted);">Tidak ada pengumuman</li>';
    return;
  }

  list.innerHTML = published.map(a => `<li>${a.title}</li>`).join('');
}

// Render donations list
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
        <span class="donation-category">${d.category}</span>
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

#### State Management

Modify `setAdzanState()` to add body class:
```javascript
function setAdzanState(prayer) {
  // ... existing code ...
  document.body.classList.add('adhan-mode');
}
```

Modify `setCountdownToNextPrayer()` to remove body class:
```javascript
function setCountdownToNextPrayer(prayerIndex) {
  // ... existing code ...
  document.body.classList.remove('adhan-mode');
}
```

Also remove `adhan-mode` in `setIqomahCountdown()`.

## Files to Modify

| File | Changes |
|------|---------|
| `public/display.html` | Add new section HTML structure |
| `public/style.css` | Add CSS styles for info block |
| `public/display.js` | Add rendering functions and state visibility logic |
| `server.js` | Add `donations` to `/api/state` response (if not present) |

## Testing Checklist

- [ ] Block appears on display page
- [ ] Announcements show max 3 items
- [ ] Donations show with proper formatting
- [ ] Progress bars display for donations with targets
- [ ] Block disappears during Adhan state
- [ ] Block reappears after Adhan ends
- [ ] Layout doesn't push prayer cards off-screen on 1920x1080
- [ ] Glassmorphism effect matches existing cards

## Out of Scope

- Admin panel modifications (already has announcement/donation management)
- Marquee integration (separate feature)
- Animation/transitions for the block appearance
