/**
 * ============================================
 * ADMIN DASHBOARD - JavaScript Controller
 * ============================================
 */

// ==================== STATE ====================
let appData = {
  settings: {},
  prayers: [],
  hadiths: [],
  announcements: [],
  donations: [],
  runningTexts: []
};

let backgroundImageData = '';
let logoImageData = '';
let donationQRImageData = '';
let kabahFallbackImageData = '';
let indonesiaCitiesData = null;

// Time formatting function
function formatTime(timeStr) {
  if (!timeStr) return '';
  const timeFormat = document.getElementById('setting-time-format')?.value || '24h';
  if (timeFormat !== '12h') return timeStr;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadIndonesiaCities();
  fetchAllData();
});

// ==================== INDONESIA CITIES LOADER ====================
async function loadIndonesiaCities() {
  try {
    const response = await fetch('/indonesia-cities.json');
    indonesiaCitiesData = await response.json();
    populateProvinceDropdown();
  } catch (error) {
    console.error('Failed to load Indonesia cities data:', error);
  }
}

function populateProvinceDropdown() {
  const select = document.getElementById('setting-province');
  if (!select || !indonesiaCitiesData) return;

  select.innerHTML = '<option value="">-- Pilih Provinsi --</option>';

  indonesiaCitiesData.provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province.id;
    option.textContent = province.name;
    select.appendChild(option);
  });
}

function onProvinceChange() {
  const provinceId = document.getElementById('setting-province').value;
  const citySelect = document.getElementById('setting-city');

  citySelect.innerHTML = '<option value="">-- Pilih Kota --</option>';

  if (!provinceId || !indonesiaCitiesData) return;

  const province = indonesiaCitiesData.provinces.find(p => p.id === provinceId);
  if (!province) return;

  province.cities.forEach(city => {
    const option = document.createElement('option');
    option.value = JSON.stringify({ lat: city.lat, lng: city.lng });
    option.textContent = city.name;
    citySelect.appendChild(option);
  });
}

function onCityChange() {
  const cityValue = document.getElementById('setting-city').value;
  if (!cityValue) return;

  try {
    const coords = JSON.parse(cityValue);
    document.getElementById('setting-mosque-latitude').value = coords.lat;
    document.getElementById('setting-mosque-longitude').value = coords.lng;
  } catch (e) {
    console.error('Failed to parse city coordinates:', e);
  }
}

function toggleCoordsInput() {
  const coordsDiv = document.getElementById('manual-coords');
  if (coordsDiv.style.display === 'none') {
    coordsDiv.style.display = 'grid';
  } else {
    coordsDiv.style.display = 'none';
  }
}

function findCityByCoords(lat, lng) {
  if (!indonesiaCitiesData) return null;

  const tolerance = 0.1; // ~10km tolerance

  for (const province of indonesiaCitiesData.provinces) {
    for (const city of province.cities) {
      if (Math.abs(city.lat - lat) < tolerance && Math.abs(city.lng - lng) < tolerance) {
        return { provinceId: province.id, cityName: city.name, cityCoords: city };
      }
    }
  }
  return null;
}

// ==================== NAVIGATION ====================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      switchSection(section);
    });
  });
}

function switchSection(sectionName) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionName);
  });

  // Update sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.toggle('active', section.id === `section-${sectionName}`);
  });

  // Update title
  const titles = {
    'dashboard': 'Dashboard',
    'schedule': 'Jadwal Sholat',
    'hadiths': 'Hadits & Quotes',
    'announcements': 'Pengumuman',
    'donations': 'Donasi & Infaq',
    'running-text': 'Teks Berjalan',
    'settings': 'Pengaturan'
  };
  document.getElementById('page-title').textContent = titles[sectionName] || 'Dashboard';
}

// ==================== DATA FETCHING ====================
async function fetchAllData() {
  try {
    // Fetch all data in parallel
    const [settingsRes, prayersRes, hadithsRes, announcementsRes, donationsRes, runningTextsRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/prayers'),
      fetch('/api/hadiths'),
      fetch('/api/announcements'),
      fetch('/api/donations'),
      fetch('/api/running-texts')
    ]);

    appData.settings = await settingsRes.json();
    appData.prayers = await prayersRes.json();
    appData.hadiths = await hadithsRes.json();
    appData.announcements = await announcementsRes.json();
    appData.donations = await donationsRes.json();
    appData.runningTexts = await runningTextsRes.json();

    // Render all sections
    renderDashboard();
    renderPrayers();
    renderHadiths();
    renderAnnouncements();
    renderDonations();
    renderRunningTexts();
    populateSettings();

  } catch (error) {
    console.error('Error fetching data:', error);
    showToast('Gagal memuat data', 'error');
  }
}

// ==================== DASHBOARD ====================
function renderDashboard() {
  document.getElementById('stat-mosque-name').textContent = appData.settings.mosque_name || '-';

  // Find next prayer
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let nextPrayer = null;

  for (const prayer of appData.prayers) {
    const [h, m] = prayer.time.split(':').map(Number);
    if (h * 60 + m > currentMinutes) {
      nextPrayer = prayer;
      break;
    }
  }

  if (!nextPrayer) nextPrayer = appData.prayers[0];
  document.getElementById('stat-next-prayer').textContent = nextPrayer ? `${nextPrayer.name} - ${nextPrayer.time}` : '-';

  document.getElementById('stat-hadiths').textContent = appData.hadiths.filter(h => h.is_active).length;
  document.getElementById('stat-announcements').textContent = appData.announcements.filter(a => a.status === 'published').length;
}

function openPreview() {
  window.open('/display', '_blank', 'width=1920,height=1080');
}

// ==================== PRAYERS ====================
function renderPrayers() {
  const container = document.getElementById('prayer-list');
  const autoCalcBanner = document.getElementById('auto-calc-banner');
  const calculatedDisplay = document.getElementById('calculated-times-display');
  const calculatedGrid = document.getElementById('calculated-times-grid');

  const isAutoCalcEnabled = appData.settings.prayer_calc_enabled === 'true';

  if (isAutoCalcEnabled) {
    // Show auto-calculation mode
    autoCalcBanner.style.display = 'flex';
    calculatedDisplay.style.display = 'block';
    container.style.display = 'none';

    // Render calculated times with editable iqomah
    renderCalculatedTimes();
  } else {
    // Show manual mode
    autoCalcBanner.style.display = 'none';
    calculatedDisplay.style.display = 'none';
    container.style.display = 'block';

    container.innerHTML = appData.prayers.map(prayer => {
      const timeFormat = document.getElementById('setting-time-format')?.value || '24h';
      return `
        <div class="prayer-item" data-id="${prayer.id}">
          <span class="prayer-name">${prayer.name}</span>
          <div class="prayer-inputs">
            <div>
              <label>Waktu</label>
              ${renderTimePicker(prayer.id, prayer.time, timeFormat)}
            </div>
            <div>
              <label>Iqomah (menit)</label>
              <input type="number" value="${prayer.iqomah_duration}" min="1" max="30"
                     onchange="updatePrayer(${prayer.id}, 'iqomah_duration', this.value)">
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Render custom time picker based on format setting
function renderTimePicker(prayerId, timeValue, timeFormat) {
  const [hours24, minutes] = timeValue.split(':').map(Number);

  if (timeFormat === '12h') {
    // 12-hour format with AM/PM
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;

    const hourOptions = Array.from({length: 12}, (_, i) => i + 1)
      .map(h => `<option value="${h}" ${h === hours12 ? 'selected' : ''}>${h}</option>`).join('');

    const minuteOptions = Array.from({length: 60}, (_, i) => i)
      .map(m => `<option value="${m}" ${m === minutes ? 'selected' : ''}>${String(m).padStart(2, '0')}</option>`).join('');

    return `
      <div class="time-picker-12h">
        <select onchange="updateTimeFromPicker12h(${prayerId}, this)">${hourOptions}</select>
        <span>:</span>
        <select onchange="updateTimeFromPicker12h(${prayerId}, this)">
          ${minuteOptions}
        </select>
        <select onchange="updateTimeFromPicker12h(${prayerId}, this)">
          <option value="AM" ${period === 'AM' ? 'selected' : ''}>AM</option>
          <option value="PM" ${period === 'PM' ? 'selected' : ''}>PM</option>
        </select>
      </div>
    `;
  } else {
    // 24-hour format
    const hourOptions = Array.from({length: 24}, (_, i) => i)
      .map(h => `<option value="${h}" ${h === hours24 ? 'selected' : ''}>${String(h).padStart(2, '0')}</option>`).join('');

    const minuteOptions = Array.from({length: 60}, (_, i) => i)
      .map(m => `<option value="${m}" ${m === minutes ? 'selected' : ''}>${String(m).padStart(2, '0')}</option>`).join('');

    return `
      <div class="time-picker-24h">
        <select onchange="updateTimeFromPicker24h(${prayerId}, this)">${hourOptions}</select>
        <span>:</span>
        <select onchange="updateTimeFromPicker24h(${prayerId}, this)">
          ${minuteOptions}
        </select>
      </div>
    `;
  }
}

// Update time from 24h picker
function updateTimeFromPicker24h(prayerId, element) {
  const container = element.closest('.time-picker-24h');
  const selects = container.querySelectorAll('select');
  const hours = parseInt(selects[0].value);
  const minutes = parseInt(selects[1].value);
  const timeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  updatePrayer(prayerId, 'time', timeValue);
}

// Update time from 12h picker
function updateTimeFromPicker12h(prayerId, element) {
  const container = element.closest('.time-picker-12h');
  const selects = container.querySelectorAll('select');
  let hours = parseInt(selects[0].value);
  const minutes = parseInt(selects[1].value);
  const period = selects[2].value;

  // Convert 12h to 24h
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const timeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  updatePrayer(prayerId, 'time', timeValue);
}

// Re-render prayer list when time format changes
function onTimeFormatChange() {
  renderPrayers();
  renderCalculatedTimes();
}

async function renderCalculatedTimes() {
  const calculatedGrid = document.getElementById('calculated-times-grid');

  try {
    // Fetch calculated times
    const response = await fetch('/api/prayers/calculate');
    const data = await response.json();

    // Prayer icons
    const prayerIcons = {
      'Subuh': '🌅',
      'Dzuhur': '☀️',
      'Ashar': '🌤️',
      'Maghrib': '🌅',
      'Isya': '🌙'
    };

    const prayerOrder = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

    calculatedGrid.innerHTML = prayerOrder.map(name => {
      const prayer = appData.prayers.find(p => p.name === name) || { id: 0, iqomah_duration: 10 };
      return `
        <div class="calc-time-card">
          <div class="prayer-name">${prayerIcons[name] || '🕌'} ${name}</div>
          <div class="prayer-time">${formatTime(data.times[name])}</div>
          <div class="iqomah-section">
            <label>Iqomah (menit)</label>
            <input type="number" value="${prayer.iqomah_duration}" min="1" max="30"
                   onchange="updatePrayerIqomah(${prayer.id}, this.value)">
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    calculatedGrid.innerHTML = '<p style="color: var(--color-danger);">Gagal memuat jadwal otomatis</p>';
  }
}

async function updatePrayerIqomah(prayerId, value) {
  if (!prayerId) return;

  try {
    await fetch(`/api/prayers/${prayerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iqomah_duration: parseInt(value) })
    });

    // Update local data
    const prayer = appData.prayers.find(p => p.id === prayerId);
    if (prayer) {
      prayer.iqomah_duration = parseInt(value);
    }

    showToast('Durasi iqomah diperbarui', 'success');
  } catch (error) {
    showToast('Gagal memperbarui iqomah', 'error');
  }
}

async function updatePrayer(id, field, value) {
  const prayer = appData.prayers.find(p => p.id === id);
  if (!prayer) return;

  const updateData = {
    time: field === 'time' ? value : prayer.time,
    iqomah_duration: field === 'iqomah_duration' ? parseInt(value) : prayer.iqomah_duration
  };

  try {
    await fetch(`/api/prayers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    // Update local data
    prayer.time = updateData.time;
    prayer.iqomah_duration = updateData.iqomah_duration;

    showToast('Jadwal diperbarui', 'success');
  } catch (error) {
    showToast('Gagal memperbarui jadwal', 'error');
  }
}

// ==================== HADITHS ====================
function renderHadiths() {
  const container = document.getElementById('hadith-list');

  if (appData.hadiths.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Belum ada hadits. Klik "Tambah Hadits" untuk menambahkan.</p>';
    return;
  }

  container.innerHTML = appData.hadiths.map(hadith => `
    <div class="hadith-item ${hadith.is_active ? '' : 'inactive'}">
      <p class="hadith-text">"${hadith.text}"</p>
      <span class="hadith-source">— ${hadith.source}</span>
      <div class="hadith-actions">
        <button class="btn btn-sm btn-secondary" onclick="editHadith(${hadith.id})">✏️ Edit</button>
        <button class="btn btn-sm ${hadith.is_active ? 'btn-secondary' : 'btn-primary'}"
                onclick="toggleHadith(${hadith.id}, ${hadith.is_active})">
          ${hadith.is_active ? '👁️ Sembunyikan' : '👁️‍🗨️ Aktifkan'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteHadith(${hadith.id})">🗑️ Hapus</button>
      </div>
    </div>
  `).join('');
}

function openHadithModal(id = null) {
  const modal = document.getElementById('hadith-modal');
  const title = document.getElementById('hadith-modal-title');

  if (id) {
    const hadith = appData.hadiths.find(h => h.id === id);
    title.textContent = 'Edit Hadits';
    document.getElementById('hadith-id').value = id;
    document.getElementById('hadith-text').value = hadith.text;
    document.getElementById('hadith-source').value = hadith.source;
    document.getElementById('hadith-active').checked = hadith.is_active;
  } else {
    title.textContent = 'Tambah Hadits';
    document.getElementById('hadith-id').value = '';
    document.getElementById('hadith-text').value = '';
    document.getElementById('hadith-source').value = '';
    document.getElementById('hadith-active').checked = true;
  }

  modal.classList.add('active');
}

function editHadith(id) {
  openHadithModal(id);
}

async function saveHadith() {
  const id = document.getElementById('hadith-id').value;
  const text = document.getElementById('hadith-text').value.trim();
  const source = document.getElementById('hadith-source').value.trim();
  const isActive = document.getElementById('hadith-active').checked ? 1 : 0;

  if (!text || !source) {
    showToast('Harap isi semua field', 'error');
    return;
  }

  try {
    if (id) {
      await fetch(`/api/hadiths/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, is_active: isActive })
      });
    } else {
      await fetch('/api/hadiths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source })
      });
    }

    closeModal('hadith-modal');
    fetchAllData();
    showToast('Hadits disimpan', 'success');
  } catch (error) {
    showToast('Gagal menyimpan hadits', 'error');
  }
}

async function toggleHadith(id, currentStatus) {
  const hadith = appData.hadiths.find(h => h.id === id);
  if (!hadith) return;

  try {
    await fetch(`/api/hadiths/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: hadith.text,
        source: hadith.source,
        is_active: currentStatus ? 0 : 1
      })
    });

    fetchAllData();
    showToast('Status hadits diperbarui', 'success');
  } catch (error) {
    showToast('Gagal memperbarui status', 'error');
  }
}

async function deleteHadith(id) {
  if (!confirm('Hapus hadits ini?')) return;

  try {
    await fetch(`/api/hadiths/${id}`, { method: 'DELETE' });
    fetchAllData();
    showToast('Hadits dihapus', 'success');
  } catch (error) {
    showToast('Gagal menghapus hadits', 'error');
  }
}

// ==================== ANNOUNCEMENTS ====================
function renderAnnouncements() {
  const container = document.getElementById('announcement-list');

  if (appData.announcements.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Belum ada pengumuman.</p>';
    return;
  }

  container.innerHTML = appData.announcements.map(ann => `
    <div class="announcement-item priority-${ann.priority}">
      <div class="announcement-header">
        <span class="announcement-title">${ann.title}</span>
        <div class="announcement-badges">
          <span class="badge badge-${ann.status}">${ann.status}</span>
          ${ann.priority !== 'normal' ? `<span class="badge badge-${ann.priority}">${ann.priority}</span>` : ''}
        </div>
      </div>
      <p class="announcement-content">${ann.content}</p>
      <div class="announcement-footer">
        <span class="announcement-date">${formatDate(ann.created_at)}${ann.expiry_date ? ` • Berakhir: ${formatDate(ann.expiry_date)}` : ''}</span>
        <div class="announcement-actions">
          <button class="btn btn-sm btn-secondary" onclick="editAnnouncement(${ann.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement(${ann.id})">🗑️ Hapus</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openAnnouncementModal(id = null) {
  const modal = document.getElementById('announcement-modal');
  const title = document.getElementById('announcement-modal-title');

  if (id) {
    const ann = appData.announcements.find(a => a.id === id);
    title.textContent = 'Edit Pengumuman';
    document.getElementById('announcement-id').value = id;
    document.getElementById('announcement-title').value = ann.title;
    document.getElementById('announcement-content').value = ann.content;
    document.getElementById('announcement-priority').value = ann.priority;
    document.getElementById('announcement-status').value = ann.status;
    document.getElementById('announcement-expiry').value = ann.expiry_date || '';
  } else {
    title.textContent = 'Pengumuman Baru';
    document.getElementById('announcement-id').value = '';
    document.getElementById('announcement-title').value = '';
    document.getElementById('announcement-content').value = '';
    document.getElementById('announcement-priority').value = 'normal';
    document.getElementById('announcement-status').value = 'draft';
    document.getElementById('announcement-expiry').value = '';
  }

  modal.classList.add('active');
}

function editAnnouncement(id) {
  openAnnouncementModal(id);
}

async function saveAnnouncement() {
  const id = document.getElementById('announcement-id').value;
  const title = document.getElementById('announcement-title').value.trim();
  const content = document.getElementById('announcement-content').value.trim();
  const priority = document.getElementById('announcement-priority').value;
  const status = document.getElementById('announcement-status').value;
  const expiry_date = document.getElementById('announcement-expiry').value || null;

  if (!title || !content) {
    showToast('Harap isi judul dan isi pengumuman', 'error');
    return;
  }

  try {
    if (id) {
      await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, priority, status, expiry_date })
      });
    } else {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, priority, status, expiry_date })
      });
    }

    closeModal('announcement-modal');
    fetchAllData();
    showToast('Pengumuman disimpan', 'success');
  } catch (error) {
    showToast('Gagal menyimpan pengumuman', 'error');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Hapus pengumuman ini?')) return;

  try {
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    fetchAllData();
    showToast('Pengumuman dihapus', 'success');
  } catch (error) {
    showToast('Gagal menghapus pengumuman', 'error');
  }
}

// ==================== DONATIONS ====================
function renderDonations() {
  const container = document.getElementById('donation-list');

  if (appData.donations.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Belum ada kategori donasi.</p>';
    return;
  }

  container.innerHTML = appData.donations.map(donation => {
    const hasTarget = donation.target > 0;
    const progress = hasTarget ? Math.min((donation.amount / donation.target) * 100, 100) : 0;
    const typeLabel = hasTarget ? 'Penggalangan' : 'Infaq Rutin';
    const typeClass = hasTarget ? 'badge-primary' : 'badge-secondary';

    return `
      <div class="donation-item">
        <div class="donation-header">
          <div>
            <span class="donation-category">${donation.category}</span>
            <span class="badge ${typeClass}" style="font-size: 0.7rem; margin-left: 0.5rem;">${typeLabel}</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="editDonation(${donation.id})">✏️ Edit</button>
        </div>
        <div class="donation-amount">${formatCurrency(donation.amount)}</div>
        ${hasTarget ? `
          <div class="donation-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
          <div class="donation-target">Target: ${formatCurrency(donation.target)} (${progress.toFixed(0)}%)</div>
        ` : ''}
        ${donation.description ? `<p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.5rem;">${donation.description}</p>` : ''}
        <div class="donation-actions">
          <button class="btn btn-sm btn-danger" onclick="deleteDonation(${donation.id})">🗑️ Hapus</button>
        </div>
      </div>
    `;
  }).join('');
}

function openDonationModal(id = null) {
  const modal = document.getElementById('donation-modal');
  const title = document.getElementById('donation-modal-title');
  const hasTargetCheckbox = document.getElementById('donation-has-target');
  const targetGroup = document.getElementById('donation-target-group');

  if (id) {
    const donation = appData.donations.find(d => d.id === id);
    title.textContent = 'Edit Donasi';
    document.getElementById('donation-id').value = id;
    document.getElementById('donation-category').value = donation.category;
    document.getElementById('donation-amount').value = formatNumberForInput(donation.amount);
    document.getElementById('donation-target').value = formatNumberForInput(donation.target || 0);
    document.getElementById('donation-description').value = donation.description || '';

    // Set checkbox based on whether target > 0
    const hasTarget = donation.target > 0;
    hasTargetCheckbox.checked = hasTarget;
    targetGroup.style.display = hasTarget ? 'block' : 'none';
  } else {
    title.textContent = 'Tambah Kategori Donasi';
    document.getElementById('donation-id').value = '';
    document.getElementById('donation-category').value = '';
    document.getElementById('donation-amount').value = '';
    document.getElementById('donation-target').value = '';
    document.getElementById('donation-description').value = '';

    // Default: no target (for infaq/recurring)
    hasTargetCheckbox.checked = false;
    targetGroup.style.display = 'none';
  }

  modal.classList.add('active');
}

function toggleDonationTarget() {
  const hasTarget = document.getElementById('donation-has-target').checked;
  const targetGroup = document.getElementById('donation-target-group');
  targetGroup.style.display = hasTarget ? 'block' : 'none';

  // Clear target value if unchecked
  if (!hasTarget) {
    document.getElementById('donation-target').value = '';
  }
}

function editDonation(id) {
  openDonationModal(id);
}

async function saveDonation() {
  const id = document.getElementById('donation-id').value;
  const category = document.getElementById('donation-category').value.trim();
  const amount = parseFormattedNumber(document.getElementById('donation-amount').value) || 0;
  const hasTarget = document.getElementById('donation-has-target').checked;
  const target = hasTarget ? (parseFormattedNumber(document.getElementById('donation-target').value) || 0) : 0;
  const description = document.getElementById('donation-description').value.trim();

  if (!category) {
    showToast('Harap isi kategori', 'error');
    return;
  }

  try {
    if (id) {
      await fetch(`/api/donations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount, target, description })
      });
    } else {
      await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount, target, description })
      });
    }

    closeModal('donation-modal');
    fetchAllData();
    showToast('Donasi disimpan', 'success');
  } catch (error) {
    showToast('Gagal menyimpan donasi', 'error');
  }
}

async function deleteDonation(id) {
  if (!confirm('Hapus kategori donasi ini?')) return;

  try {
    await fetch(`/api/donations/${id}`, { method: 'DELETE' });
    fetchAllData();
    showToast('Donasi dihapus', 'success');
  } catch (error) {
    showToast('Gagal menghapus donasi', 'error');
  }
}

// ==================== RUNNING TEXTS ====================
function renderRunningTexts() {
  const container = document.getElementById('running-text-list');

  if (appData.runningTexts.length === 0) {
    container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Belum ada teks berjalan.</p>';
    return;
  }

  container.innerHTML = appData.runningTexts.map(rt => `
    <div class="running-text-item ${rt.is_active ? '' : 'inactive'}">
      <span class="rt-category rt-category-${rt.category}">${rt.category}</span>
      <span class="rt-text">${rt.text}</span>
      <div class="rt-actions">
        <button class="btn btn-sm btn-secondary" onclick="editRunningText(${rt.id})">✏️</button>
        <button class="btn btn-sm ${rt.is_active ? 'btn-secondary' : 'btn-primary'}"
                onclick="toggleRunningText(${rt.id}, ${rt.is_active})">
          ${rt.is_active ? '👁️' : '👁️‍🗨️'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteRunningText(${rt.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openRunningTextModal(id = null) {
  const modal = document.getElementById('running-text-modal');
  const title = document.getElementById('running-text-modal-title');

  if (id) {
    const rt = appData.runningTexts.find(r => r.id === id);
    title.textContent = 'Edit Teks';
    document.getElementById('running-text-id').value = id;
    document.getElementById('running-text-input').value = rt.text;
    document.getElementById('running-text-category').value = rt.category;
    document.getElementById('running-text-priority').value = rt.priority;
    document.getElementById('running-text-active').checked = rt.is_active;
  } else {
    title.textContent = 'Tambah Teks Berjalan';
    document.getElementById('running-text-id').value = '';
    document.getElementById('running-text-input').value = '';
    document.getElementById('running-text-category').value = 'info';
    document.getElementById('running-text-priority').value = 0;
    document.getElementById('running-text-active').checked = true;
  }

  modal.classList.add('active');
}

function editRunningText(id) {
  openRunningTextModal(id);
}

async function saveRunningText() {
  const id = document.getElementById('running-text-id').value;
  const text = document.getElementById('running-text-input').value.trim();
  const category = document.getElementById('running-text-category').value;
  const priority = parseInt(document.getElementById('running-text-priority').value) || 0;
  const isActive = document.getElementById('running-text-active').checked ? 1 : 0;

  if (!text) {
    showToast('Harap isi teks', 'error');
    return;
  }

  try {
    if (id) {
      await fetch(`/api/running-texts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, category, priority, is_active: isActive })
      });
    } else {
      await fetch('/api/running-texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, category, priority })
      });
    }

    closeModal('running-text-modal');
    fetchAllData();
    showToast('Teks disimpan', 'success');
  } catch (error) {
    showToast('Gagal menyimpan teks', 'error');
  }
}

async function toggleRunningText(id, currentStatus) {
  const rt = appData.runningTexts.find(r => r.id === id);
  if (!rt) return;

  try {
    await fetch(`/api/running-texts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rt.text,
        category: rt.category,
        priority: rt.priority,
        is_active: currentStatus ? 0 : 1
      })
    });

    fetchAllData();
  } catch (error) {
    showToast('Gagal memperbarui status', 'error');
  }
}

async function deleteRunningText(id) {
  if (!confirm('Hapus teks ini?')) return;

  try {
    await fetch(`/api/running-texts/${id}`, { method: 'DELETE' });
    fetchAllData();
    showToast('Teks dihapus', 'success');
  } catch (error) {
    showToast('Gagal menghapus teks', 'error');
  }
}

// ==================== SETTINGS ====================
function populateSettings() {
  document.getElementById('setting-mosque-logo').value = appData.settings.mosque_logo || '🕌';
  document.getElementById('setting-mosque-name').value = appData.settings.mosque_name || '';
  document.getElementById('setting-mosque-tagline').value = appData.settings.mosque_tagline || '';
  document.getElementById('setting-mosque-address').value = appData.settings.mosque_address || '';
  document.getElementById('setting-mosque-phone').value = appData.settings.mosque_phone || '';

  // Font scale
  const fontScale = parseFloat(appData.settings.font_scale) || 1;
  document.getElementById('setting-font-scale').value = fontScale;
  updateFontScalePreview(fontScale);

  // Padding scale
  const paddingScale = parseFloat(appData.settings.padding_scale) || 1;
  document.getElementById('setting-padding-scale').value = paddingScale;
  updatePaddingScalePreview(paddingScale);

  // Layout theme
  document.getElementById('setting-display-layout').value = appData.settings.display_layout || 'default';

  // Time format
  document.getElementById('setting-time-format').value = appData.settings.time_format || '24h';

  // Logo image preview
  if (appData.settings.mosque_logo_image) {
    logoImageData = appData.settings.mosque_logo_image;
    document.getElementById('logo-preview').src = appData.settings.mosque_logo_image;
    document.getElementById('logo-preview').style.display = 'block';
    document.getElementById('clear-logo-btn').style.display = 'inline-flex';
    document.getElementById('logo-upload-label').innerHTML = '<span>📷</span> Ganti Logo';
  } else {
    logoImageData = '';
    document.getElementById('logo-preview').style.display = 'none';
    document.getElementById('clear-logo-btn').style.display = 'none';
    document.getElementById('logo-upload-label').innerHTML = '<span>📷</span> Upload Logo (PNG/JPG/SVG)';
  }

  document.getElementById('setting-hadith-interval').value = appData.settings.hadith_rotation_interval || 30;
  document.getElementById('setting-prayer-duration').value = appData.settings.prayer_duration || 15;
  document.getElementById('setting-iqomah-beep-seconds').value = appData.settings.iqomah_beep_seconds || 3;
  document.getElementById('setting-prayer-subtext').value = appData.settings.prayer_subtext || '';
  document.getElementById('setting-prayer-subtext-2').value = appData.settings.prayer_subtext_2 || '';
  document.getElementById('setting-show-live').checked = appData.settings.show_live_indicator === 'true';
  document.getElementById('setting-hide-prayer-icons').checked = appData.settings.hide_prayer_icons === 'true';

  // Prayer calculation settings
  document.getElementById('setting-prayer-calc-enabled').checked = appData.settings.prayer_calc_enabled === 'true';
  document.getElementById('setting-mosque-latitude').value = appData.settings.mosque_latitude || '-6.2088';
  document.getElementById('setting-mosque-longitude').value = appData.settings.mosque_longitude || '106.8456';
  document.getElementById('setting-prayer-calc-method').value = appData.settings.prayer_calc_method || 'Singapore';
  document.getElementById('setting-prayer-offset-subuh').value = appData.settings.prayer_offset_subuh || 0;
  document.getElementById('setting-prayer-offset-dzuhur').value = appData.settings.prayer_offset_dzuhur || 0;
  document.getElementById('setting-prayer-offset-ashar').value = appData.settings.prayer_offset_ashar || 0;
  document.getElementById('setting-prayer-offset-maghrib').value = appData.settings.prayer_offset_maghrib || 0;
  document.getElementById('setting-prayer-offset-isya').value = appData.settings.prayer_offset_isya || 0;

  // Set province and city dropdowns based on stored coordinates
  if (indonesiaCitiesData && appData.settings.mosque_latitude && appData.settings.mosque_longitude) {
    const lat = parseFloat(appData.settings.mosque_latitude);
    const lng = parseFloat(appData.settings.mosque_longitude);
    const matched = findCityByCoords(lat, lng);

    if (matched) {
      document.getElementById('setting-province').value = matched.provinceId;
      onProvinceChange();
      // Find and select the matching city
      setTimeout(() => {
        const citySelect = document.getElementById('setting-city');
        for (const option of citySelect.options) {
          if (option.value) {
            const coords = JSON.parse(option.value);
            if (Math.abs(coords.lat - matched.cityCoords.lat) < 0.01 &&
                Math.abs(coords.lng - matched.cityCoords.lng) < 0.01) {
              option.selected = true;
              break;
            }
          }
        }
      }, 100);
    }
  }

  // Imsak & Syuruq settings
  document.getElementById('setting-imsak-enabled').checked = appData.settings.imsak_enabled === 'true';
  document.getElementById('setting-imsak-label').value = appData.settings.imsak_label || 'Imsak';
  document.getElementById('setting-imsak-offset').value = appData.settings.imsak_offset || 10;
  document.getElementById('setting-syuruq-enabled').checked = appData.settings.syuruq_enabled === 'true';
  document.getElementById('setting-syuruq-label').value = appData.settings.syuruq_label || 'Syuruq';
  document.getElementById('setting-syuruq-offset').value = appData.settings.syuruq_offset || 20;
  document.getElementById('setting-optional-in-prayer-grid').checked = appData.settings.optional_in_prayer_grid === 'true';

  // Info block settings (Announcements & Donations)
  document.getElementById('setting-announcements-enabled').checked = appData.settings.announcements_enabled !== 'false'; // Default true
  document.getElementById('setting-announcements-limit').value = appData.settings.announcements_limit || '3';
  document.getElementById('setting-announcements-rotation').value = parseInt(appData.settings.announcements_rotation) || 10;
  document.getElementById('setting-donations-enabled').checked = appData.settings.donations_enabled !== 'false'; // Default true
  document.getElementById('setting-donations-limit').value = appData.settings.donations_limit || '6';
  document.getElementById('setting-donations-rotation').value = parseInt(appData.settings.donations_rotation) || 10;

  // Donation QR Code settings
  document.getElementById('setting-donation-qr-enabled').checked = appData.settings.donation_qr_enabled === 'true';
  if (appData.settings.donation_qr_image) {
    donationQRImageData = appData.settings.donation_qr_image;
    document.getElementById('donation-qr-preview').src = appData.settings.donation_qr_image;
    document.getElementById('donation-qr-preview').style.display = 'block';
    document.getElementById('clear-donation-qr-btn').style.display = 'inline-flex';
    document.getElementById('donation-qr-upload-label').innerHTML = '<span>📷</span> Ganti QR Code';
  } else {
    donationQRImageData = '';
    document.getElementById('donation-qr-preview').style.display = 'none';
    document.getElementById('clear-donation-qr-btn').style.display = 'none';
    document.getElementById('donation-qr-upload-label').innerHTML = '<span>📷</span> Upload QR Code';
  }

  // Fullscreen QR settings
  document.getElementById('setting-donation-qr-fullscreen-enabled').checked = appData.settings.donation_qr_fullscreen_enabled === 'true';
  document.getElementById('setting-donation-qr-fullscreen-only').checked = appData.settings.donation_qr_fullscreen_only === 'true';
  document.getElementById('setting-donation-qr-fullscreen-interval').value = parseInt(appData.settings.donation_qr_fullscreen_interval) || 10;
  toggleFullscreenQrOnlyVisibility();

  // Marquee settings
  document.getElementById('setting-marquee-loop').checked = appData.settings.marquee_loop !== 'false';
  document.getElementById('setting-marquee-speed').value = appData.settings.marquee_speed || 30;
  document.getElementById('setting-marquee-gap').value = appData.settings.marquee_gap || 4;

  // Performance settings (for low-RAM devices)
  document.getElementById('setting-disable-transitions').checked = appData.settings.disable_transitions === 'true';
  document.getElementById('setting-disable-marquee').checked = appData.settings.disable_marquee === 'true';

  // Ka'bah Video settings
  document.getElementById('setting-kabah-video-enabled').checked = appData.settings.kabah_video_enabled === 'true';
  document.getElementById('kabah-video-type-youtube').checked = appData.settings.kabah_video_type !== 'offline';
  document.getElementById('kabah-video-type-offline').checked = appData.settings.kabah_video_type === 'offline';
  document.getElementById('setting-kabah-video-url').value = appData.settings.kabah_video_url || '';
  document.getElementById('setting-kabah-video-fallback-timeout').value = appData.settings.kabah_video_fallback_timeout || '300';

  // Ka'bah fallback image preview
  if (appData.settings.kabah_video_fallback_image) {
    kabahFallbackImageData = appData.settings.kabah_video_fallback_image;
    document.getElementById('kabah-fallback-preview').src = kabahFallbackImageData;
    document.getElementById('kabah-fallback-preview').style.display = 'block';
    document.getElementById('clear-kabah-fallback-btn').style.display = 'inline-flex';
    document.getElementById('kabah-fallback-upload-label').innerHTML = '<span>📷</span> Ganti Gambar Fallback';
  } else {
    kabahFallbackImageData = '';
    document.getElementById('kabah-fallback-preview').style.display = 'none';
    document.getElementById('clear-kabah-fallback-btn').style.display = 'none';
    document.getElementById('kabah-fallback-upload-label').innerHTML = '<span>📷</span> Upload Gambar Fallback';
  }

  // YouTube Auto-Find Live Stream settings
  document.getElementById('setting-kabah-video-autofind-enabled').checked = appData.settings.kabah_video_autofind_enabled === 'true';
  document.getElementById('setting-kabah-video-autofind-api-key').value = appData.settings.kabah_video_autofind_api_key || '';
  document.getElementById('setting-kabah-video-autofind-keyword').value = appData.settings.kabah_video_autofind_keyword || 'live kaaba';
  toggleAutofindSettingsVisibility();

  // Background image
  if (appData.settings.background_image) {
    backgroundImageData = appData.settings.background_image;
    document.getElementById('bg-preview').src = backgroundImageData;
    document.getElementById('bg-preview').style.display = 'block';
    document.getElementById('clear-bg-btn').style.display = 'inline-flex';
    document.getElementById('bg-upload-label').innerHTML = '<span>📷</span> Ganti gambar';
  }

  // Background opacity
  const bgOpacity = parseFloat(appData.settings.background_opacity) || 0.15;
  document.getElementById('setting-background-opacity').value = bgOpacity;
  updateBackgroundOpacityPreview(bgOpacity);

  // Dark mode settings
  document.getElementById('setting-dark-mode-enabled').checked = appData.settings.dark_mode_enabled === 'true';
  document.getElementById('setting-dark-mode-style').value = appData.settings.dark_mode_style || 'soft';
  toggleDarkModeStyleVisibility();

  // Event Countdown settings
  document.getElementById('setting-event-countdown-enabled').checked = appData.settings.event_countdown_enabled === 'true';
  document.getElementById('setting-event-countdown-preset').value = appData.settings.event_countdown_preset || 'custom';
  document.getElementById('setting-event-countdown-custom-name').value = appData.settings.event_countdown_custom_name || '';
  document.getElementById('setting-event-countdown-custom-date').value = appData.settings.event_countdown_custom_date || '';
  onEventCountdownChange();
  onEventCountdownPresetChange();
}

// Preview prayer calculation
async function previewPrayerCalculation() {
  try {
    const response = await fetch('/api/prayers/calculate');
    const data = await response.json();

    const previewEl = document.getElementById('prayer-calc-preview');
    const contentEl = document.getElementById('prayer-calc-preview-content');

    contentEl.innerHTML = `
      <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">
        Metode: ${data.method} | Lokasi: ${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
        <div><strong>Subuh:</strong> ${formatTime(data.times.Subuh)}</div>
        <div><strong>Dzuhur:</strong> ${formatTime(data.times.Dzuhur)}</div>
        <div><strong>Ashar:</strong> ${formatTime(data.times.Ashar)}</div>
        <div><strong>Maghrib:</strong> ${formatTime(data.times.Maghrib)}</div>
        <div><strong>Isya:</strong> ${formatTime(data.times.Isya)}</div>
        <div><strong>Syuruq:</strong> ${formatTime(data.times.Syuruq)}</div>
      </div>
    `;

    previewEl.style.display = 'block';
  } catch (error) {
    showToast('Gagal memuat preview', 'error');
  }
}

// Sync calculated prayer times to database
async function syncPrayerTimes() {
  if (!confirm('Ini akan mengupdate jadwal sholat manual dengan hasil perhitungan otomatis. Lanjutkan?')) return;

  try {
    const response = await fetch('/api/prayers/sync', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      fetchAllData();
      showToast('Jadwal sholat berhasil disinkronkan', 'success');
    }
  } catch (error) {
    showToast('Gagal menyinkronkan jadwal', 'error');
  }
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    backgroundImageData = e.target.result;
    document.getElementById('bg-preview').src = backgroundImageData;
    document.getElementById('bg-preview').style.display = 'block';
    document.getElementById('clear-bg-btn').style.display = 'inline-flex';
    document.getElementById('bg-upload-label').innerHTML = `<span>📷</span> ${file.name}`;
  };
  reader.readAsDataURL(file);
}

function clearBackground() {
  backgroundImageData = '';
  document.getElementById('bg-preview').style.display = 'none';
  document.getElementById('clear-bg-btn').style.display = 'none';
  document.getElementById('bg-upload-label').innerHTML = '<span>📷</span> Pilih gambar atau klik di sini';
  document.getElementById('setting-background').value = '';
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    logoImageData = e.target.result;
    document.getElementById('logo-preview').src = logoImageData;
    document.getElementById('logo-preview').style.display = 'block';
    document.getElementById('clear-logo-btn').style.display = 'inline-flex';
    document.getElementById('logo-upload-label').innerHTML = '<span>📷</span> Ganti Logo';
  };
  reader.readAsDataURL(file);
}

function clearLogoImage() {
  logoImageData = '';
  document.getElementById('logo-preview').style.display = 'none';
  document.getElementById('clear-logo-btn').style.display = 'none';
  document.getElementById('logo-upload-label').innerHTML = '<span>📷</span> Upload Logo (PNG/JPG/SVG)';
  document.getElementById('setting-mosque-logo-image').value = '';
}

// Donation QR Code handlers
function handleDonationQRUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    donationQRImageData = e.target.result;
    document.getElementById('donation-qr-preview').src = donationQRImageData;
    document.getElementById('donation-qr-preview').style.display = 'block';
    document.getElementById('clear-donation-qr-btn').style.display = 'inline-flex';
    document.getElementById('donation-qr-upload-label').innerHTML = `<span>📷</span> ${file.name}`;
  };
  reader.readAsDataURL(file);
}

function clearDonationQR() {
  donationQRImageData = '';
  document.getElementById('donation-qr-preview').style.display = 'none';
  document.getElementById('clear-donation-qr-btn').style.display = 'none';
  document.getElementById('donation-qr-upload-label').innerHTML = '<span>📷</span> Upload QR Code';
  document.getElementById('setting-donation-qr-image').value = '';
}

// Ka'bah video fallback image handlers
function handleKabahFallbackUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    kabahFallbackImageData = e.target.result;
    document.getElementById('kabah-fallback-preview').src = kabahFallbackImageData;
    document.getElementById('kabah-fallback-preview').style.display = 'block';
    document.getElementById('clear-kabah-fallback-btn').style.display = 'inline-flex';
    document.getElementById('kabah-fallback-upload-label').innerHTML = `<span>📷</span> ${file.name}`;
  };
  reader.readAsDataURL(file);
}

function clearKabahFallback() {
  kabahFallbackImageData = '';
  document.getElementById('kabah-fallback-preview').style.display = 'none';
  document.getElementById('clear-kabah-fallback-btn').style.display = 'none';
  document.getElementById('kabah-fallback-upload-label').innerHTML = '<span>📷</span> Upload Gambar Fallback';
  document.getElementById('setting-kabah-fallback-image').value = '';
}

// Font scale preview
function updateFontScalePreview(value) {
  document.getElementById('font-scale-value').textContent = parseFloat(value).toFixed(1) + 'x';
}

// Padding scale preview
function updatePaddingScalePreview(value) {
  document.getElementById('padding-scale-value').textContent = parseFloat(value).toFixed(1) + 'x';
}

// Background opacity preview
function updateBackgroundOpacityPreview(value) {
  document.getElementById('background-opacity-value').textContent = Math.round(parseFloat(value) * 100) + '%';
}

// Dark mode style visibility toggle
function toggleDarkModeStyleVisibility() {
  const enabled = document.getElementById('setting-dark-mode-enabled').checked;
  const styleGroup = document.getElementById('dark-mode-style-group');
  styleGroup.style.display = enabled ? 'block' : 'none';
}

// Fullscreen QR "only" option visibility toggle
function toggleFullscreenQrOnlyVisibility() {
  const fullscreenEnabled = document.getElementById('setting-donation-qr-fullscreen-enabled').checked;
  const onlyGroup = document.getElementById('fullscreen-qr-only-group');
  onlyGroup.style.display = fullscreenEnabled ? 'block' : 'none';
}

// Auto-Find Live Stream settings visibility toggle
function toggleAutofindSettingsVisibility() {
  const enabled = document.getElementById('setting-kabah-video-autofind-enabled').checked;
  const group = document.getElementById('autofind-settings-group');
  group.style.display = enabled ? 'block' : 'none';
  document.getElementById('setting-kabah-video-url').disabled = enabled;
}

// Test Auto-Find YouTube live stream
async function testAutoFind() {
  const btn = document.getElementById('test-autofind-btn');
  const resultDiv = document.getElementById('autofind-test-result');
  const originalText = btn.innerHTML;

  const apiKey = document.getElementById('setting-kabah-video-autofind-api-key').value.trim();
  if (!apiKey) {
    showToast('Harap masukkan YouTube API Key terlebih dahulu', 'warning');
    return;
  }

  // Save settings first so the backend has the latest API key and keyword
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kabah_video_autofind_api_key: apiKey,
        kabah_video_autofind_keyword: document.getElementById('setting-kabah-video-autofind-keyword').value || 'live kaaba'
      })
    });
  } catch (e) {
    showToast('Gagal menyimpan pengaturan', 'error');
    return;
  }

  btn.innerHTML = '⏳ Mencari...';
  btn.disabled = true;

  try {
    await fetch('/api/youtube/find-live/cache-clear', { method: 'POST' });
    const response = await fetch('/api/youtube/find-live');
    const data = await response.json();

    if (!response.ok) {
      resultDiv.style.display = 'none';
      showToast(data.error || 'Gagal mencari live stream', 'error');
      return;
    }

    if (data.found) {
      document.getElementById('autofind-test-title').textContent = data.title;
      document.getElementById('autofind-test-channel').textContent = data.channelTitle;
      document.getElementById('autofind-test-url').textContent = data.url;

      const thumbnail = document.getElementById('autofind-test-thumbnail');
      if (data.thumbnail) {
        thumbnail.src = data.thumbnail;
        thumbnail.style.display = 'block';
      } else {
        thumbnail.style.display = 'none';
      }

      resultDiv.style.display = 'block';
      showToast(`Ditemukan: ${data.title}`, 'success');
    } else {
      resultDiv.style.display = 'none';
      showToast(data.message || 'Live stream tidak ditemukan', 'warning');
    }
  } catch (error) {
    resultDiv.style.display = 'none';
    showToast('Gagal menghubungi server. Pastikan server berjalan.', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ==================== EVENT COUNTDOWN HELPERS ====================
const islamicEventPresets = {
  idul_fitri:       { name: 'Idul Fitri',       hijriMonth: 10, hijriDay: 1 },
  idul_adha:        { name: 'Idul Adha',         hijriMonth: 12, hijriDay: 10 },
  maulid_nabi:      { name: 'Maulid Nabi',       hijriMonth: 3,  hijriDay: 12 },
  isra_miraj:       { name: "Isra Mi'raj",       hijriMonth: 7,  hijriDay: 27 },
  nuzulul_quran:    { name: 'Nuzulul Quran',     hijriMonth: 9,  hijriDay: 17 },
  tahun_baru_islam: { name: 'Tahun Baru Islam',  hijriMonth: 1,  hijriDay: 1 },
};

function calculateHijriDateApprox(gregorianDate) {
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();
  let jd;
  if (month <= 2) {
    const y = year - 1; const m = month + 12;
    jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day - 1524.5;
  } else {
    jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  jd = jd + b;
  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;
  return { year: hijriYear, month: hijriMonth - 1, day: hijriDay };
}

function findNextGregorianDate(targetHijriMonth, targetHijriDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + i);
    const hijri = calculateHijriDateApprox(testDate);
    if (hijri.month === targetHijriMonth - 1 && hijri.day === targetHijriDay) {
      return testDate;
    }
  }
  return null;
}

function onEventCountdownChange() {
  const enabled = document.getElementById('setting-event-countdown-enabled').checked;
  const group = document.getElementById('event-countdown-settings-group');
  group.style.display = enabled ? 'block' : 'none';
}

function onEventCountdownPresetChange() {
  const preset = document.getElementById('setting-event-countdown-preset').value;
  const customGroup = document.getElementById('event-countdown-custom-group');
  const customDateGroup = document.getElementById('event-countdown-custom-date-group');
  const previewDiv = document.getElementById('event-countdown-preview');
  const previewText = document.getElementById('event-countdown-preview-text');

  if (preset === 'custom') {
    customGroup.style.display = 'block';
    customDateGroup.style.display = 'block';
    previewDiv.style.display = 'none';
  } else {
    customGroup.style.display = 'none';
    customDateGroup.style.display = 'none';

    const eventInfo = islamicEventPresets[preset];
    if (eventInfo) {
      const nextDate = findNextGregorianDate(eventInfo.hijriMonth, eventInfo.hijriDay);
      if (nextDate) {
        const daysLeft = Math.ceil((nextDate - new Date(new Date().setHours(0,0,0,0))) / (1000 * 60 * 60 * 24));
        previewText.textContent = `${eventInfo.name} — ${nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${daysLeft} hari lagi)`;
        previewDiv.style.display = 'block';
      } else {
        previewDiv.style.display = 'none';
      }
    }
  }
}

// ==================== SAVE ALL ====================
document.getElementById('save-all-btn').addEventListener('click', async () => {
  const btn = document.getElementById('save-all-btn');
  const originalText = btn.innerHTML;

  btn.innerHTML = '<span class="btn-icon">⏳</span> Menyimpan...';
  btn.disabled = true;

  try {
    const settings = {
      mosque_logo: document.getElementById('setting-mosque-logo').value,
      mosque_name: document.getElementById('setting-mosque-name').value,
      mosque_tagline: document.getElementById('setting-mosque-tagline').value,
      mosque_address: document.getElementById('setting-mosque-address').value,
      mosque_phone: document.getElementById('setting-mosque-phone').value,
      hadith_rotation_interval: document.getElementById('setting-hadith-interval').value,
      prayer_duration: document.getElementById('setting-prayer-duration').value,
      jumat_prayer_duration: document.getElementById('setting-jumat-prayer-duration').value,
      iqomah_beep_seconds: document.getElementById('setting-iqomah-beep-seconds').value,
      prayer_subtext: document.getElementById('setting-prayer-subtext').value,
      prayer_subtext_2: document.getElementById('setting-prayer-subtext-2').value,
      // Prayer calculation settings
      prayer_calc_enabled: document.getElementById('setting-prayer-calc-enabled').checked ? 'true' : 'false',
      mosque_latitude: document.getElementById('setting-mosque-latitude').value,
      mosque_longitude: document.getElementById('setting-mosque-longitude').value,
      prayer_calc_method: document.getElementById('setting-prayer-calc-method').value,
      prayer_offset_subuh: document.getElementById('setting-prayer-offset-subuh').value,
      prayer_offset_dzuhur: document.getElementById('setting-prayer-offset-dzuhur').value,
      prayer_offset_ashar: document.getElementById('setting-prayer-offset-ashar').value,
      prayer_offset_maghrib: document.getElementById('setting-prayer-offset-maghrib').value,
      prayer_offset_isya: document.getElementById('setting-prayer-offset-isya').value,
      // Imsak & Syuruq settings
      imsak_enabled: document.getElementById('setting-imsak-enabled').checked ? 'true' : 'false',
      imsak_label: document.getElementById('setting-imsak-label').value,
      imsak_offset: document.getElementById('setting-imsak-offset').value,
      syuruq_enabled: document.getElementById('setting-syuruq-enabled').checked ? 'true' : 'false',
      syuruq_label: document.getElementById('setting-syuruq-label').value,
      syuruq_offset: document.getElementById('setting-syuruq-offset').value,
      optional_in_prayer_grid: document.getElementById('setting-optional-in-prayer-grid').checked ? 'true' : 'false',
      // Info block settings
      announcements_enabled: document.getElementById('setting-announcements-enabled').checked ? 'true' : 'false',
      announcements_limit: document.getElementById('setting-announcements-limit').value,
      announcements_rotation: document.getElementById('setting-announcements-rotation').value,
      donations_enabled: document.getElementById('setting-donations-enabled').checked ? 'true' : 'false',
      donations_limit: document.getElementById('setting-donations-limit').value,
      donations_rotation: document.getElementById('setting-donations-rotation').value,
      donation_qr_enabled: document.getElementById('setting-donation-qr-enabled').checked ? 'true' : 'false',
      donation_qr_fullscreen_enabled: document.getElementById('setting-donation-qr-fullscreen-enabled').checked ? 'true' : 'false',
      donation_qr_fullscreen_only: document.getElementById('setting-donation-qr-fullscreen-only').checked ? 'true' : 'false',
      donation_qr_fullscreen_interval: document.getElementById('setting-donation-qr-fullscreen-interval').value,
      show_live_indicator: document.getElementById('setting-show-live').checked ? 'true' : 'false',
      hide_prayer_icons: document.getElementById('setting-hide-prayer-icons').checked ? 'true' : 'false',
      time_format: document.getElementById('setting-time-format').value,
      font_scale: document.getElementById('setting-font-scale').value,
      padding_scale: document.getElementById('setting-padding-scale').value,
      display_layout: document.getElementById('setting-display-layout').value,
      marquee_loop: document.getElementById('setting-marquee-loop').checked ? 'true' : 'false',
      marquee_speed: document.getElementById('setting-marquee-speed').value,
      marquee_gap: document.getElementById('setting-marquee-gap').value,
      // Performance settings (for low-RAM devices)
      disable_transitions: document.getElementById('setting-disable-transitions').checked ? 'true' : 'false',
      disable_marquee: document.getElementById('setting-disable-marquee').checked ? 'true' : 'false',
      // Ka'bah video settings
      kabah_video_enabled: document.getElementById('setting-kabah-video-enabled').checked ? 'true' : 'false',
      kabah_video_type: document.querySelector('input[name="kabah-video-type"]:checked').value,
      kabah_video_url: document.getElementById('setting-kabah-video-url').value,
      // Ka'bah fallback image
      ...(kabahFallbackImageData !== appData.settings.kabah_video_fallback_image ? { kabah_video_fallback_image: kabahFallbackImageData } : {}),
      // Ka'bah fallback timeout
      kabah_video_fallback_timeout: document.getElementById('setting-kabah-video-fallback-timeout').value || '300',
      // YouTube Auto-Find Live Stream
      kabah_video_autofind_enabled: document.getElementById('setting-kabah-video-autofind-enabled').checked ? 'true' : 'false',
      kabah_video_autofind_keyword: document.getElementById('setting-kabah-video-autofind-keyword').value || 'live kaaba',
      kabah_video_autofind_api_key: document.getElementById('setting-kabah-video-autofind-api-key').value || '',
      // Dark mode settings
      dark_mode_enabled: document.getElementById('setting-dark-mode-enabled').checked ? 'true' : 'false',
      dark_mode_style: document.getElementById('setting-dark-mode-style').value,
      // Event Countdown settings
      event_countdown_enabled: document.getElementById('setting-event-countdown-enabled').checked ? 'true' : 'false',
      event_countdown_preset: document.getElementById('setting-event-countdown-preset').value,
      event_countdown_custom_name: document.getElementById('setting-event-countdown-custom-name').value,
      event_countdown_custom_date: document.getElementById('setting-event-countdown-custom-date').value
    };

    if (backgroundImageData !== appData.settings.background_image) {
      settings.background_image = backgroundImageData;
    }

    if (logoImageData !== appData.settings.mosque_logo_image) {
      settings.mosque_logo_image = logoImageData;
    }

    if (donationQRImageData !== appData.settings.donation_qr_image) {
      settings.donation_qr_image = donationQRImageData;
    }

    // Background opacity
    settings.background_opacity = document.getElementById('setting-background-opacity').value;

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    appData.settings = { ...appData.settings, ...settings };

    // Re-render prayers to reflect auto-calculation mode changes
    renderPrayers();

    showToast('Semua perubahan disimpan!', 'success');
  } catch (error) {
    showToast('Gagal menyimpan perubahan', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ==================== UTILITIES ====================
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-message');

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };

  toast.className = `toast ${type}`;
  icon.textContent = icons[type] || '✓';
  msg.textContent = message;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Format number input with thousand separators (Indonesian style: dots)
function formatCurrencyInput(input) {
  // Get cursor position
  const cursorPos = input.selectionStart;
  const oldLength = input.value.length;

  // Remove all non-digit characters
  let value = input.value.replace(/\D/g, '');

  // Parse to number and format with dots
  if (value) {
    const num = parseInt(value, 10);
    input.value = num.toLocaleString('id-ID');
  } else {
    input.value = '';
  }

  // Adjust cursor position
  const newLength = input.value.length;
  const diff = newLength - oldLength;
  input.setSelectionRange(cursorPos + diff, cursorPos + diff);
}

// Format number for input field display
function formatNumberForInput(num) {
  if (!num || num === 0) return '';
  return num.toLocaleString('id-ID');
}

// Parse formatted number string back to number
function parseFormattedNumber(str) {
  if (!str) return 0;
  // Remove thousand separators (dots in Indonesian format) and parse
  return parseInt(str.replace(/\./g, ''), 10) || 0;
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
});
