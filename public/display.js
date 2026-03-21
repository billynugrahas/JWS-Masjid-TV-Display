// State management
const state = {
  IDLE: 'IDLE',
  WAITING_ADZAN: 'WAITING_ADZAN',
  ADZAN: 'ADZAN',
  IQOMAH: 'IQOMAH',
  PRAYER: 'PRAYER',
  FINISHED: 'FINISHED'
};

let currentState = state.IDLE;
let prayerTimes = [];
let settings = {};
let countdownInterval = null;
let iqomahInterval = null;
let currentPrayerIndex = -1;

// Indonesian day and month names
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchData();
  setInterval(fetchData, 5000); // Poll every 5 seconds
});

// Update clock display
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  document.getElementById('current-time').textContent = timeStr;
  document.getElementById('current-date').textContent = dateStr;
}

// Fetch data from server
async function fetchData() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();

    settings = data.settings;
    prayerTimes = data.prayers;

    updateDisplay();
    checkPrayerState();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Update display elements
function updateDisplay() {
  // Update mosque name
  document.getElementById('mosque-name').textContent = settings.mosque_name || 'Masjid Al-Ikhlas';

  // Update running text
  const runningText = document.getElementById('running-text');
  runningText.textContent = settings.running_text || 'Selamat datang di Masjid';

  // Update background
  const bgOverlay = document.querySelector('.background-overlay');
  if (settings.background_image) {
    bgOverlay.style.backgroundImage = `url(${settings.background_image})`;
    bgOverlay.style.opacity = '0.3';
  } else {
    bgOverlay.style.opacity = '0';
  }

  // Update prayer grid
  const prayerGrid = document.getElementById('prayer-grid');
  prayerGrid.innerHTML = prayerTimes.map((prayer, index) => `
    <div class="prayer-card ${index === currentPrayerIndex ? 'active' : ''}" data-index="${index}">
      <div class="name">${prayer.name}</div>
      <div class="time">${prayer.time}</div>
    </div>
  `).join('');
}

// Get next prayer index
function getNextPrayerIndex() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < prayerTimes.length; i++) {
    const [hours, minutes] = prayerTimes[i].time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;

    if (prayerTime > currentTime) {
      return i;
    }
  }

  return 0; // Return first prayer for next day
}

// Get current prayer index (if within prayer time)
function getCurrentPrayerIndex() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < prayerTimes.length; i++) {
    const [hours, minutes] = prayerTimes[i].time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    const iqomahTime = prayerTime + prayerTimes[i].iqomah_duration;
    const prayerEndTime = iqomahTime + 15; // Assume 15 min prayer duration

    if (currentTime >= prayerTime && currentTime < prayerEndTime) {
      return i;
    }
  }

  return -1;
}

// Check and update prayer state
function checkPrayerState() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  // Find current or next prayer
  let foundPrayer = false;

  for (let i = 0; i < prayerTimes.length; i++) {
    const prayer = prayerTimes[i];
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    const iqomahStartTime = prayerTime;
    const iqomahEndTime = prayerTime + prayer.iqomah_duration;
    const prayerEndTime = iqomahEndTime + 15; // 15 min prayer

    // During prayer
    if (currentTime >= iqomahEndTime && currentTime < prayerEndTime) {
      setPrayerInProgress(prayer.name);
      foundPrayer = true;
      break;
    }

    // During iqomah
    if (currentTime >= iqomahStartTime && currentTime < iqomahEndTime) {
      setIqomahCountdown(iqomahEndTime - currentTime, prayer);
      foundPrayer = true;
      break;
    }

    // Adzan time (at exact prayer time, show for 1 minute)
    if (currentTime === prayerTime && currentSeconds < 60) {
      setAdzanState(prayer);
      foundPrayer = true;
      break;
    }
  }

  // If not in any prayer state, show countdown to next prayer
  if (!foundPrayer) {
    const nextIndex = getNextPrayerIndex();
    setCountdownToNextPrayer(nextIndex);
  }
}

// Set countdown to next prayer
function setCountdownToNextPrayer(prayerIndex) {
  currentPrayerIndex = -1;
  currentState = state.WAITING_ADZAN;

  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress-section').style.display = 'none';
  document.getElementById('countdown-section').style.display = 'block';
  document.body.classList.remove('calm-mode');

  const prayer = prayerTimes[prayerIndex];
  const now = new Date();
  const [hours, minutes] = prayer.time.split(':').map(Number);

  let prayerDate = new Date(now);
  prayerDate.setHours(hours, minutes, 0, 0);

  // If prayer time has passed today, calculate for tomorrow
  if (prayerDate <= now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diff = prayerDate - now;
  const diffMinutes = Math.floor(diff / 60000);
  const diffSeconds = Math.floor((diff % 60000) / 1000);

  document.getElementById('countdown-label').textContent = `Menuju Adzan ${prayer.name}`;
  document.getElementById('countdown-time').textContent = formatCountdown(diff);

  // Update prayer grid highlight
  updatePrayerHighlight(prayerIndex);
}

// Set iqomah countdown
function setIqomahCountdown(remainingMinutes, prayer) {
  currentPrayerIndex = prayerTimes.indexOf(prayer);
  currentState = state.IQOMAH;

  document.getElementById('countdown-section').style.display = 'none';
  document.getElementById('prayer-progress-section').style.display = 'none';
  document.getElementById('iqomah-section').style.display = 'block';
  document.body.classList.remove('calm-mode');

  const now = new Date();
  const [hours, minutes] = prayer.time.split(':').map(Number);

  const iqomahEnd = new Date(now);
  iqomahEnd.setHours(hours, minutes + prayer.iqomah_duration, 0, 0);

  updateIqomahDisplay(iqomahEnd);
  updatePrayerHighlight(currentPrayerIndex);

  // Play beep when iqomah starts
  playBeep();
}

// Update iqomah display
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

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById('iqomah-time').textContent =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Play beep in last 10 seconds
    if (diff <= 10000 && diff > 9900) {
      playBeep();
    }
  }, 100);
}

// Set adzan state
function setAdzanState(prayer) {
  currentState = state.ADZAN;
  currentPrayerIndex = prayerTimes.indexOf(prayer);

  document.getElementById('countdown-section').style.display = 'block';
  document.getElementById('countdown-label').textContent = `WAKTU ADZAN ${prayer.name}`;
  document.getElementById('countdown-time').textContent = prayer.time;

  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('prayer-progress-section').style.display = 'none';

  updatePrayerHighlight(currentPrayerIndex);
  playBeep();
}

// Set prayer in progress
function setPrayerInProgress(prayerName) {
  currentState = state.PRAYER;

  document.getElementById('iqomah-section').style.display = 'none';
  document.getElementById('countdown-section').style.display = 'none';
  document.getElementById('prayer-progress-section').style.display = 'block';
  document.body.classList.add('calm-mode');

  document.getElementById('current-prayer-name').textContent = prayerName;
}

// Update prayer highlight
function updatePrayerHighlight(index) {
  const cards = document.querySelectorAll('.prayer-card');
  cards.forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });
}

// Format countdown
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

// Play beep sound
function playBeep() {
  try {
    // Create oscillator-based beep as fallback
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
