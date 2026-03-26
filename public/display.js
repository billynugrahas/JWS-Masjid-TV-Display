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
let hadiths = [];
let runningTexts = [];
let announcements = [];
let donations = [];
let countdownInterval = null;
let iqomahInterval = null;
let hadithInterval = null;
let donationInterval = null;
let announcementInterval = null;
let currentPrayerIndex = -1;
let nextPrayerIndex = -1;
let currentHadithIndex = 0;
let currentDonationPage = 0;
let currentAnnouncementPage = 0;

const DONATIONS_PER_PAGE = 6;
const ANNOUNCEMENTS_PER_PAGE = 3;

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

// Time formatting function
function formatTime(timeStr) {
  if (!timeStr) return '';

  // If setting is 24h or not set, return as-is
  if (settings.time_format !== '12h') {
    return timeStr;
  }

  // Convert to 12-hour format
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Default hadiths (fallback if API returns empty)
const defaultHadiths = [
  { text: "Barangsiapa yang menghidupkan bulan Ramadhan dengan iman dan mengharap pahala, maka diampunilah dosa-dosanya yang telah lalu.", source: "HR. Bukhari & Muslim" },
  { text: "Sholat berjamaah lebih utama 27 derajat dibanding sholat sendirian.", source: "HR. Bukhari" },
  { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.", source: "HR. Thabrani" }
];

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
let previousAnnouncements = [];
let previousDonations = [];
let previousRunningTexts = [];

async function fetchData() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();

    const newSettings = data.settings || {};
    const newPrayerTimes = data.prayers || [];
    const newHadiths = data.hadiths && data.hadiths.length > 0 ? data.hadiths : defaultHadiths;
    const newRunningTexts = data.runningTexts || [];
    const newAnnouncements = data.announcements || [];
    const newDonations = data.donations || [];

    // Check if announcements changed
    const announcementsChanged = JSON.stringify(newAnnouncements) !== JSON.stringify(previousAnnouncements);

    // Check if donations changed
    const donationsChanged = JSON.stringify(newDonations) !== JSON.stringify(previousDonations);

    // Check if settings changed
    const settingsChanged = JSON.stringify(newSettings) !== JSON.stringify(settings);

    // Update state
    settings = newSettings;
    prayerTimes = newPrayerTimes;
    hadiths = newHadiths;
    runningTexts = newRunningTexts;
    announcements = newAnnouncements;
    donations = newDonations;

    // Store previous values for comparison
    previousAnnouncements = [...newAnnouncements];
    previousDonations = [...newDonations];
    previousRunningTexts = [...newRunningTexts];

    // Only re-render if data changed
    if (settingsChanged) {
      updateDisplayElements();
    }

    renderPrayerGrid();
    renderOptionalTimes();

    if (settingsChanged || JSON.stringify(runningTexts) !== JSON.stringify(previousRunningTexts)) {
      renderMarquee();
    }

    // Only re-render announcements if data changed
    if (announcementsChanged || settingsChanged) {
      currentAnnouncementPage = 0; // Reset to first page
      renderAnnouncementsList();
      startAnnouncementRotation();
    }

    // Only re-render donations if data changed
    if (donationsChanged || settingsChanged) {
      currentDonationPage = 0; // Reset to first page
      renderDonationsList();
      startDonationRotation();
    }

    startHadithRotation();
    checkPrayerState();
  } catch (error) {
    console.error('Error fetching data:', error);
    // Use defaults on error
    hadiths = defaultHadiths;
  }
}

// ==================== DISPLAY UPDATES ====================
function updateDisplayElements() {
  // Update mosque name
  const mosqueName = settings.mosque_name || 'Masjid Al-Muhajirin';
  document.getElementById('mosque-name').textContent = mosqueName;
  document.title = `Display - ${mosqueName}`;

  // Update mosque logo (image or emoji)
  const logoImg = document.getElementById('mosque-logo-img');
  const logoEmoji = document.getElementById('mosque-logo-emoji');

  if (settings.mosque_logo_image) {
    // Use image if available
    if (logoImg) {
      logoImg.src = settings.mosque_logo_image;
      logoImg.style.display = 'block';
    }
    if (logoEmoji) {
      logoEmoji.style.display = 'none';
    }
  } else {
    // Fallback to emoji
    if (logoImg) {
      logoImg.style.display = 'none';
    }
    if (logoEmoji) {
      logoEmoji.textContent = settings.mosque_logo || '🕌';
      logoEmoji.style.display = 'block';
    }
  }

  // Update mosque tagline (optional)
  const mosqueTagline = document.getElementById('mosque-tagline');
  if (mosqueTagline) {
    if (settings.mosque_tagline && settings.mosque_tagline.trim() !== '') {
      mosqueTagline.textContent = settings.mosque_tagline;
      mosqueTagline.style.display = '';
    } else {
      mosqueTagline.style.display = 'none';
    }
  }

  // Update mosque address (optional)
  const mosqueAddress = document.getElementById('mosque-address');
  if (mosqueAddress) {
    if (settings.mosque_address && settings.mosque_address.trim() !== '') {
      mosqueAddress.textContent = settings.mosque_address;
      mosqueAddress.style.display = '';
    } else {
      mosqueAddress.style.display = 'none';
    }
  }

  // Update mosque phone (optional)
  const mosquePhone = document.getElementById('mosque-phone');
  if (mosquePhone) {
    if (settings.mosque_phone && settings.mosque_phone.trim() !== '') {
      mosquePhone.textContent = settings.mosque_phone;
      mosquePhone.style.display = '';
    } else {
      mosquePhone.style.display = 'none';
    }
  }

  // Update live indicator visibility
  // Shows only when: manual toggle is ON AND Ka'bah video is active
  const liveIndicator = document.querySelector('.live-indicator');
  if (liveIndicator) {
    const toggleEnabled = settings.show_live_indicator === 'true';
    const videoActive = settings.kabah_video_enabled === 'true' && settings.kabah_video_url && settings.kabah_video_url.trim() !== '';
    liveIndicator.style.display = (toggleEnabled && videoActive) ? 'flex' : 'none';
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

  // Update background overlay opacity
  const bgOverlayAfter = document.getElementById('bg-overlay');
  if (bgOverlayAfter) {
    const opacity = parseFloat(settings.background_opacity) || 0.15;
    bgOverlayAfter.style.setProperty('--bg-overlay-opacity', opacity);
  }

  // Update prayer subtext
  const prayerSubtext = document.getElementById('prayer-subtext');
  if (prayerSubtext) {
    prayerSubtext.textContent = settings.prayer_subtext || 'Luruskan dan Rapatkan Shaf';
  }

  // Update prayer subtext 2 (optional)
  const prayerSubtext2 = document.getElementById('prayer-subtext-2');
  if (prayerSubtext2) {
    prayerSubtext2.textContent = settings.prayer_subtext_2 || '';
  }

  // Update info block section visibility
  const infoBlockSection = document.getElementById('info-block-section');
  const announcementsEnabled = settings.announcements_enabled !== 'false';
  const donationsEnabled = settings.donations_enabled !== 'false';

  if (infoBlockSection) {
    // Hide entire section if both are disabled
    infoBlockSection.style.display = (announcementsEnabled || donationsEnabled) ? 'block' : 'none';
  }

  // Update donation QR code visibility
  const donationQRSection = document.getElementById('donation-qr-section');
  const donationQRImage = document.getElementById('donation-qr-image');
  const donationsWrapper = document.getElementById('donations-wrapper');
  const qrEnabled = settings.donation_qr_enabled === 'true';

  if (donationQRSection && donationQRImage && donationsWrapper) {
    if (qrEnabled && settings.donation_qr_image) {
      donationQRImage.src = settings.donation_qr_image;
      donationQRSection.style.display = 'flex';
      donationsWrapper.classList.add('has-qr');
    } else {
      donationQRSection.style.display = 'none';
      donationsWrapper.classList.remove('has-qr');
    }
  }

  // Update Ka'bah video display
  updateKabahVideoDisplay();

  // Update font scale
  const fontScale = parseFloat(settings.font_scale) || 1;
  document.documentElement.style.setProperty('--font-scale', fontScale);
}

// ==================== PRAYER GRID RENDERING ====================
function renderPrayerGrid() {
  const prayerGrid = document.getElementById('prayer-grid');
  if (!prayerGrid || prayerTimes.length === 0) return;

  prayerGrid.innerHTML = prayerTimes.map((prayer, index) => `
    <div class="prayer-card ${index === nextPrayerIndex ? 'active' : ''}" data-index="${index}">
      <div class="icon">${prayerIcons[prayer.name] || '🕌'}</div>
      <div class="name">${prayer.name}</div>
      <div class="time">${formatTime(prayer.time)}</div>
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

// ==================== OPTIONAL TIMES RENDERING ====================
function renderOptionalTimes() {
  const section = document.getElementById('optional-times-section');
  const grid = document.getElementById('optional-times-grid');
  if (!section || !grid) return;

  const items = [];

  // Get Subuh time for calculation
  const subuhPrayer = prayerTimes.find(p => p.name.toLowerCase() === 'subuh');
  if (!subuhPrayer) return;

  const [subuhHours, subuhMinutes] = subuhPrayer.time.split(':').map(Number);
  const subuhTotalMinutes = subuhHours * 60 + subuhMinutes;

  // Imsak - X minutes before Subuh
  if (settings.imsak_enabled === 'true') {
    const imsakOffset = parseInt(settings.imsak_offset) || 10;
    const imsakTotalMinutes = subuhTotalMinutes - imsakOffset;
    const imsakHours = Math.floor(imsakTotalMinutes / 60) % 24;
    const imsakMinutes = imsakTotalMinutes % 60;
    const imsakTime = `${String(imsakHours).padStart(2, '0')}:${String(imsakMinutes).padStart(2, '0')}`;

    items.push({
      icon: '🌙',
      name: settings.imsak_label || 'Imsak',
      time: imsakTime
    });
  }

  // Syuruq - Y minutes after Subuh
  if (settings.syuruq_enabled === 'true') {
    const syuruqOffset = parseInt(settings.syuruq_offset) || 20;
    const syuruqTotalMinutes = subuhTotalMinutes + syuruqOffset;
    const syuruqHours = Math.floor(syuruqTotalMinutes / 60) % 24;
    const syuruqMinutes = syuruqTotalMinutes % 60;
    const syuruqTime = `${String(syuruqHours).padStart(2, '0')}:${String(syuruqMinutes).padStart(2, '0')}`;

    items.push({
      icon: '🌅',
      name: settings.syuruq_label || 'Syuruq',
      time: syuruqTime
    });
  }

  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = items.map(item => `
    <div class="optional-time-card">
      <div class="icon">${item.icon}</div>
      <div class="name">${item.name}</div>
      <div class="time">${formatTime(item.time)}</div>
    </div>
  `).join('');
}

// ==================== HADITH ROTATION ====================
function startHadithRotation() {
  // Clear existing interval
  if (hadithInterval) {
    clearInterval(hadithInterval);
  }

  // Only rotate if we have hadiths
  if (hadiths.length === 0) return;

  // Get rotation interval from settings (default 30 seconds)
  const interval = (parseInt(settings.hadith_rotation_interval) || 30) * 1000;

  // Initial rotation
  rotateHadith();

  // Set up rotation interval
  hadithInterval = setInterval(rotateHadith, interval);
}

function rotateHadith() {
  if (hadiths.length === 0) return;

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

// ==================== MARQUEE RENDERING ====================
// Category label mapping (English to Indonesian)
const categoryLabels = {
  'info': 'INFO',
  'donation': 'DONASI',
  'announcement': 'PENGUMUMAN'
};

function renderMarquee() {
  const marqueeEl = document.getElementById('marquee');
  if (!marqueeEl) return;

  // Get marquee settings with defaults
  const loop = settings.marquee_loop !== 'false'; // Default true (seamless loop)
  const speed = parseInt(settings.marquee_speed) || 30; // Default 30 seconds
  const gap = parseFloat(settings.marquee_gap) || 4; // Default 4rem

  // Apply CSS variables for marquee configuration
  marqueeEl.style.setProperty('--marquee-gap', `${gap}rem`);
  marqueeEl.style.gap = `${gap}rem`;

  // If we have dynamic running texts, use them
  if (runningTexts.length > 0) {
    const items = runningTexts.map(rt => {
      const category = rt.category || 'info';
      const categoryClass = `tag-${category}`;
      const categoryLabel = categoryLabels[category] || 'INFO';
      return `
        <span class="marquee-item">
          <span class="marquee-tag ${categoryClass}">${categoryLabel}</span>
          ${rt.text}
        </span>
        <span class="marquee-separator">•</span>
      `;
    }).join('');

    if (loop) {
      // Seamless loop: duplicate items (2 copies total)
      // Animation translates -50% so when it reaches the end of first set,
      // the second set is exactly where the first set started
      marqueeEl.innerHTML = items + items;
      marqueeEl.style.animationName = 'marquee-seamless';
      marqueeEl.style.animationDuration = `${speed}s`;
      marqueeEl.style.animationIterationCount = 'infinite';
    } else {
      // Non-seamless: single items, wait for exit then restart
      marqueeEl.innerHTML = items;
      marqueeEl.style.animationName = 'marquee';
      marqueeEl.style.animationDuration = `${speed}s`;
      marqueeEl.style.animationIterationCount = 'infinite';
    }
  } else {
    // Fallback to default marquee
    const defaultText = settings.running_text || 'Selamat datang di Masjid';
    marqueeEl.innerHTML = `
      <span class="marquee-item">
        <span class="marquee-tag tag-info">INFO</span>
        ${defaultText}
      </span>
    `;
  }
}

// ==================== PRAYER STATE MANAGEMENT ====================
function checkPrayerState() {
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  // Get prayer duration from settings (default 15 minutes)
  const prayerDuration = parseInt(settings.prayer_duration) || 15;

  let foundState = false;

  for (let i = 0; i < prayerTimes.length; i++) {
    const prayer = prayerTimes[i];
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTimeMinutes = hours * 60 + minutes;
    const iqomahEndMinutes = prayerTimeMinutes + prayer.iqomah_duration;
    const prayerEndMinutes = iqomahEndMinutes + prayerDuration;

    // Check if currently in prayer
    if (currentTimeMinutes >= iqomahEndMinutes && currentTimeMinutes < prayerEndMinutes) {
      // Only transition to prayer state if not already in it
      if (currentState !== AppState.PRAYER) {
        setPrayerInProgress(prayer.name);
      }
      foundState = true;
      break;
    }

    // Check if in iqomah countdown
    if (currentTimeMinutes >= prayerTimeMinutes && currentTimeMinutes < iqomahEndMinutes) {
      // Only transition to iqomah state if not already in it
      if (currentState !== AppState.IQOMAH) {
        setIqomahCountdown(iqomahEndMinutes - currentTimeMinutes, prayer);
      }
      foundState = true;
      break;
    }

    // Check if at adzan time (first minute)
    if (currentTimeMinutes === prayerTimeMinutes && currentSeconds < 60) {
      // Only transition to adzan state if not already in it
      if (currentState !== AppState.ADZAN) {
        setAdzanState(prayer);
      }
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
  document.body.classList.remove('adhan-mode');

  const prayer = prayerTimes[prayerIndex];

  // Clear existing interval
  if (countdownInterval) clearInterval(countdownInterval);

  // Track the last second we beeped for to prevent multiple beeps per second
  let lastBeepedSecond = -1;

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

    // Play beep in last X seconds (same setting as iqomah)
    const beepSeconds = parseInt(settings.iqomah_beep_seconds) || 3;
    const totalSecondsRemaining = Math.ceil(diff / 1000);

    // Only beep when we're in the last X seconds, and only once per second
    if (beepSeconds > 0 && totalSecondsRemaining <= beepSeconds && totalSecondsRemaining !== lastBeepedSecond) {
      lastBeepedSecond = totalSecondsRemaining;
      playBeep();
    }
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
  document.body.classList.add('adhan-mode');
  document.body.classList.remove('calm-mode');

  document.getElementById('countdown-label').textContent = `WAKTU ADZAN ${prayer.name.toUpperCase()}`;
  document.getElementById('countdown-time').textContent = formatTime(prayer.time);

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
  document.body.classList.remove('adhan-mode');
  document.body.classList.remove('calm-mode');

  const now = new Date();
  const [hours, minutes] = prayer.time.split(':').map(Number);

  const iqomahEnd = new Date(now);
  iqomahEnd.setHours(hours, minutes + prayer.iqomah_duration, 0, 0);

  updatePrayerHighlight(currentPrayerIndex);
  updateIqomahDisplay(iqomahEnd);

  // Play long beep to indicate entering iqomah (same as prayer state transition)
  playTone(660, 1.5, 0.4);
}

function setPrayerInProgress(prayerName) {
  currentState = AppState.PRAYER;

  document.getElementById('countdown-pill').style.display = 'none';
  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress').style.display = 'block';
  document.body.classList.add('calm-mode');

  document.getElementById('current-prayer-name').textContent = prayerName.toUpperCase();

  // Play countdown-ended beep (different from regular beep)
  playCountdownEndBeep();
}

function updateIqomahDisplay(endTime) {
  if (iqomahInterval) clearInterval(iqomahInterval);

  // Track the last second we beeped for to prevent multiple beeps per second
  let lastBeepedSecond = -1;

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

    // Play beep in last X seconds (configurable, default 3)
    const beepSeconds = parseInt(settings.iqomah_beep_seconds) || 3;
    const totalSecondsRemaining = Math.ceil(diff / 1000);

    // Only beep when we're in the last X seconds, and only once per second
    if (beepSeconds > 0 && totalSecondsRemaining <= beepSeconds && totalSecondsRemaining !== lastBeepedSecond) {
      lastBeepedSecond = totalSecondsRemaining;
      playBeep();
    }
  }, 100);
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function renderAnnouncementsList() {
  const container = document.getElementById('announcements-list');
  const card = document.querySelector('.card-announcements');

  if (!container) return;

  // Check if announcements are enabled (default: true)
  const isEnabled = settings.announcements_enabled !== 'false';

  if (!isEnabled) {
    if (card) card.style.display = 'none';
    return;
  }

  // Reset display to CSS default
  if (card) card.style.display = '';

  if (announcements.length === 0) {
    container.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.8rem;">Tidak ada pengumuman</span>';
    return;
  }

  // Get limit from settings (default: 3)
  const perPage = parseInt(settings.announcements_limit) || ANNOUNCEMENTS_PER_PAGE;

  // Calculate which announcements to show based on current page
  const startIndex = currentAnnouncementPage * perPage;
  const endIndex = startIndex + perPage;
  const visibleAnnouncements = announcements.slice(startIndex, endIndex);

  const html = visibleAnnouncements.map(a => {
    const hasContent = a.content && a.content.trim() !== '';
    return `
      <div class="announcement-item">
        <div class="announcement-title">${a.title}</div>
        ${hasContent ? `<div class="announcement-content">${a.content}</div>` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function startAnnouncementRotation() {
  // Clear existing interval
  if (announcementInterval) {
    clearInterval(announcementInterval);
  }

  // Get limit from settings
  const perPage = parseInt(settings.announcements_limit) || ANNOUNCEMENTS_PER_PAGE;

  // Only rotate if we have more announcements than can fit on one page
  if (announcements.length <= perPage) {
    currentAnnouncementPage = 0;
    return;
  }

  // Calculate total pages
  const totalPages = Math.ceil(announcements.length / perPage);

  // Get rotation interval from settings (default: 10 seconds)
  const rotationInterval = (parseInt(settings.announcements_rotation) || 10) * 1000;

  // Rotate
  announcementInterval = setInterval(() => {
    currentAnnouncementPage = (currentAnnouncementPage + 1) % totalPages;
    renderAnnouncementsList();
  }, rotationInterval);
}

function renderDonationsList() {
  const container = document.getElementById('donations-list');
  const card = document.querySelector('.card-donations');
  if (!container) return;

  // Check if donations are enabled (default: true)
  const isEnabled = settings.donations_enabled !== 'false';

  if (!isEnabled) {
    if (card) card.style.display = 'none';
    return;
  }

  // Reset display to CSS default
  if (card) card.style.display = '';

  if (donations.length === 0) {
    container.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.8rem;">Tidak ada data donasi</span>';
    return;
  }

  // Get limit from settings (default: 6)
  let perPage = parseInt(settings.donations_limit) || DONATIONS_PER_PAGE;

  // If QR is enabled, show only half the items (single column layout)
  const qrEnabled = settings.donation_qr_enabled === 'true' && settings.donation_qr_image;
  if (qrEnabled) {
    perPage = Math.ceil(perPage / 2);
  }

  // Calculate which donations to show based on current page
  const startIndex = currentDonationPage * perPage;
  const endIndex = startIndex + perPage;
  const visibleDonations = donations.slice(startIndex, endIndex);

  container.innerHTML = visibleDonations.map(d => {
    const progress = d.target > 0 ? Math.min((d.amount / d.target) * 100, 100) : 0;
    return `
      <div class="donation-item">
        <span class="donation-category">${d.category}:</span>
        <div class="donation-value-row">
          <span class="donation-amount">${formatCurrency(d.amount)}</span>
          ${d.target > 0 ? `
            <div class="donation-progress-bar">
              <div class="donation-progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="donation-percent">${progress.toFixed(0)}%</span>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function startDonationRotation() {
  // Clear existing interval
  if (donationInterval) {
    clearInterval(donationInterval);
  }

  // Get limit from settings
  let perPage = parseInt(settings.donations_limit) || DONATIONS_PER_PAGE;

  // If QR is enabled, show only half the items (single column layout)
  const qrEnabled = settings.donation_qr_enabled === 'true' && settings.donation_qr_image;
  if (qrEnabled) {
    perPage = Math.ceil(perPage / 2);
  }

  // Only rotate if we have more donations than can fit on one page
  if (donations.length <= perPage) {
    currentDonationPage = 0;
    return;
  }

  // Calculate total pages
  const totalPages = Math.ceil(donations.length / perPage);

  // Get rotation interval from settings (default: 10 seconds)
  const rotationInterval = (parseInt(settings.donations_rotation) || 10) * 1000;

  // Rotate
  donationInterval = setInterval(() => {
    currentDonationPage = (currentDonationPage + 1) % totalPages;
    renderDonationsList();
  }, rotationInterval);
}



// ==================== SOUND FUNCTIONS ====================
let audioContext = null;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Always try to resume (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
}

// Helper to play a single beep tone
function playTone(frequency, duration, volume) {
  if (!audioContext) {
    initAudioContext();
  }

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Silent fail
  }
}

function playBeep() {
  if (!audioContext) {
    initAudioContext();
  }
  playTone(800, 0.2, 0.3);
}

// Special beep pattern for countdown ended (Iqomah -> Prayer transition)
// Pattern: 3 short beeps, then 1 long beep
function playCountdownEndBeep() {
  if (!audioContext) {
    initAudioContext();
  }

  // 3 short beeps at 0ms, 500ms, 1000ms
  [0, 500, 1000].forEach(delay => {
    setTimeout(() => playTone(880, 0.15, 0.3), delay);
  });

  // 1 long beep at 1500ms
  setTimeout(() => playTone(660, 1.0, 0.4), 1500);
}

// Enable audio on first user interaction (click/touch)
document.addEventListener('click', initAudioContext, { once: true });
document.addEventListener('touchstart', initAudioContext, { once: true });

// ==================== KA'bah Video Functions ====================

function updateKabahVideoDisplay() {
  const videoContainer = document.getElementById('video-container');
  const videoPlaceholder = document.getElementById('video-placeholder');

  if (!videoContainer || !videoPlaceholder) return;

  const isEnabled = settings.kabah_video_enabled === 'true';
  const hasUrl = settings.kabah_video_url && settings.kabah_video_url.trim() !== '';

  // Toggle body class to show/hide the entire right column
  if (isEnabled && hasUrl) {
    // Show video: remove no-kabah-video class
    document.body.classList.remove('no-kabah-video');

    videoPlaceholder.style.display = 'none';
    videoContainer.style.display = 'block';
    videoContainer.classList.add('active');

    // Handle YouTube vs offline video
    if (settings.kabah_video_type === 'offline') {
      videoContainer.innerHTML = `<video src="${settings.kabah_video_url}" autoplay muted loop playsinline></video>`;
    } else {
      // YouTube embed - convert watch URL to embed URL if needed
      let embedUrl = settings.kabah_video_url;
      if (embedUrl.includes('watch?v=')) {
        embedUrl = embedUrl.replace('watch?v=', 'embed/');
      }
      // Add autoplay parameters (YouTube requires muted for autoplay)
      const separator = embedUrl.includes('?') ? '&' : '?';
      embedUrl = `${embedUrl}${separator}autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(embedUrl)}`;
      videoContainer.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    }
  } else {
    // Hide video section: add no-kabah-video class
    document.body.classList.add('no-kabah-video');
    videoContainer.classList.remove('active');
  }
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}
