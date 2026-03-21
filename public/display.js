/**
 * ============================================
 * MASJID DISPLAY - JavaScript Controller
 * Modern Minimalist Theme
 * ============================================
 */

// ==================== STATE MANAGEMENT ====================
const AppState = {
  IDLE: 'IDLE',
  WAITING_ADZAN: 'WAITING_ADZAN',
  ADZAN: 'ADZAN',
  IQOMAH: 'IQOMAH',
  PRAYER: 'PRAYER',
  FINISHED: 'FINISHED'
};

let currentState = AppState.IDLE;
let prayerTimes = [];
let settings = {};
let countdownInterval = null;
let iqomahInterval = null;
let hadithInterval = null;
let currentPrayerIndex = -1;
let nextPrayerIndex = -1;
let currentHadithIndex = 0;

// ==================== HADITH COLLECTION ====================
const hadiths = [
  {
    text: "Barangsiapa yang menghidupkan bulan Ramadhan dengan iman dan mengharap pahala, maka diampunilah dosa-dosanya yang telah lalu.",
    source: "HR. Bukhari & Muslim"
  },
  {
    text: "Sholat berjamaah lebih utama 27 derajat dibanding sholat sendirian.",
    source: "HR. Bukhari"
  },
  {
    text: "Barangsiapa menjaga sholat, maka ia akan mendapatkan cahaya, hujjah, dan keselamatan pada hari kiamat.",
    source: "HR. Ahmad"
  },
  {
    text: "Sesungguhnya Allah tidak mengubah keadaan suatu kaum sehingga mereka mengubah keadaan yang ada pada diri mereka sendiri.",
    source: "QS. Ar-Ra'd: 11"
  },
  {
    text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.",
    source: "HR. Thabrani"
  },
  {
    text: "Sedekah itu dapat menghapus dosa sebagaimana air memadamkan api.",
    source: "HR. Tirmidzi"
  },
  {
    text: "Orang mukmin yang paling sempurna imannya adalah yang paling baik akhlaknya.",
    source: "HR. Abu Dawud"
  },
  {
    text: "Sesungguhnya amal itu tergantung niatnya, dan setiap orang hanya mendapatkan sesuai niatnya.",
    source: "HR. Bukhari & Muslim"
  }
];

// Prayer icons mapping
const prayerIcons = {
  'Subuh': '🌅',
  'Dzuhur': '☀️',
  'Ashar': '🌤️',
  'Maghrib': '🌅',
  'Isya': '🌙'
};

// Indonesian day and month names
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Hijri month names
const hijriMonths = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban', 'Ramadhan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeDisplay();
});

function initializeDisplay() {
  // Start clock update
  updateClock();
  setInterval(updateClock, 1000);

  // Fetch initial data
  fetchData();

  // Set up intervals
  setInterval(fetchData, 5000);      // Poll data every 5 seconds
  setInterval(checkPrayerState, 1000); // Check state every second

  // Start hadith rotation
  rotateHadith();
  setInterval(rotateHadith, 30000);   // Rotate hadith every 30 seconds
}

// ==================== CLOCK & DATE FUNCTIONS ====================
function updateClock() {
  const now = new Date();

  // Update time display
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('current-time').textContent = `${hours}:${minutes}`;
  document.getElementById('current-seconds').textContent = `:${seconds}`;

  // Update date displays
  updateDateDisplay(now);
}

function updateDateDisplay(date) {
  // Masehi date
  const dayName = days[date.getDay()];
  const dateStr = `${dayName}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  document.getElementById('date-masehi').textContent = dateStr;

  // Hijri date (approximate calculation)
  const hijriDate = calculateHijriDate(date);
  document.getElementById('date-hijri').textContent = `${hijriDate.day} ${hijriMonths[hijriDate.month]} ${hijriDate.year} H`;
}

/**
 * Approximate Hijri Date Calculation
 * Note: For accurate dates, use an API or library
 */
function calculateHijriDate(gregorianDate) {
  // Julian Day Number calculation
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();

  let jd;
  if (month <= 2) {
    const y = year - 1;
    const m = month + 12;
    jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day - 1524.5;
  } else {
    jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  }

  // Gregorian to Julian correction
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  jd = jd + b;

  // Julian to Hijri
  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  return {
    year: hijriYear,
    month: hijriMonth - 1, // 0-indexed
    day: hijriDay
  };
}

// ==================== DATA FETCHING ====================
async function fetchData() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();

    settings = data.settings || {};
    prayerTimes = data.prayers || [];

    updateDisplayElements();
    renderPrayerGrid();
    checkPrayerState();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// ==================== DISPLAY UPDATES ====================
function updateDisplayElements() {
  // Update mosque name
  const mosqueName = settings.mosque_name || 'Masjid Al-Muhajirin';
  document.getElementById('mosque-name').textContent = mosqueName;
  document.title = `Display - ${mosqueName}`;

  // Update running text / custom marquee
  const customMarquee = document.getElementById('custom-marquee');
  if (customMarquee && settings.running_text) {
    customMarquee.innerHTML = `<span class="marquee-tag tag-info">INFO</span>${settings.running_text}`;
  }

  // Update background image
  const bgOverlay = document.getElementById('bg-overlay');
  if (bgOverlay) {
    if (settings.background_image) {
      bgOverlay.style.backgroundImage = `url(${settings.background_image})`;
      bgOverlay.classList.add('active');
    } else {
      bgOverlay.classList.remove('active');
    }
  }
}

// ==================== PRAYER GRID RENDERING ====================
function renderPrayerGrid() {
  const prayerGrid = document.getElementById('prayer-grid');
  if (!prayerGrid || prayerTimes.length === 0) return;

  prayerGrid.innerHTML = prayerTimes.map((prayer, index) => `
    <div class="prayer-card ${index === nextPrayerIndex ? 'active' : ''}" data-index="${index}">
      <div class="icon">${prayerIcons[prayer.name] || '🕌'}</div>
      <div class="name">${prayer.name}</div>
      <div class="time">${prayer.time}</div>
      <div class="iqomah">Iqomah: ${prayer.iqomah_duration} menit</div>
    </div>
  `).join('');
}

function updatePrayerHighlight(index) {
  const cards = document.querySelectorAll('.prayer-card');
  cards.forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });
}

// ==================== HADITH ROTATION ====================
function rotateHadith() {
  const hadith = hadiths[currentHadithIndex];

  const textEl = document.getElementById('info-text');
  const sourceEl = document.getElementById('info-source');

  if (textEl && sourceEl) {
    // Fade out
    textEl.style.opacity = 0;
    sourceEl.style.opacity = 0;

    setTimeout(() => {
      textEl.textContent = `"${hadith.text}"`;
      sourceEl.textContent = `— ${hadith.source}`;
      textEl.style.opacity = 1;
      sourceEl.style.opacity = 1;
    }, 300);
  }

  currentHadithIndex = (currentHadithIndex + 1) % hadiths.length;
}

// ==================== PRAYER STATE MANAGEMENT ====================
function checkPrayerState() {
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  let foundState = false;

  for (let i = 0; i < prayerTimes.length; i++) {
    const prayer = prayerTimes[i];
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTimeMinutes = hours * 60 + minutes;
    const iqomahEndMinutes = prayerTimeMinutes + prayer.iqomah_duration;
    const prayerEndMinutes = iqomahEndMinutes + 15; // Assume 15 min prayer

    // Check if currently in prayer
    if (currentTimeMinutes >= iqomahEndMinutes && currentTimeMinutes < prayerEndMinutes) {
      setPrayerInProgress(prayer.name);
      foundState = true;
      break;
    }

    // Check if in iqomah countdown
    if (currentTimeMinutes >= prayerTimeMinutes && currentTimeMinutes < iqomahEndMinutes) {
      setIqomahCountdown(iqomahEndMinutes - currentTimeMinutes, prayer);
      foundState = true;
      break;
    }

    // Check if at adzan time (first minute)
    if (currentTimeMinutes === prayerTimeMinutes && currentSeconds < 60) {
      setAdzanState(prayer);
      foundState = true;
      break;
    }
  }

  // Default: show countdown to next prayer
  if (!foundState) {
    const nextIdx = getNextPrayerIndex();
    if (currentState !== AppState.WAITING_ADZAN || nextPrayerIndex !== nextIdx) {
      setCountdownToNextPrayer(nextIdx);
    }
  }
}

function getNextPrayerIndex() {
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < prayerTimes.length; i++) {
    const [hours, minutes] = prayerTimes[i].time.split(':').map(Number);
    const prayerTimeMinutes = hours * 60 + minutes;

    if (prayerTimeMinutes > currentTimeMinutes) {
      return i;
    }
  }

  return 0; // Next day's first prayer
}

// ==================== STATE TRANSITIONS ====================
function setCountdownToNextPrayer(prayerIndex) {
  nextPrayerIndex = prayerIndex;
  currentPrayerIndex = -1;
  currentState = AppState.WAITING_ADZAN;

  // Hide other sections
  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'none';
  document.getElementById('countdown-pill').style.display = 'flex';
  document.body.classList.remove('calm-mode');

  const prayer = prayerTimes[prayerIndex];

  // Clear existing interval
  if (countdownInterval) clearInterval(countdownInterval);

  function updateCountdown() {
    const now = new Date();
    const [hours, minutes] = prayer.time.split(':').map(Number);

    let prayerDate = new Date(now);
    prayerDate.setHours(hours, minutes, 0, 0);

    // If passed, calculate for next day
    if (prayerDate <= now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }

    const diff = prayerDate - now;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      checkPrayerState();
      return;
    }

    document.getElementById('countdown-label').textContent = `Menuju Adzan ${prayer.name}`;
    document.getElementById('countdown-time').textContent = formatCountdown(diff);
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
  updatePrayerHighlight(prayerIndex);
}

function setAdzanState(prayer) {
  currentState = AppState.ADZAN;
  currentPrayerIndex = prayerTimes.indexOf(prayer);
  nextPrayerIndex = currentPrayerIndex;

  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'none';
  document.getElementById('countdown-pill').style.display = 'flex';

  document.getElementById('countdown-label').textContent = `WAKTU ADZAN ${prayer.name.toUpperCase()}`;
  document.getElementById('countdown-time').textContent = prayer.time;

  updatePrayerHighlight(currentPrayerIndex);
  playBeep();
}

function setIqomahCountdown(remainingMinutes, prayer) {
  currentState = AppState.IQOMAH;
  currentPrayerIndex = prayerTimes.indexOf(prayer);
  nextPrayerIndex = currentPrayerIndex;

  document.getElementById('countdown-pill').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'none';
  document.getElementById('iqomah-section').style.display = 'block';
  document.body.classList.remove('calm-mode');

  const now = new Date();
  const [hours, minutes] = prayer.time.split(':').map(Number);

  const iqomahEnd = new Date(now);
  iqomahEnd.setHours(hours, minutes + prayer.iqomah_duration, 0, 0);

  updatePrayerHighlight(currentPrayerIndex);
  updateIqomahDisplay(iqomahEnd);
  playBeep();
}

function updateIqomahDisplay(endTime) {
  if (iqomahInterval) clearInterval(iqomahInterval);

  iqomahInterval = setInterval(() => {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(iqomahInterval);
      document.getElementById('iqomah-section').style.display = 'none';
      checkPrayerState();
      return;
    }

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    document.getElementById('iqomah-time').textContent =
      `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Play beep in last 10 seconds
    if (diff <= 10000 && diff > 9900) {
      playBeep();
    }
  }, 100);
}

function setPrayerInProgress(prayerName) {
  currentState = AppState.PRAYER;

  document.getElementById('countdown-pill').style.display = 'none';
  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'block';
  document.body.classList.add('calm-mode');

  document.getElementById('current-prayer-name').textContent = prayerName.toUpperCase();
}

// ==================== UTILITY FUNCTIONS ====================
function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not available');
  }
}
