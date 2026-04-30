/**
 * ============================================
 * MASJID DISPLAY - JavaScript Controller
 * Modern Minimalist Theme
 * ============================================
 *
 * LAYOUT ELEMENT ID CONTRACT
 * ==========================
 * Every layout file must provide these element IDs in its HTML.
 * If any ID is missing, the corresponding feature will silently fail.
 *
 * Required IDs:
 *   bg-overlay, mosque-logo-img, mosque-logo-emoji,
 *   mosque-name, mosque-tagline, mosque-address, mosque-phone,
 *   date-masehi, date-hijri,
 *   current-time, current-seconds,
 *   countdown-pill, countdown-label, countdown-time,
 *   iqomah-section, iqomah-time,
 *   prayer-progress, current-prayer-name, prayer-subtext, prayer-subtext-2,
 *   announcements-list, donations-list, donations-wrapper,
 *   donation-qr-section, donation-qr-image,
 *   qr-fullscreen-image, qr-fullscreen-subtext,
 *   video-container, video-placeholder,
 *   optional-times-section, optional-times-grid,
 *   prayer-grid,
 *   info-text, info-source,
 *   marquee,
 *   event-countdown, event-countdown-name, event-countdown-days,
 *   beep-sound
 *
 * Required CSS classes on elements:
 *   .live-indicator (in header area)
 *   .card-announcements (wrapper for announcements)
 *   .card-donations (wrapper for donations)
 *   .column-left (left column container)
 *   .prayer-card (each prayer card, with data-prayer-index attr)
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

// Check if today is Friday (Jum'at)
function isFriday() {
  return new Date().getDay() === 5;
}

// Get display name for a prayer (Dzuhur → Sholat Jum'at on Fridays)
function getPrayerDisplayName(prayer) {
  if (isFriday() && prayer.name === 'Dzuhur') {
    return 'Jum\'at';
  }
  return prayer.name;
}

let currentState = AppState.IDLE;
let prayerTimes = [];
let settings = {};
let hadiths = [];
let runningTexts = [];
let announcements = [];
let donations = [];
let countdownInterval = null;
let cachedEventDate = null;
let cachedEventDateDay = null;

// Watchdog state
let watchdogConsecutiveFails = 0;
let watchdogReloadTimestamps = [];
let iqomahInterval = null;
let hadithInterval = null;
let donationInterval = null;
let announcementInterval = null;
let qrFullscreenInterval = null;
let isQRFullscreenVisible = false;
let currentPrayerIndex = -1;
let nextPrayerIndex = -1;
let currentHadithIndex = 0;
let currentDonationPage = 0;
let currentAnnouncementPage = 0;
let cachedHijriDate = null;
let lastHijriCalculationDate = null;

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
  { text: "Sholat berjamaah lebih utama 27 derajat dibanding sholat sendirian.", source: "HR. Bukhari" },
  { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.", source: "HR. Thabrani" }
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeDisplay();
});

async function fetchSettingsOnly() {
  try {
    const response = await fetch('/api/settings');
    const tempSettings = await response.json();
    return tempSettings.display_layout || 'default';
  } catch (error) {
    console.error('Error fetching settings:', error);
    return 'default';
  }
}

function loadLayout(layoutId, callback) {
  var script = document.createElement('script');
  script.src = '/layouts/' + layoutId + '.js';
  script.onload = function() {
    callback();
  };
  script.onerror = function() {
    // Fallback to default layout if the chosen layout fails to load
    console.warn('Failed to load layout: ' + layoutId + ', falling back to default');
    if (layoutId !== 'default') {
      var fallback = document.createElement('script');
      fallback.src = '/layouts/default.js';
      fallback.onload = function() {
        callback();
      };
      fallback.onerror = function() {
        console.error('Failed to load even the default layout');
        callback();
      };
      document.head.appendChild(fallback);
    } else {
      callback();
    }
  };
  document.head.appendChild(script);
}

function injectLayout() {
  if (typeof MasjidLayout !== 'undefined' && MasjidLayout.getHTML) {
    document.body.innerHTML = MasjidLayout.getHTML();
    // Add layout-specific class for CSS scoping
    document.body.classList.add('layout-' + MasjidLayout.id);
  } else {
    console.error('No MasjidLayout found. Display will not function correctly.');
    document.body.innerHTML = '<p style="text-align:center;padding:4rem;font-family:sans-serif;">Error: Layout gagal dimuat. Periksa pengaturan layout di admin panel.</p>';
  }
}

function initializeDisplay() {
  fetchSettingsOnly().then(function(layoutId) {
    loadLayout(layoutId, function() {
      injectLayout();

      // Start clock update
      updateClock();
      var clockInterval = setInterval(updateClock, 1000);

      // Fetch initial data
      fetchData();

      // Set up intervals
      var dataInterval = setInterval(fetchData, 30000);     // Poll data every 30 seconds (optimized for low-RAM systems)
      var prayerCheckInterval = setInterval(checkPrayerState, 1000); // Check state every second

      // Cleanup on page unload to prevent memory leaks
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
    });
  });
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

  // Hijri date - only recalculate once per day for performance
  const todayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if (!cachedHijriDate || lastHijriCalculationDate !== todayKey) {
    cachedHijriDate = calculateHijriDate(date);
    lastHijriCalculationDate = todayKey;
  }
  document.getElementById('date-hijri').textContent = `${cachedHijriDate.day} ${hijriMonths[cachedHijriDate.month]} ${cachedHijriDate.year} H`;
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
let previousPrayerTimes = [];

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
    previousPrayerTimes = [...newPrayerTimes];

    // Check if prayer times changed
    const prayerTimesChanged = JSON.stringify(newPrayerTimes) !== JSON.stringify(previousPrayerTimes);

    // Only re-render if data changed
    if (settingsChanged) {
      updateDisplayElements();
    }

    // Only re-render prayer grid if prayer times or settings changed (prevents jitter)
    if (prayerTimesChanged || settingsChanged) {
      renderPrayerGrid();
      renderOptionalTimes();
    }

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

    // Always update event countdown (days change at midnight without settings change)
    updateEventCountdown();

    // Watchdog: reset fail counter on successful fetch
    watchdogConsecutiveFails = 0;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Use defaults on error
    hadiths = defaultHadiths;

    // Watchdog: track consecutive failures
    watchdogConsecutiveFails++;
    checkWatchdog();
  }
}

// ==================== WATCHDOG ====================
function checkWatchdog() {
  if (settings.watchdog_enabled === 'false') return;

  const threshold = parseInt(settings.watchdog_fail_threshold) || 3;
  const maxReloads = parseInt(settings.watchdog_max_reloads) || 3;

  if (watchdogConsecutiveFails < threshold) return;

  // Clean up timestamps older than 1 hour
  const oneHourAgo = Date.now() - 3600000;
  watchdogReloadTimestamps = watchdogReloadTimestamps.filter(t => t > oneHourAgo);

  if (watchdogReloadTimestamps.length >= maxReloads) {
    console.warn(`[Watchdog] Max reloads (${maxReloads}/hour) reached. Skipping reload.`);
    return;
  }

  console.warn(`[Watchdog] ${watchdogConsecutiveFails} consecutive failures. Reloading page... (${watchdogReloadTimestamps.length + 1}/${maxReloads} this hour)`);
  watchdogReloadTimestamps.push(Date.now());
  location.reload();
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
  const fullscreenOnly = settings.donation_qr_fullscreen_only === 'true' && settings.donation_qr_fullscreen_enabled === 'true';

  if (donationQRSection && donationQRImage && donationsWrapper) {
    if (qrEnabled && settings.donation_qr_image && !fullscreenOnly) {
      donationQRImage.src = settings.donation_qr_image;
      donationQRSection.style.display = 'flex';
      donationsWrapper.classList.add('has-qr');
    } else {
      donationQRSection.style.display = 'none';
      donationsWrapper.classList.remove('has-qr');
    }
  }

  // Update fullscreen QR display
  updateQRFullscreenDisplay();

  // Start or stop QR fullscreen rotation
  const fullscreenEnabled = settings.donation_qr_fullscreen_enabled === 'true';

  if (qrEnabled && fullscreenEnabled) {
    startQRFullscreenRotation();
  } else {
    stopQRFullscreenRotation();
  }

  // Update Ka'bah video display
  updateKabahVideoDisplay();

  // Update font scale
  const fontScale = parseFloat(settings.font_scale) || 1;
  document.documentElement.style.setProperty('--font-scale', fontScale);

  // Update padding scale
  const paddingScale = parseFloat(settings.padding_scale) || 1;
  document.documentElement.style.setProperty('--padding-scale', paddingScale);

  // Update dark mode
  updateDarkMode();

  // Update performance mode (transitions)
  updatePerformanceMode();

  // Update prayer icons visibility
  updatePrayerIconsVisibility();

  // Update event countdown
  updateEventCountdown();
}

// ==================== PRAYER GRID RENDERING ====================
function renderPrayerGrid() {
  const prayerGrid = document.getElementById('prayer-grid');
  if (!prayerGrid || prayerTimes.length === 0) return;

  // Check if optional times should be integrated into prayer grid
  const integrateOptional = settings.optional_in_prayer_grid === 'true';

  // Build the items array
  let items = [];

  // Get Subuh time for Imsak/Syuruq calculation
  const subuhPrayer = prayerTimes.find(p => p.name.toLowerCase() === 'subuh');
  let subuhTotalMinutes = 0;
  if (subuhPrayer) {
    const [subuhHours, subuhMinutes] = subuhPrayer.time.split(':').map(Number);
    subuhTotalMinutes = subuhHours * 60 + subuhMinutes;
  }

  // Add Imsak first if enabled and integrating
  if (integrateOptional && settings.imsak_enabled === 'true' && subuhPrayer) {
    const imsakOffset = parseInt(settings.imsak_offset) || 10;
    const imsakTotalMinutes = subuhTotalMinutes - imsakOffset;
    const imsakHours = Math.floor(imsakTotalMinutes / 60) % 24;
    const imsakMinutes = imsakTotalMinutes % 60;
    const imsakTime = `${String(imsakHours).padStart(2, '0')}:${String(imsakMinutes).padStart(2, '0')}`;

    items.push({
      icon: '🌙',
      name: settings.imsak_label || 'Imsak',
      time: imsakTime,
      isOptional: true,
      sortTime: imsakTotalMinutes
    });
  }

  // Add all 5 prayers
  prayerTimes.forEach((prayer, index) => {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTotalMinutes = hours * 60 + minutes;
    const isFridayDzuhur = isFriday() && prayer.name === 'Dzuhur';

    items.push({
      icon: isFridayDzuhur ? '🕌' : (prayerIcons[prayer.name] || '🕌'),
      name: getPrayerDisplayName(prayer),
      time: prayer.time,
      iqomah: isFridayDzuhur ? 0 : prayer.iqomah_duration,
      isOptional: false,
      sortTime: prayerTotalMinutes,
      prayerIndex: index
    });

    // Add Syuruq after Subuh if enabled and integrating
    if (integrateOptional && settings.syuruq_enabled === 'true' && prayer.name.toLowerCase() === 'subuh') {
      const syuruqOffset = parseInt(settings.syuruq_offset) || 20;
      const syuruqTotalMinutes = subuhTotalMinutes + syuruqOffset;
      const syuruqHours = Math.floor(syuruqTotalMinutes / 60) % 24;
      const syuruqMinutes = syuruqTotalMinutes % 60;
      const syuruqTime = `${String(syuruqHours).padStart(2, '0')}:${String(syuruqMinutes).padStart(2, '0')}`;

      items.push({
        icon: '🌅',
        name: settings.syuruq_label || 'Syuruq',
        time: syuruqTime,
        isOptional: true,
        sortTime: syuruqTotalMinutes
      });
    }
  });

  // Render the grid
  prayerGrid.innerHTML = items.map((item, index) => {
    if (item.isOptional) {
      return `
        <div class="prayer-card optional-time" data-index="${index}">
          <div class="icon">${item.icon}</div>
          <div class="name">${item.name}</div>
          <div class="time">${formatTime(item.time)}</div>
          <div class="iqomah">&nbsp;</div>
        </div>
      `;
    } else {
      return `
        <div class="prayer-card ${item.prayerIndex === nextPrayerIndex ? 'active' : ''}" data-index="${index}" data-prayer-index="${item.prayerIndex}">
          <div class="icon">${item.icon}</div>
          <div class="name">${item.name}</div>
          <div class="time">${formatTime(item.time)}</div>
          <div class="iqomah">${item.iqomah > 0 ? 'Iqomah: ' + item.iqomah + ' menit' : '&nbsp;'}</div>
        </div>
      `;
    }
  }).join('');
}

function updatePrayerHighlight(prayerIndex) {
  const cards = document.querySelectorAll('.prayer-card');
  cards.forEach(card => {
    // Use data-prayer-index for prayers (ignores optional times)
    // Optional times don't have data-prayer-index, so they'll never be highlighted
    const cardPrayerIndex = card.dataset.prayerIndex;
    card.classList.toggle('active', cardPrayerIndex !== undefined && parseInt(cardPrayerIndex) === prayerIndex);
  });
}

// ==================== OPTIONAL TIMES RENDERING ====================
function renderOptionalTimes() {
  const section = document.getElementById('optional-times-section');
  const grid = document.getElementById('optional-times-grid');
  if (!section || !grid) return;

  // If optional times are integrated into prayer grid, hide this section
  if (settings.optional_in_prayer_grid === 'true') {
    section.style.display = 'none';
    return;
  }

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
    // Check if transitions are disabled (for low-RAM devices)
    const transitionsDisabled = settings.disable_transitions === 'true';

    if (transitionsDisabled) {
      // Instant update without fade transition
      textEl.textContent = `"${hadith.text}"`;
      sourceEl.textContent = `— ${hadith.source}`;
    } else {
      // Original fade transition
      textEl.style.opacity = 0;
      sourceEl.style.opacity = 0;

      setTimeout(() => {
        textEl.textContent = `"${hadith.text}"`;
        sourceEl.textContent = `— ${hadith.source}`;
        textEl.style.opacity = 1;
        sourceEl.style.opacity = 1;
      }, 300);
    }
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

  // Hide marquee bar when no active running texts
  const marqueeBar = marqueeEl.closest('.mv2-marquee-bar') || marqueeEl.closest('.footer');
  if (runningTexts.length === 0) {
    if (marqueeBar) marqueeBar.style.display = 'none';
    return;
  } else {
    if (marqueeBar) marqueeBar.style.display = '';
  }

  // Check if marquee animation is disabled (for low-RAM devices)
  const marqueeDisabled = settings.disable_marquee === 'true';

  // Get marquee settings with defaults
  const loop = settings.marquee_loop !== 'false'; // Default true (seamless loop)
  const speed = parseInt(settings.marquee_speed) || 30; // Default 30 seconds
  const gap = parseFloat(settings.marquee_gap) || 4; // Default 4rem

  // Apply CSS variables for marquee configuration
  marqueeEl.style.setProperty('--marquee-gap', `${gap}rem`);
  marqueeEl.style.gap = `${gap}rem`;

  // Render running texts
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

    if (marqueeDisabled) {
      // Static centered display (no animation)
      marqueeEl.innerHTML = items;
      marqueeEl.classList.add('static');
      marqueeEl.style.animationName = 'none';
      marqueeEl.style.paddingLeft = '0';
    } else if (loop) {
      // Seamless loop: duplicate items (2 copies total)
      // Animation translates -50% so when it reaches the end of first set,
      // the second set is exactly where the first set started
      marqueeEl.innerHTML = items + items;
      marqueeEl.classList.remove('static');
      marqueeEl.style.animationName = 'marquee-seamless';
      marqueeEl.style.animationDuration = `${speed}s`;
      marqueeEl.style.animationIterationCount = 'infinite';
      marqueeEl.style.paddingLeft = '100%';
    } else {
      // Non-seamless: single items, wait for exit then restart
      marqueeEl.innerHTML = items;
      marqueeEl.classList.remove('static');
      marqueeEl.style.animationName = 'marquee';
      marqueeEl.style.animationDuration = `${speed}s`;
      marqueeEl.style.animationIterationCount = 'infinite';
      marqueeEl.style.paddingLeft = '100%';
    }
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
    const isFridayDzuhur = isFriday() && prayer.name === 'Dzuhur';
    const effectiveIqomah = isFridayDzuhur ? 0 : prayer.iqomah_duration;
    const prayerDuration = isFridayDzuhur
      ? (parseInt(settings.jumat_prayer_duration) || 45)
      : (parseInt(settings.prayer_duration) || 15);
    const iqomahEndMinutes = prayerTimeMinutes + effectiveIqomah;
    const prayerEndMinutes = iqomahEndMinutes + prayerDuration;
    const displayName = getPrayerDisplayName(prayer);

    // Check if currently in prayer
    if (currentTimeMinutes >= iqomahEndMinutes && currentTimeMinutes < prayerEndMinutes) {
      // Only transition to prayer state if not already in it
      if (currentState !== AppState.PRAYER) {
        setPrayerInProgress(displayName);
      }
      foundState = true;
      break;
    }

    // Check if in iqomah countdown (skip for Friday Jum'at)
    if (effectiveIqomah > 0 && currentTimeMinutes >= prayerTimeMinutes && currentTimeMinutes < iqomahEndMinutes) {
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

    document.getElementById('countdown-label').textContent = `Menuju Adzan ${getPrayerDisplayName(prayer)}`;
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
  updateDarkMode(); // Will apply dark mode if enabled (state is WAITING_ADZAN)
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

  document.getElementById('countdown-label').textContent = `WAKTU ADZAN ${getPrayerDisplayName(prayer).toUpperCase()}`;
  document.getElementById('countdown-time').textContent = formatTime(prayer.time);

  updatePrayerHighlight(currentPrayerIndex);
  playBeep();
  updateDarkMode(); // Will remove dark mode since state is ADZAN
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
  updateDarkMode(); // Will apply dark mode if enabled (state is IQOMAH)

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
  updateDarkMode(); // Will remove dark mode since state is PRAYER
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
  }, 1000); // Optimized from 100ms to 1000ms
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



// ==================== UPDATE PERFORMANCE MODE ====================
function updatePerformanceMode() {
  const transitionsDisabled = settings.disable_transitions === 'true';
  if (transitionsDisabled) {
    document.body.classList.add('no-transitions');
  } else {
    document.body.classList.remove('no-transitions');
  }
}

// ==================== PRAYER ICONS VISIBILITY ====================
function updatePrayerIconsVisibility() {
  const hideIcons = settings.hide_prayer_icons === 'true';
  if (hideIcons) {
    document.body.classList.add('hide-prayer-icons');
  } else {
    document.body.classList.remove('hide-prayer-icons');
  }
}

// ==================== EVENT COUNTDOWN ====================
const islamicEventPresets = {
  idul_fitri:       { name: 'Idul Fitri',       hijriMonth: 10, hijriDay: 1 },
  idul_adha:        { name: 'Idul Adha',         hijriMonth: 12, hijriDay: 10 },
  maulid_nabi:      { name: 'Maulid Nabi',       hijriMonth: 3,  hijriDay: 12 },
  isra_miraj:       { name: "Isra Mi'raj",       hijriMonth: 7,  hijriDay: 27 },
  nuzulul_quran:    { name: 'Nuzulul Quran',     hijriMonth: 9,  hijriDay: 17 },
  tahun_baru_islam: { name: 'Tahun Baru Islam',  hijriMonth: 1,  hijriDay: 1 },
};

function findNextGregorianDateForEvent(targetHijriMonth, targetHijriDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();

  // Return cached result if same day and same target
  const cacheKey = `${todayStr}-${targetHijriMonth}-${targetHijriDay}`;
  if (cachedEventDateDay === cacheKey && cachedEventDate) {
    return cachedEventDate;
  }

  for (let i = 0; i < 400; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + i);
    const hijri = calculateHijriDate(testDate);
    if (hijri.month === targetHijriMonth - 1 && hijri.day === targetHijriDay) {
      cachedEventDate = testDate;
      cachedEventDateDay = cacheKey;
      return testDate;
    }
  }
  cachedEventDate = null;
  cachedEventDateDay = cacheKey;
  return null;
}

function updateEventCountdown() {
  const el = document.getElementById('event-countdown');
  const nameEl = document.getElementById('event-countdown-name');
  const daysEl = document.getElementById('event-countdown-days');
  if (!el || !nameEl || !daysEl) return;

  if (settings.event_countdown_enabled !== 'true') {
    el.classList.remove('visible');
    return;
  }

  let eventName = '';
  let targetDate = null;
  const preset = settings.event_countdown_preset || 'custom';

  if (preset === 'custom') {
    eventName = settings.event_countdown_custom_name || '';
    const dateStr = settings.event_countdown_custom_date;
    if (dateStr) {
      targetDate = new Date(dateStr + 'T00:00:00');
    }
  } else {
    const eventInfo = islamicEventPresets[preset];
    if (eventInfo) {
      eventName = eventInfo.name;
      targetDate = findNextGregorianDateForEvent(eventInfo.hijriMonth, eventInfo.hijriDay);
    }
  }

  if (!targetDate || !eventName) {
    el.classList.remove('visible');
    return;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target - now;
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft === 0) {
    nameEl.textContent = eventName;
    daysEl.textContent = 'Hari Ini!';
    el.classList.add('visible');
  } else if (daysLeft > 0) {
    nameEl.textContent = eventName;
    daysEl.textContent = `-${daysLeft} hari`;
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
  }
}

// ==================== DARK MODE ====================
function updateDarkMode() {
  const darkModeEnabled = settings.dark_mode_enabled === 'true';
  const darkModeStyle = settings.dark_mode_style || 'soft';

  // Remove dark mode classes first
  document.body.classList.remove('dark-mode', 'dark-soft', 'dark-calm');

  // Apply dark mode only if enabled and not in special states
  // ADZAN uses adhan-mode, PRAYER uses calm-mode - both have their own styling
  if (darkModeEnabled && currentState !== AppState.ADZAN && currentState !== AppState.PRAYER) {
    document.body.classList.add('dark-mode', `dark-${darkModeStyle}`);
  }
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

async function updateKabahVideoDisplay() {
  const videoContainer = document.getElementById('video-container');
  const videoPlaceholder = document.getElementById('video-placeholder');

  if (!videoContainer || !videoPlaceholder) return;

  const isEnabled = settings.kabah_video_enabled === 'true';
  if (!isEnabled) {
    document.body.classList.add('no-kabah-video');
    videoContainer.classList.remove('active');
    return;
  }

  // If auto-find is enabled and we're using YouTube, try to find a live stream first
  const isAutofindEnabled = settings.kabah_video_autofind_enabled === 'true';
  const isYoutube = settings.kabah_video_type !== 'offline';

  if (isAutofindEnabled && isYoutube) {
    try {
      const response = await fetch('/api/youtube/find-live');
      const data = await response.json();
      if (data.found && data.url) {
        settings.kabah_video_url = data.url;
        console.log('[Auto-Find] Found live stream:', data.title, data.url);
      } else {
        console.warn('[Auto-Find] No live stream found:', data.message);
      }
    } catch (error) {
      console.warn('[Auto-Find] Failed to search for live stream:', error);
    }
  }

  const hasUrl = settings.kabah_video_url && settings.kabah_video_url.trim() !== '';

  // Toggle body class to show/hide the entire right column
  if (hasUrl) {
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
      // Add autoplay + JS API parameters (YouTube requires muted for autoplay)
      const separator = embedUrl.includes('?') ? '&' : '?';
      embedUrl = `${embedUrl}${separator}autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(embedUrl)}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
      videoContainer.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

      // Detect YouTube iframe failure and show fallback image
      monitorIframeLoad(videoContainer, embedUrl);
    }
  } else {
    // Hide video section: add no-kabah-video class
    document.body.classList.add('no-kabah-video');
    videoContainer.classList.remove('active');
  }
}

// Attempt to auto-find a new live stream and reload the video
async function autofindAndRetryVideo(videoContainer) {
  if (settings.kabah_video_autofind_enabled !== 'true') return false;
  if (settings.kabah_video_type === 'offline') return false;

  try {
    // Clear the server-side cache so we get fresh results
    await fetch('/api/youtube/find-live/cache-clear', { method: 'POST' });

    const response = await fetch('/api/youtube/find-live');
    const data = await response.json();

    if (data.found && data.url) {
      const currentVideoId = getYouTubeVideoId(settings.kabah_video_url);
      const newVideoId = data.videoId;

      // Only reload if the found video is different from current
      if (newVideoId !== currentVideoId) {
        console.log('[Auto-Find] Replacing dead stream with:', data.title, data.url);
        settings.kabah_video_url = data.url;

        let embedUrl = data.url;
        if (embedUrl.includes('watch?v=')) {
          embedUrl = embedUrl.replace('watch?v=', 'embed/');
        }
        const separator = embedUrl.includes('?') ? '&' : '?';
        embedUrl = `${embedUrl}${separator}autoplay=1&mute=1&loop=1&playlist=${newVideoId}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        videoContainer.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        monitorIframeLoad(videoContainer, embedUrl);
        return true;
      }
    }
  } catch (error) {
    console.warn('[Auto-Find] Retry failed:', error);
  }
  return false;
}

// Monitor iframe load and fallback to image on failure
function monitorIframeLoad(videoContainer, embedUrl) {
  const iframe = videoContainer.querySelector('iframe');
  if (!iframe) return;

  let fallbackTriggered = false;
  let monitorInterval = null;
  let playbackConfirmed = false;
  let fallbackTimeoutId = null;

  function cancelFallbackTimeout() {
    if (fallbackTimeoutId) {
      clearTimeout(fallbackTimeoutId);
      fallbackTimeoutId = null;
    }
  }

  function confirmPlayback() {
    if (playbackConfirmed) return;
    playbackConfirmed = true;
    cancelFallbackTimeout();
    console.log('YouTube video playback confirmed — fallback timeout cancelled');
  }

  function showFallback() {
    if (fallbackTriggered) return;
    fallbackTriggered = true;

    cancelFallbackTimeout();
    if (monitorInterval) clearInterval(monitorInterval);

    if (settings.kabah_video_autofind_enabled === 'true' && settings.kabah_video_type !== 'offline') {
      autofindAndRetryVideo(videoContainer).then((found) => {
        if (!found && settings.kabah_video_fallback_image) {
          videoContainer.innerHTML = `<img src="${settings.kabah_video_fallback_image}" style="width:100%;height:100%;object-fit:cover;border-radius:2rem;" alt="Ka'bah">`;
          console.warn('YouTube video failed to load, auto-find found nothing, showing fallback image');
        }
      });
    } else if (settings.kabah_video_fallback_image) {
      videoContainer.innerHTML = `<img src="${settings.kabah_video_fallback_image}" style="width:100%;height:100%;object-fit:cover;border-radius:2rem;" alt="Ka'bah">`;
      console.warn('YouTube video failed to load, showing fallback image');
    }
  }

  // Listen for YouTube IFrame API messages (errors + playback state)
  function onYouTubeMessage(event) {
    if (fallbackTriggered) return;
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data || typeof data !== 'object') return;

      // YouTube IFrame API sends error events via postMessage
      if (data.event === 'onError') {
        console.warn('YouTube player error detected via postMessage:', data);
        showFallback();
        return;
      }

      // Confirm playback: state 1 = playing, state 3 = buffering (about to play)
      if (data.event === 'infoDelivery' && data.info && data.info.playerState === 1) {
        confirmPlayback();
      }

      // Also handle initial ready + state change from some iframe API implementations
      if (data.event === 'initialDelivery' && data.info && data.info.playerState === 1) {
        confirmPlayback();
      }
    } catch (e) {
      // Not a JSON message or not from YouTube — ignore
    }
  }
  window.addEventListener('message', onYouTubeMessage);

  // Listen for iframe load event as a basic playback confirmation
  iframe.addEventListener('load', () => {
    // iframe loaded its content — give YouTube player a few seconds to start,
    // then confirm playback. If an error already occurred, showFallback
    // would have been called and we skip this.
    setTimeout(() => {
      if (!fallbackTriggered && !playbackConfirmed) {
        confirmPlayback();
      }
    }, 15000); // 15 seconds grace period for player to initialize
  });

  // Use YouTube oEmbed API to check if the video actually exists
  const videoId = getYouTubeVideoId(embedUrl);
  if (videoId) {
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then(res => {
        if (!res.ok) {
          // Video not found or removed — immediate fallback
          showFallback();
          return;
        }
        // oEmbed says video exists — cancel the fallback timeout since
        // the video is confirmed valid. Periodic monitoring will still
        // catch it if it goes offline later.
        confirmPlayback();

        // Start periodic monitoring — re-check oEmbed every 2 minutes.
        // This catches streams that go offline after initially being valid.
        monitorInterval = setInterval(() => {
          if (fallbackTriggered) {
            clearInterval(monitorInterval);
            return;
          }
          fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
            .then(res => {
              if (!res.ok) {
                showFallback();
              }
            })
            .catch(() => {
              // Network error on re-check — don't trigger fallback,
              // might just be temporary connectivity issue
            });
        }, 120000); // 2 minutes
      })
      .catch(() => {
        // Network error — device might be offline or YouTube blocked.
        // Give iframe 10s to load, then fallback if it hasn't
        setTimeout(() => {
          const currentIframe = videoContainer.querySelector('iframe');
          if (currentIframe && settings.kabah_video_fallback_image && !playbackConfirmed) {
            showFallback();
          }
        }, 10000);
      });
  }

  // Safety net: configurable fallback timeout.
  // Only triggers if playback was never confirmed (no oEmbed success,
  // no iframe load, no YouTube player state confirmation).
  // This catches cases where the iframe silently fails without any
  // detectable error events.
  const fallbackTimeout = parseInt(settings.kabah_video_fallback_timeout) || 300;
  fallbackTimeoutId = setTimeout(() => {
    fallbackTimeoutId = null;
    if (fallbackTriggered) return;
    if (playbackConfirmed) return;
    if (settings.kabah_video_fallback_image) {
      console.warn(`YouTube video: no playback confirmed after ${fallbackTimeout}s, showing fallback image`);
      showFallback();
    }
  }, fallbackTimeout * 1000);
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}
