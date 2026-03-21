const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

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
  hadith_rotation_interval: 30,
  show_live_indicator: 'true',
  marquee_loop: 'true',
  marquee_speed: 30,
  marquee_gap: 4
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
  { text: 'Barangsiapa yang menghidupkan bulan Ramadhan dengan iman dan mengharap pahala, maka diampunilah dosa-dosanya yang telah lalu.', source: 'HR. Bukhari & Muslim' },
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

// ---------- PRAYER TIMES ----------
app.get('/api/prayers', (req, res) => {
  const prayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();
  res.json(prayers);
});

app.put('/api/prayers/:id', (req, res) => {
  const { time, iqomah_duration } = req.body;
  const updatePrayer = db.prepare('UPDATE prayer_times SET time = ?, iqomah_duration = ? WHERE id = ?');
  updatePrayer.run(time, iqomah_duration, req.params.id);
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

  const prayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();
  const hadiths = db.prepare('SELECT * FROM hadiths WHERE is_active = 1').all();
  const announcements = db.prepare("SELECT * FROM announcements WHERE status = 'published' AND (expiry_date IS NULL OR expiry_date > date('now'))").all();
  const runningTexts = db.prepare('SELECT * FROM running_texts WHERE is_active = 1 ORDER BY priority DESC').all();

  res.json({
    settings,
    prayers,
    hadiths,
    announcements,
    runningTexts,
    serverTime: new Date().toISOString()
  });
});

// ---------- PAGES ----------
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
