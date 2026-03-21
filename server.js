const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
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
`);

// Initialize default settings
const defaultSettings = {
  mosque_name: 'Masjid Al-Ikhlas',
  running_text: 'Selamat datang di Masjid Al-Ikhlas',
  background_image: ''
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

// API Routes

// Get all settings
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

// Update settings
app.post('/api/settings', (req, res) => {
  const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(req.body)) {
    updateSetting.run(key, value);
  }
  res.json({ success: true });
});

// Get all prayer times
app.get('/api/prayers', (req, res) => {
  const prayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();
  res.json(prayers);
});

// Update prayer time
app.put('/api/prayers/:id', (req, res) => {
  const { time, iqomah_duration } = req.body;
  const updatePrayer = db.prepare('UPDATE prayer_times SET time = ?, iqomah_duration = ? WHERE id = ?');
  updatePrayer.run(time, iqomah_duration, req.params.id);
  res.json({ success: true });
});

// Get current state (for display)
app.get('/api/state', (req, res) => {
  const settings = {};
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  const prayers = db.prepare('SELECT * FROM prayer_times ORDER BY id').all();

  res.json({
    settings,
    prayers,
    serverTime: new Date().toISOString()
  });
});

// Serve display page
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Masjid Display running on http://localhost:${PORT}`);
  console.log(`Display: http://localhost:${PORT}/display`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
