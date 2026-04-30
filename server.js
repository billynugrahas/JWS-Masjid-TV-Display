const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const https = require('https');
const adhan = require('adhan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const dbPath = process.env.DB_PATH || './masjid.db';
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS prayer_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    time TEXT NOT NULL,
    iqomah_duration INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS hadiths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    source TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount REAL DEFAULT 0,
    target REAL DEFAULT 0,
    description TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'draft',
    expiry_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS running_texts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    category TEXT DEFAULT 'info',
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
  );
`);

// Initialize default settings
const defaultSettings = {
  mosque_name: 'Masjid Al-Muhajirin',
  mosque_logo: '🕌',
  mosque_tagline: 'Baitullah untuk Umat',
  mosque_address: '',
  mosque_phone: '',
  running_text: 'Selamat datang di Masjid Al-Muhajirin',
  background_image: '',
  background_opacity: 0.15,
  hadith_rotation_interval: 30,
  show_live_indicator: 'true',
  font_scale: '1', // Font size multiplier for different screen resolutions
  marquee_loop: 'true',
  marquee_speed: 30,
  marquee_gap: 4,
  prayer_duration: 15,
  jumat_prayer_duration: 45,
  prayer_subtext: 'Luruskan dan Rapatkan Shaf',
  prayer_subtext_2: '',
  imsak_offset: 10,
  imsak_label: 'Imsak',
  imsak_enabled: 'false',
  syuruq_offset: 20,
  syuruq_label: 'Syuruq',
  syuruq_enabled: 'false',
  // Info block settings (Announcements & Donations)
  announcements_enabled: 'true',
  announcements_limit: '3',
  announcements_rotation: '10',
  donations_enabled: 'true',
  donations_limit: '6',
  donations_rotation: '10',
  // Fullscreen QR rotation settings
  donation_qr_fullscreen_enabled: 'false',
  donation_qr_fullscreen_only: 'false',
  donation_qr_fullscreen_interval: '10',
  // Prayer calculation settings
  prayer_calc_enabled: 'false',
  prayer_calc_method: 'Singapore', // Singapore = Kemenag method
  mosque_latitude: '-6.2088',
  mosque_longitude: '106.8456',
  // Ka'bah Video settings
  kabah_video_enabled: 'false',
  kabah_video_type: 'youtube',
  kabah_video_url: '',
  kabah_video_fallback_image: '',
  kabah_video_fallback_timeout: '300',
  // YouTube Auto-Find Live Stream settings
  kabah_video_autofind_enabled: 'false',
  kabah_video_autofind_keyword: 'live kaaba',
  kabah_video_autofind_api_key: '',
  // Time format setting
  time_format: '24h', // '24h' or '12h'
  // Dark mode settings
  dark_mode_enabled: 'false',
  dark_mode_style: 'soft', // 'soft' or 'calm'
  // Padding scale for different display resolutions
  padding_scale: '1',
  // Layout theme
  display_layout: 'default',
  // Event Countdown settings
  event_countdown_enabled: 'false',
  event_countdown_preset: 'custom',
  event_countdown_custom_name: '',
  event_countdown_custom_date: '',
  // Watchdog settings (auto-reload on hang)
  watchdog_enabled: 'true',
  watchdog_fail_threshold: '3',    // consecutive fetch failures before reload
  watchdog_max_reloads: '3'        // max reloads per hour
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) {
  insertSetting.run(key, value);
}

// Initialize default prayer times (WIB timezone)
const defaultPrayerTimes = [
  { name: 'Subuh', time: '04:30', iqomah_duration: 10 },
  { name: 'Dzuhur', time: '12:00', iqomah_duration: 10 },
  { name: 'Ashar', time: '15:15', iqomah_duration: 10 },
  { name: 'Maghrib', time: '18:00', iqomah_duration: 10 },
  { name: 'Isya', time: '19:15', iqomah_duration: 10 }
];

const insertPrayer = db.prepare('INSERT OR IGNORE INTO prayer_times (name, time, iqomah_duration) VALUES (?, ?, ?)');
const existingPrayers = db.prepare('SELECT COUNT(*) as count FROM prayer_times').get();
if (existingPrayers.count === 0) {
  for (const prayer of defaultPrayerTimes) {
    insertPrayer.run(prayer.name, prayer.time, prayer.iqomah_duration);
  }
}

// Initialize default hadiths
const defaultHadiths = [
  { text: 'Sholat berjamaah lebih utama 27 derajat dibanding sholat sendirian.', source: 'HR. Bukhari' },
  { text: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.', source: 'HR. Thabrani' }
];

const insertHadith = db.prepare('INSERT OR IGNORE INTO hadiths (text, source, is_active) VALUES (?, ?, 1)');
const existingHadiths = db.prepare('SELECT COUNT(*) as count FROM hadiths').get();
if (existingHadiths.count === 0) {
  for (const hadith of defaultHadiths) {
    insertHadith.run(hadith.text, hadith.source);
  }
}

// Initialize default donations
const defaultDonations = [
  { category: 'Infaq Jumat', amount: 0, target: 0, description: 'Infaq mingguan Jumat' },
  { category: 'Dana Renovasi', amount: 0, target: 50000000, description: 'Pengumpulan dana renovasi masjid' }
];

const insertDonation = db.prepare('INSERT OR IGNORE INTO donations (category, amount, target, description) VALUES (?, ?, ?, ?)');
const existingDonations = db.prepare('SELECT COUNT(*) as count FROM donations').get();
if (existingDonations.count === 0) {
  for (const donation of defaultDonations) {
    insertDonation.run(donation.category, donation.amount, donation.target, donation.description);
  }
}

// ============================================
// API ROUTES
// ============================================

// ---------- SETTINGS ----------
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(req.body)) {
    updateSetting.run(key, String(value));
  }
  res.json({ success: true });
});

// ---------- YOUTUBE AUTO-FIND LIVE STREAM ----------
let cachedYouTubeResult = null;
let cachedYouTubeTime = 0;
const YOUTUBE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

app.get('/api/youtube/find-live', async (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const s = {};
    for (const row of settingsRows) {
      s[row.key] = row.value;
    }

    const apiKey = s.kabah_video_autofind_api_key;
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ error: 'YouTube API key not configured. Please set it in Settings > Video Ka\'bah > Auto-Find.' });
    }

    const keyword = s.kabah_video_autofind_keyword || 'live kaaba';

    // Return cached result if still valid
    if (cachedYouTubeResult && (Date.now() - cachedYouTubeTime) < YOUTUBE_CACHE_TTL) {
      return res.json({ ...cachedYouTubeResult, cached: true });
    }

    const encodedKeyword = encodeURIComponent(keyword);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedKeyword}&type=video&eventType=live&order=viewCount&maxResults=5&key=${apiKey}`;

    const searchResponse = await httpsGet(searchUrl);
    const searchData = JSON.parse(searchResponse.body);

    if (!searchData.items || searchData.items.length === 0) {
      const result = { found: false, message: `No live stream found for "${keyword}"` };
      cachedYouTubeResult = result;
      cachedYouTubeTime = Date.now();
      return res.json(result);
    }

    // Get the top result by view count - use the first item (already sorted by viewCount)
    const topItem = searchData.items[0];
    const videoId = topItem.id.videoId;
    const result = {
      found: true,
      videoId: videoId,
      title: topItem.snippet.title,
      channelTitle: topItem.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: topItem.snippet.thumbnails.medium?.url || topItem.snippet.thumbnails.default?.url
    };

    cachedYouTubeResult = result;
    cachedYouTubeTime = Date.now();

    // Auto-update the kabah_video_url in the database so display picks it up
    const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    updateSetting.run('kabah_video_url', result.url);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('YouTube auto-find error:', error.message);
    res.status(500).json({ error: 'Failed to search YouTube: ' + error.message });
  }
});

app.post('/api/youtube/find-live/cache-clear', (req, res) => {
  cachedYouTubeResult = null;
  cachedYouTubeTime = 0;
  res.json({ success: true });
});

// ---------- PRAYER TIMES ----------
// Prayer calculation methods mapping
const calculationMethods = {
  'Singapore': adhan.CalculationMethod.Singapore(),
  'MuslimWorldLeague': adhan.CalculationMethod.MuslimWorldLeague(),
  'Egyptian': adhan.CalculationMethod.Egyptian(),
  'Karachi': adhan.CalculationMethod.Karachi(),
  'UmmAlQura': adhan.CalculationMethod.UmmAlQura(),
  'Dubai': adhan.CalculationMethod.Dubai(),
  'MoonsightingCommittee': adhan.CalculationMethod.MoonsightingCommittee(),
  'NorthAmerica': adhan.CalculationMethod.NorthAmerica(),
  'Kuwait': adhan.CalculationMethod.Kuwait(),
  'Qatar': adhan.CalculationMethod.Qatar()
};

// Function to calculate prayer times
function calculatePrayerTimes(settings, date = new Date()) {
  const latitude = parseFloat(settings.mosque_latitude) || -6.2088;
  const longitude = parseFloat(settings.mosque_longitude) || 106.8456;
  const methodName = settings.prayer_calc_method || 'Singapore';
  const method = calculationMethods[methodName] || adhan.CalculationMethod.Singapore();

  const coordinates = new adhan.Coordinates(latitude, longitude);
  const prayerTimes = new adhan.PrayerTimes(coordinates, date, method);

  // Get offsets from settings
  const offsets = {
    Subuh: parseInt(settings.prayer_offset_subuh) || 0,
    Dzuhur: parseInt(settings.prayer_offset_dzuhur) || 0,
    Ashar: parseInt(settings.prayer_offset_ashar) || 0,
    Maghrib: parseInt(settings.prayer_offset_maghrib) || 0,
    Isya: parseInt(settings.prayer_offset_isya) || 0
  };

  // Format times with offsets
  const formatTime = (date, offsetMinutes = 0) => {
    const adjusted = new Date(date.getTime() + offsetMinutes * 60000);
    return adjusted.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    });
  };

  return {
    Subuh: formatTime(prayerTimes.fajr, offsets.Subuh),
    Dzuhur: formatTime(prayerTimes.dhuhr, offsets.Dzuhur),
    Ashar: formatTime(prayerTimes.asr, offsets.Ashar),
    Maghrib: formatTime(prayerTimes.maghrib, offsets.Maghrib),
    Isya: formatTime(prayerTimes.isha, offsets.Isya),
    Syuruq: formatTime(prayerTimes.sunrise, 0)
  };
}

app.get('/api/prayers', (req, res) => {
  const prayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();

  // Get settings to check if auto-calculation is enabled
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  // If auto-calculation is enabled, merge calculated times with stored iqomah durations
  if (settings.prayer_calc_enabled === 'true') {
    const calculated = calculatePrayerTimes(settings);
    const prayerOrder = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

    const mergedPrayers = prayerOrder.map((name, index) => {
      const existing = prayers.find(p => p.name === name) || { id: index + 1, iqomah_duration: 10 };
      return {
        id: existing.id,
        name: name,
        time: calculated[name],
        iqomah_duration: existing.iqomah_duration
      };
    });

    res.json(mergedPrayers);
  } else {
    res.json(prayers);
  }
});

// Calculate prayer times for a specific date (for testing/preview)
app.get('/api/prayers/calculate', (req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  const date = req.query.date ? new Date(req.query.date) : new Date();
  const calculated = calculatePrayerTimes(settings, date);

  res.json({
    date: date.toISOString().split('T')[0],
    method: settings.prayer_calc_method || 'Singapore',
    location: {
      latitude: parseFloat(settings.mosque_latitude) || -6.2088,
      longitude: parseFloat(settings.mosque_longitude) || 106.8456
    },
    times: calculated
  });
});

// Sync calculated times to database (for manual override capability)
app.post('/api/prayers/sync', (req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  if (settings.prayer_calc_enabled !== 'true') {
    return res.status(400).json({ error: 'Auto-calculation is not enabled' });
  }

  const calculated = calculatePrayerTimes(settings);
  const prayerOrder = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

  const updatePrayer = db.prepare('UPDATE prayer_times SET time = ? WHERE name = ?');

  for (const name of prayerOrder) {
    updatePrayer.run(calculated[name], name);
  }

  res.json({ success: true, times: calculated });
});

app.put('/api/prayers/:id', (req, res) => {
  const { time, iqomah_duration } = req.body;
  const existing = db.prepare('SELECT * FROM prayer_times WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Prayer not found' });

  const finalTime = time !== undefined ? time : existing.time;
  const finalIqomah = iqomah_duration !== undefined ? iqomah_duration : existing.iqomah_duration;
  const updatePrayer = db.prepare('UPDATE prayer_times SET time = ?, iqomah_duration = ? WHERE id = ?');
  updatePrayer.run(finalTime, finalIqomah, req.params.id);
  res.json({ success: true });
});

// ---------- HADITHS ----------
app.get('/api/hadiths', (req, res) => {
  const hadiths = db.prepare('SELECT * FROM hadiths ORDER BY created_at DESC').all();
  res.json(hadiths);
});

app.get('/api/hadiths/active', (req, res) => {
  const hadiths = db.prepare('SELECT * FROM hadiths WHERE is_active = 1 ORDER BY created_at DESC').all();
  res.json(hadiths);
});

app.post('/api/hadiths', (req, res) => {
  const { text, source } = req.body;
  const stmt = db.prepare('INSERT INTO hadiths (text, source, is_active) VALUES (?, ?, 1)');
  const result = stmt.run(text, source);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/hadiths/:id', (req, res) => {
  const { text, source, is_active } = req.body;
  const stmt = db.prepare('UPDATE hadiths SET text = ?, source = ?, is_active = ? WHERE id = ?');
  stmt.run(text, source, is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/hadiths/:id', (req, res) => {
  db.prepare('DELETE FROM hadiths WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- DONATIONS ----------
app.get('/api/donations', (req, res) => {
  const donations = db.prepare('SELECT * FROM donations ORDER BY updated_at DESC').all();
  res.json(donations);
});

app.post('/api/donations', (req, res) => {
  const { category, amount, target, description } = req.body;
  const stmt = db.prepare('INSERT INTO donations (category, amount, target, description) VALUES (?, ?, ?, ?)');
  const result = stmt.run(category, amount || 0, target || 0, description || '');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/donations/:id', (req, res) => {
  const { category, amount, target, description } = req.body;
  const stmt = db.prepare('UPDATE donations SET category = ?, amount = ?, target = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(category, amount, target, description, req.params.id);
  res.json({ success: true });
});

app.delete('/api/donations/:id', (req, res) => {
  db.prepare('DELETE FROM donations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- ANNOUNCEMENTS ----------
app.get('/api/announcements', (req, res) => {
  const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
  res.json(announcements);
});

app.get('/api/announcements/published', (req, res) => {
  const announcements = db.prepare("SELECT * FROM announcements WHERE status = 'published' AND (expiry_date IS NULL OR expiry_date > date('now')) ORDER BY priority DESC, created_at DESC").all();
  res.json(announcements);
});

app.post('/api/announcements', (req, res) => {
  const { title, content, priority, status, expiry_date } = req.body;
  const stmt = db.prepare('INSERT INTO announcements (title, content, priority, status, expiry_date) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(title, content, priority || 'normal', status || 'draft', expiry_date || null);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/announcements/:id', (req, res) => {
  const { title, content, priority, status, expiry_date } = req.body;
  const stmt = db.prepare('UPDATE announcements SET title = ?, content = ?, priority = ?, status = ?, expiry_date = ? WHERE id = ?');
  stmt.run(title, content, priority, status, expiry_date, req.params.id);
  res.json({ success: true });
});

app.delete('/api/announcements/:id', (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- RUNNING TEXTS ----------
app.get('/api/running-texts', (req, res) => {
  const texts = db.prepare('SELECT * FROM running_texts ORDER BY priority DESC').all();
  res.json(texts);
});

app.get('/api/running-texts/active', (req, res) => {
  const texts = db.prepare('SELECT * FROM running_texts WHERE is_active = 1 ORDER BY priority DESC').all();
  res.json(texts);
});

app.post('/api/running-texts', (req, res) => {
  const { text, category, priority } = req.body;
  const stmt = db.prepare('INSERT INTO running_texts (text, category, priority, is_active) VALUES (?, ?, ?, 1)');
  const result = stmt.run(text, category || 'info', priority || 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/running-texts/:id', (req, res) => {
  const { text, category, priority, is_active } = req.body;
  const stmt = db.prepare('UPDATE running_texts SET text = ?, category = ?, priority = ?, is_active = ? WHERE id = ?');
  stmt.run(text, category, priority, is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/running-texts/:id', (req, res) => {
  db.prepare('DELETE FROM running_texts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- COMBINED STATE (for display) ----------
app.get('/api/state', (req, res) => {
  const settings = {};
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  const rawPrayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();
  const hadiths = db.prepare('SELECT * FROM hadiths WHERE is_active = 1').all();
  const announcements = db.prepare("SELECT * FROM announcements WHERE status = 'published' AND (expiry_date IS NULL OR expiry_date > date('now'))").all();
  const runningTexts = db.prepare('SELECT * FROM running_texts WHERE is_active = 1 ORDER BY priority DESC').all();
  const donations = db.prepare('SELECT * FROM donations ORDER BY updated_at DESC').all();

  // Apply auto-calculation if enabled (same logic as /api/prayers)
  let prayers = rawPrayers;
  if (settings.prayer_calc_enabled === 'true') {
    const calculated = calculatePrayerTimes(settings);
    const prayerOrder = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    prayers = prayerOrder.map((name, index) => {
      const existing = rawPrayers.find(p => p.name === name) || { id: index + 1, iqomah_duration: 10 };
      return {
        id: existing.id,
        name: name,
        time: calculated[name],
        iqomah_duration: existing.iqomah_duration
      };
    });
  }

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

// ---------- PAGES ----------
app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Masjid Display running on http://localhost:${PORT}`);
  console.log(`Display: http://localhost:${PORT}/display`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
