# Masjid Display System

A lightweight web-based mosque display system designed for TV/kiosk displays (STB devices). Features a fullscreen display for prayer times and a mobile-friendly admin panel.

## Quick Start

```bash
# Development
npm install
npm start

# Docker (Production)
docker compose up -d --build
```

- **Display**: http://localhost:3000/display (or port 5000 in Docker)
- **Admin**: http://localhost:3000/admin

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Express Server                       │
│                      (server.js)                         │
├─────────────────────────────────────────────────────────┤
│  /api/*  │  REST API (CRUD for all resources)           │
│  /public │  Static files (HTML, CSS, JS)                │
├─────────────────────────────────────────────────────────┤
│              SQLite (better-sqlite3)                     │
│              Data stored in ./masjid.db                  │
│              Docker: /app/data/masjid.db                 │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
masjid-display-jws/
├── server.js           # Express server + all API routes + DB schema
├── package.json        # Dependencies: express, better-sqlite3, cors
├── docker-compose.yml  # Docker config (port 5000:3000, TZ: Asia/Jakarta)
├── Dockerfile          # Node 18 Alpine, copies public/ into image
├── README.md
├── CLAUDE.md
└── public/
    ├── display.html    # Main TV display page
    ├── display.js      # Display logic (clock, prayer state machine, marquee)
    ├── style.css       # Display styles (viewport-relative, CSS Grid layout)
    ├── admin.html      # Admin panel SPA
    ├── admin.js        # Admin logic (CRUD operations, modals)
    └── admin.css       # Admin styles
```

## Database Schema

SQLite tables created on startup (server.js:19-66):

| Table | Columns | Notes |
|-------|---------|-------|
| `settings` | `key` (PK), `value` | Key-value store for mosque config |
| `prayer_times` | `id`, `name`, `time`, `iqomah_duration` | 5 prayers: Subuh, Dzuhur, Ashar, Maghrib, Isya |
| `hadiths` | `id`, `text`, `source`, `is_active`, `created_at` | Rotating quotes on display |
| `donations` | `id`, `category`, `amount`, `target`, `description`, `updated_at` | Donation tracking |
| `announcements` | `id`, `title`, `content`, `priority`, `status`, `expiry_date`, `created_at` | Announcements |
| `running_texts` | `id`, `text`, `category`, `priority`, `is_active` | Marquee ticker items |

## API Endpoints

### Settings
- `GET /api/settings` - Get all settings as object
- `POST /api/settings` - Update settings (key-value pairs in body)

### Prayer Times
- `GET /api/prayers` - Get all 5 prayers
- `PUT /api/prayers/:id` - Update time/iqomah_duration

### Hadiths
- `GET /api/hadiths` - All hadiths
- `GET /api/hadiths/active` - Active only
- `POST /api/hadiths` - Create
- `PUT /api/hadiths/:id` - Update
- `DELETE /api/hadiths/:id` - Delete

### Donations
- `GET /api/donations` - All donations
- `POST /api/donations` - Create
- `PUT /api/donations/:id` - Update
- `DELETE /api/donations/:id` - Delete

### Announcements
- `GET /api/announcements` - All
- `GET /api/announcements/published` - Published + not expired
- `POST /api/announcements` - Create
- `PUT /api/announcements/:id` - Update
- `DELETE /api/announcements/:id` - Delete

### Running Texts
- `GET /api/running-texts` - All
- `GET /api/running-texts/active` - Active only (for display)
- `POST /api/running-texts` - Create
- `PUT /api/running-texts/:id` - Update
- `DELETE /api/running-texts/:id` - Delete

### Combined State
- `GET /api/state` - Returns `{ settings, prayers, hadiths, announcements, runningTexts, serverTime }` - Used by display page for single fetch

## Display Page (display.js)

### State Machine
The display uses a state machine for prayer flow:

```
IDLE → WAITING_ADZAN → ADZAN → IQOMAH → PRAYER → FINISHED → IDLE
```

Key functions:
- `checkPrayerState()` - Runs every 1 second, determines current state
- `setCountdownToNextPrayer(idx)` - Shows countdown to next adzan
- `setAdzanState(prayer)` - Shows adzan time
- `setIqomahCountdown(minutes, prayer)` - Shows iqomah countdown with beep
- `setPrayerInProgress(name)` - Shows "calm mode" during prayer

### Layout (style.css)
- Uses CSS Grid: `grid-template-rows: auto 1fr auto auto auto` for exact viewport fit
- All sizes use `clamp()` with viewport units (`vh`/`vw`) for TV scaling
- No scrolling - designed for 1920x1080 displays
- `body.calm-mode` - Dimmed UI during prayer

### Data Polling
- `fetchData()` called every 5 seconds
- `updateClock()` every 1 second
- `checkPrayerState()` every 1 second

## Admin Panel (admin.js)

Single-page app with section navigation. All data fetched in parallel on load:

```javascript
const [settingsRes, prayersRes, hadithsRes, announcementsRes, donationsRes, runningTextsRes] = await Promise.all([...]);
```

### Key Patterns
- Modals for CRUD operations (hadith, announcement, donation, running text)
- Toast notifications for feedback
- Settings saved via single "Simpan Semua" button
- Background images stored as base64 data URLs in settings

## Settings Keys

| Key | Default | Description |
|-----|---------|-------------|
| `mosque_name` | "Masjid Al-Muhajirin" | Display header |
| `mosque_logo` | "🕌" | Emoji logo |
| `mosque_tagline` | "Baitullah untuk Umat" | Subtitle |
| `mosque_address` | "" | Address |
| `mosque_phone` | "" | Phone |
| `background_image` | "" | Base64 data URL |
| `hadith_rotation_interval` | "30" | Seconds between hadith rotation |
| `show_live_indicator` | "true" | Show LIVE badge |
| `marquee_loop` | "true" | Seamless marquee loop |
| `marquee_speed` | "30" | Marquee duration (seconds) |
| `marquee_gap` | "4" | Gap between marquee items (rem) |

## Common Tasks

### Adding a new API endpoint
1. Add route in `server.js`
2. Add corresponding function in `admin.js` or `display.js`

### Modifying display layout
1. Edit `public/display.html` for structure
2. Edit `public/style.css` for styling
3. Rebuild Docker: `docker compose up -d --build`

### Adding new settings
1. Add to `defaultSettings` object in `server.js`
2. Add input in `admin.html` settings section
3. Add to `populateSettings()` and save handler in `admin.js`

### Changing prayer times
Via admin panel (Jadwal Sholat section) or directly via API:
```bash
curl -X PUT http://localhost:3000/api/prayers/1 \
  -H "Content-Type: application/json" \
  -d '{"time":"04:45","iqomah_duration":15}'
```

## Deployment Notes

- Port mapping: Docker maps 5000 → 3000 internally
- Timezone: Asia/Jakarta (WIB)
- Data persistence: `masjid-data` volume for SQLite database
- No hot reload - must rebuild Docker image for code changes
