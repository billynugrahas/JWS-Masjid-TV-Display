# Layout Theme Guide

## Overview

The masjid display uses a **layout theme system** that separates visual layout from shared logic. Each layout is a single JS file that provides the HTML structure. The shared `display.js` handles all logic (clock, prayer state machine, audio, data fetching).

## File Structure

```
public/
├── display.html          # Thin shell (loading screen + script tag)
├── display.js            # Shared logic — never modified for layouts
├── style.css             # Shared styles
└── layouts/
    └── default.js        # Default 3-column layout
```

## How It Works

1. `display.html` loads → shows "Memuat tampilan..."
2. `display.js` fetches settings → reads `display_layout` (e.g. `"default"`)
3. Dynamically loads `/layouts/default.js`
4. Injects the layout HTML into the page
5. Starts clock, fetches data, runs state machine — all against the injected DOM elements

## Creating a New Layout

### Step 1: Create the layout file

Create `public/layouts/{layout-id}.js`. The file must define a global `MasjidLayout` object:

```js
/**
 * Layout: Your Layout Name
 * Description of what this layout looks like
 */

var MasjidLayout = {
  id: 'layout-id',           // Must match filename (without .js)
  name: 'Display Name',      // Shown in admin dropdown
  description: 'Short description',

  getHTML: function() {
    return `
      <!-- Your entire HTML structure here -->
      <!-- Must include ALL required element IDs listed below -->
    `;
  }
};
```

### Step 2: Add to admin dropdown

In `public/admin.html`, find the "Layout Tampilan" `<select>` and add an option:

```html
<select id="setting-display-layout">
  <option value="default">Default (3 Kolom)</option>
  <option value="your-layout-id">Your Layout Name</option>
</select>
```

### Step 3 (optional): Add layout-specific CSS

Add styles scoped to your layout in `style.css` using the auto-generated body class:

```css
/* Styles specific to your-layout-id */
body.layout-your-layout-id .main-three-column {
  grid-template-columns: 50% 50%;
}
```

Or include a `<style>` tag directly inside your layout's `getHTML()` return value.

### Step 4: Rebuild

```bash
docker compose build && docker compose up -d
```

Then select the new layout in Admin → Pengaturan → Tampilan Display → Layout Tampilan.

---

## Required Element IDs

Every layout **must** include these element IDs in its HTML. If any are missing, the corresponding feature will silently not work.

### Header

| ID | Element | Used For |
|---|---------|----------|
| `mosque-logo-img` | `<img>` | Uploaded mosque logo image |
| `mosque-logo-emoji` | `<span>` | Fallback emoji logo |
| `mosque-name` | `<h1>` | Mosque name text |
| `mosque-tagline` | `<span>` | Tagline (hidden when empty) |
| `mosque-address` | `<span>` | Address (hidden when empty) |
| `mosque-phone` | `<span>` | Phone (hidden when empty) |
| `date-masehi` | `<div>` | Gregorian date display |
| `date-hijri` | `<div>` | Hijri date display |

### Center / Clock

| ID | Element | Used For |
|---|---------|----------|
| `current-time` | `<div>` | Clock HH:MM |
| `current-seconds` | `<div>` | Clock :SS |
| `countdown-pill` | `<div>` | Countdown to next adzan |
| `countdown-label` | `<span>` | "Menuju Adzan Subuh" text |
| `countdown-time` | `<span>` | Countdown timer display |
| `iqomah-section` | `<div>` | Iqomah countdown (hidden by default) |
| `iqomah-time` | `<div>` | Iqomah MM:SS display |
| `prayer-progress` | `<div>` | Prayer in-progress screen (hidden by default) |
| `current-prayer-name` | `<span>` | "SUBUH" / "DZUHUR" etc |
| `prayer-subtext` | `<div>` | "Luruskan dan Rapatkan Shaf" |
| `prayer-subtext-2` | `<div>` | Second subtext line |

### Left Column — Announcements & Donations

| ID | Element | Used For |
|---|---------|----------|
| `announcements-list` | `<div>` | Container for announcement items |
| `donations-list` | `<div>` | Container for donation items |
| `donations-wrapper` | `<div>` | Wrapper for donations + QR |
| `donation-qr-section` | `<div>` | QR code display (hidden by default) |
| `donation-qr-image` | `<img>` | QR code image |
| `qr-fullscreen-image` | `<img>` | Fullscreen QR image |
| `qr-fullscreen-subtext` | `<div>` | Fullscreen QR mosque name |

### Right Column — Video

| ID | Element | Used For |
|---|---------|----------|
| `video-container` | `<div>` | Ka'bah video embed container |
| `video-placeholder` | `<div>` | Placeholder when video is off |

### Prayer Grid & Info

| ID | Element | Used For |
|---|---------|----------|
| `prayer-grid` | `<div>` | 5 prayer time cards (filled by JS) |
| `optional-times-section` | `<section>` | Imsak/Syuruq section (hidden by default) |
| `optional-times-grid` | `<div>` | Imsak/Syuruq cards (filled by JS) |
| `info-text` | `<p>` | Rotating hadith/quote text |
| `info-source` | `<span>` | Hadith source attribution |

### Footer & Misc

| ID | Element | Used For |
|---|---------|----------|
| `marquee` | `<div>` | Scrolling running text |
| `beep-sound` | `<audio>` | Notification audio element |
| `bg-overlay` | `<div>` | Background image overlay |

---

## Required CSS Classes

These classes are queried by `display.js` — the elements with these IDs must have these classes:

| Class | On Element | Used For |
|-------|-----------|----------|
| `.live-indicator` | Any element in header | Toggle LIVE badge visibility |
| `.card-announcements` | Announcements card wrapper | Show/hide announcements section |
| `.card-donations` | Donations card wrapper | Show/hide donations section |
| `.column-left` | Left column container | QR fullscreen overlay target |

Additionally, `renderPrayerGrid()` creates `.prayer-card` elements inside `#prayer-grid`. Each has a `data-prayer-index` attribute for highlighting.

---

## Body Classes (state management)

`display.js` toggles these classes on `<body>` — your CSS should handle them:

| Body Class | When Active | Effect |
|-----------|-------------|--------|
| `adhan-mode` | During adzan | Typically hides left column, switches to 2-column |
| `calm-mode` | During prayer | Dims/blurs everything except prayer progress |
| `no-kabah-video` | When video disabled | Hides right column |
| `dark-mode` + `dark-soft` | Dark mode soft style | Dark background, muted colors |
| `dark-mode` + `dark-calm` | Dark mode calm style | Darker background |
| `no-transitions` | Low-RAM mode | Disables all CSS animations |
| `hide-prayer-icons` | Setting enabled | Hides emoji icons on prayer cards |
| `layout-{id}` | Always | Layout identification class |

---

## Minimal Example

```js
var MasjidLayout = {
  id: 'minimal',
  name: 'Minimal (2 Kolom)',
  description: 'Tanpa video Ka\'bah, fokus ke jam dan jadwal sholat',

  getHTML: function() {
    return `
      <div class="bg-overlay" id="bg-overlay"></div>
      <div class="main-container">
        <header class="header">
          <div class="header-left">
            <div class="mosque-logo">
              <img id="mosque-logo-img" class="mosque-logo-img" style="display: none;">
              <span id="mosque-logo-emoji">🕌</span>
            </div>
            <div class="mosque-name-wrapper">
              <h1 class="mosque-name" id="mosque-name">Masjid</h1>
              <span class="mosque-tagline" id="mosque-tagline" style="display: none;"></span>
              <span class="mosque-address" id="mosque-address" style="display: none;"></span>
              <span class="mosque-phone" id="mosque-phone" style="display: none;"></span>
            </div>
          </div>
          <div class="header-center">
            <div class="date-card">
              <div class="date-masehi" id="date-masehi">-</div>
              <div class="date-hijri" id="date-hijri">-</div>
            </div>
          </div>
          <div class="header-right">
            <div class="live-indicator">
              <span class="live-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
        </header>

        <!-- Your custom layout here with all required IDs -->
        <section class="main-two-column">
          <div class="column-center">
            <div class="clock-container">
              <div class="clock-time" id="current-time">00:00</div>
              <div class="clock-seconds" id="current-seconds">:00</div>
            </div>
            <div class="countdown-pill" id="countdown-pill">
              <span class="countdown-label" id="countdown-label"></span>
              <span class="countdown-time" id="countdown-time"></span>
            </div>
            <div class="iqomah-section" id="iqomah-section" style="display: none;">
              <div class="iqomah-title">IQOMAH</div>
              <div class="iqomah-time" id="iqomah-time">00:00</div>
            </div>
            <div class="prayer-progress" id="prayer-progress" style="display: none;">
              <div class="prayer-progress-icon">🕌</div>
              <div class="prayer-progress-text">SHOLAT <span id="current-prayer-name"></span></div>
              <div class="prayer-progress-sub" id="prayer-subtext"></div>
              <div class="prayer-progress-sub2" id="prayer-subtext-2"></div>
            </div>
          </div>

          <div class="column-left">
            <div class="info-card card-announcements">
              <div class="info-card-header">
                <span class="info-card-icon">📢</span>
                <h3 class="info-card-title">PENGUMUMAN</h3>
              </div>
              <div class="announcements-container" id="announcements-list"></div>
            </div>
            <div class="info-card card-donations">
              <div class="info-card-header">
                <span class="info-card-icon">❤️</span>
                <h3 class="info-card-title">DONASI</h3>
              </div>
              <div class="donations-wrapper" id="donations-wrapper">
                <div class="donations-container" id="donations-list"></div>
                <div class="donation-qr-section" id="donation-qr-section" style="display: none;">
                  <div class="donation-qr-label">Scan untuk Donasi</div>
                  <img class="donation-qr-image" id="donation-qr-image" alt="QR Code Donasi">
                </div>
              </div>
            </div>
            <div class="qr-fullscreen-display" id="qr-fullscreen-display">
              <div class="qr-fullscreen-content">
                <div class="qr-fullscreen-label">Scan untuk Donasi</div>
                <img class="qr-fullscreen-image" id="qr-fullscreen-image" alt="QR Code Donasi">
                <div class="qr-fullscreen-subtext" id="qr-fullscreen-subtext"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Hidden but required elements -->
        <div style="display:none;">
          <div id="video-container"></div>
          <div id="video-placeholder"></div>
        </div>

        <section class="optional-times-section" id="optional-times-section" style="display: none;">
          <div class="optional-times-grid" id="optional-times-grid"></div>
        </section>

        <section class="prayer-section">
          <div class="prayer-grid" id="prayer-grid"></div>
        </section>

        <section class="info-section">
          <div class="info-container">
            <div class="info-icon">📜</div>
            <div class="info-content">
              <p class="info-text" id="info-text"></p>
              <span class="info-source" id="info-source"></span>
            </div>
          </div>
        </section>

        <footer class="footer">
          <div class="marquee-container">
            <div class="marquee" id="marquee"></div>
          </div>
        </footer>
      </div>

      <audio id="beep-sound" preload="auto"></audio>
    `;
  }
};
```

---

## Checklist

When creating a new layout:

- [ ] File created at `public/layouts/{id}.js`
- [ ] `MasjidLayout.id` matches filename (without `.js`)
- [ ] All required element IDs present (see table above)
- [ ] Required CSS classes present (`.live-indicator`, `.card-announcements`, `.card-donations`, `.column-left`)
- [ ] `<option>` added to admin dropdown in `public/admin.html`
- [ ] CSS handles all body state classes (`adhan-mode`, `calm-mode`, `no-kabah-video`, `dark-mode`)
- [ ] Tested: prayer times render correctly
- [ ] Tested: countdown and iqomah transitions work
- [ ] Tested: Ka'bah video shows/hides based on settings
- [ ] Tested: dark mode works
- [ ] Tested: marquee scrolls
- [ ] Rebuild: `docker compose build && docker compose up -d`
