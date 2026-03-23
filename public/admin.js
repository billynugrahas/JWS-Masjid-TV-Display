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
let indonesiaCitiesData = null;

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

    container.innerHTML = appData.prayers.map(prayer => `
      <div class="prayer-item" data-id="${prayer.id}">
        <span class="prayer-name">${prayer.name}</span>
        <div class="prayer-inputs">
          <div>
            <label>Waktu</label>
            <input type="time" value="${prayer.time}" onchange="updatePrayer(${prayer.id}, 'time', this.value)">
          </div>
          <div>
            <label>Iqomah (menit)</label>
            <input type="number" value="${prayer.iqomah_duration}" min="1" max="30"
                   onchange="updatePrayer(${prayer.id}, 'iqomah_duration', this.value)">
          </div>
        </div>
      </div>
    `).join('');
  }
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
          <div class="prayer-time">${data.times[name]}</div>
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
    const progress = donation.target > 0 ? Math.min((donation.amount / donation.target) * 100, 100) : 0;
    return `
      <div class="donation-item">
        <div class="donation-header">
          <span class="donation-category">${donation.category}</span>
          <button class="btn btn-sm btn-secondary" onclick="editDonation(${donation.id})">✏️ Edit</button>
        </div>
        <div class="donation-amount">${formatCurrency(donation.amount)}</div>
        ${donation.target > 0 ? `
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

  if (id) {
    const donation = appData.donations.find(d => d.id === id);
    title.textContent = 'Edit Donasi';
    document.getElementById('donation-id').value = id;
    document.getElementById('donation-category').value = donation.category;
    document.getElementById('donation-amount').value = donation.amount;
    document.getElementById('donation-target').value = donation.target;
    document.getElementById('donation-description').value = donation.description || '';
  } else {
    title.textContent = 'Tambah Kategori Donasi';
    document.getElementById('donation-id').value = '';
    document.getElementById('donation-category').value = '';
    document.getElementById('donation-amount').value = 0;
    document.getElementById('donation-target').value = 0;
    document.getElementById('donation-description').value = '';
  }

  modal.classList.add('active');
}

function editDonation(id) {
  openDonationModal(id);
}

async function saveDonation() {
  const id = document.getElementById('donation-id').value;
  const category = document.getElementById('donation-category').value.trim();
  const amount = parseFloat(document.getElementById('donation-amount').value) || 0;
  const target = parseFloat(document.getElementById('donation-target').value) || 0;
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
  document.getElementById('setting-hadith-interval').value = appData.settings.hadith_rotation_interval || 30;
  document.getElementById('setting-prayer-duration').value = appData.settings.prayer_duration || 15;
  document.getElementById('setting-prayer-subtext').value = appData.settings.prayer_subtext || '';
  document.getElementById('setting-prayer-subtext-2').value = appData.settings.prayer_subtext_2 || '';
  document.getElementById('setting-show-live').checked = appData.settings.show_live_indicator === 'true';

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

  // Marquee settings
  document.getElementById('setting-marquee-loop').checked = appData.settings.marquee_loop !== 'false';
  document.getElementById('setting-marquee-speed').value = appData.settings.marquee_speed || 30;
  document.getElementById('setting-marquee-gap').value = appData.settings.marquee_gap || 4;

  // Background image
  if (appData.settings.background_image) {
    backgroundImageData = appData.settings.background_image;
    document.getElementById('bg-preview').src = backgroundImageData;
    document.getElementById('bg-preview').style.display = 'block';
    document.getElementById('clear-bg-btn').style.display = 'inline-flex';
    document.getElementById('bg-upload-label').innerHTML = '<span>📷</span> Ganti gambar';
  }
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
        <div><strong>Subuh:</strong> ${data.times.Subuh}</div>
        <div><strong>Dzuhur:</strong> ${data.times.Dzuhur}</div>
        <div><strong>Ashar:</strong> ${data.times.Ashar}</div>
        <div><strong>Maghrib:</strong> ${data.times.Maghrib}</div>
        <div><strong>Isya:</strong> ${data.times.Isya}</div>
        <div><strong>Syuruq:</strong> ${data.times.Syuruq}</div>
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
      show_live_indicator: document.getElementById('setting-show-live').checked ? 'true' : 'false',
      marquee_loop: document.getElementById('setting-marquee-loop').checked ? 'true' : 'false',
      marquee_speed: document.getElementById('setting-marquee-speed').value,
      marquee_gap: document.getElementById('setting-marquee-gap').value
    };

    if (backgroundImageData !== appData.settings.background_image) {
      settings.background_image = backgroundImageData;
    }

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
