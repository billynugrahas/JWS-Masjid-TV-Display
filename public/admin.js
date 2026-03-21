let prayerTimes = [];
let backgroundData = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setupEventListeners();
});

// Fetch current data
async function fetchData() {
  try {
    const response = await fetch('/api/state');
    const data = await response.json();

    // Populate settings
    document.getElementById('mosque-name').value = data.settings.mosque_name || '';
    document.getElementById('running-text').value = data.settings.running_text || '';

    // Load background if exists
    if (data.settings.background_image) {
      backgroundData = data.settings.background_image;
      document.getElementById('background-preview').src = backgroundData;
      document.getElementById('background-preview').style.display = 'block';
      document.getElementById('clear-bg-btn').style.display = 'block';
      document.getElementById('file-label').textContent = 'Ganti gambar';
    }

    // Populate prayer times
    prayerTimes = data.prayers;
    renderPrayerTimes();
  } catch (error) {
    console.error('Error fetching data:', error);
    showError();
  }
}

// Render prayer times form
function renderPrayerTimes() {
  const container = document.getElementById('prayer-times-container');

  container.innerHTML = prayerTimes.map((prayer, index) => `
    <div class="prayer-row">
      <div class="prayer-name">${prayer.name}</div>
      <div class="form-group">
        <label>Waktu</label>
        <input type="time" id="prayer-time-${index}" value="${prayer.time}">
      </div>
      <div class="form-group">
        <label>Durasi Iqomah (menit)</label>
        <input type="number" id="prayer-iqomah-${index}" value="${prayer.iqomah_duration}" min="1" max="30">
      </div>
    </div>
  `).join('');
}

// Setup event listeners
function setupEventListeners() {
  // Form submit
  document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveAll();
  });

  // Background image upload
  document.getElementById('background-input').addEventListener('change', handleImageUpload);

  // Clear background
  document.getElementById('clear-bg-btn').addEventListener('click', () => {
    backgroundData = '';
    document.getElementById('background-preview').style.display = 'none';
    document.getElementById('clear-bg-btn').style.display = 'none';
    document.getElementById('file-label').textContent = 'Pilih gambar atau klik di sini';
  });
}

// Handle image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    backgroundData = event.target.result;
    document.getElementById('background-preview').src = backgroundData;
    document.getElementById('background-preview').style.display = 'block';
    document.getElementById('clear-bg-btn').style.display = 'block';
    document.getElementById('file-label').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

// Save all settings
async function saveAll() {
  try {
    // Save settings
    const settings = {
      mosque_name: document.getElementById('mosque-name').value,
      running_text: document.getElementById('running-text').value,
      background_image: backgroundData
    };

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    // Save prayer times
    for (let i = 0; i < prayerTimes.length; i++) {
      const time = document.getElementById(`prayer-time-${i}`).value;
      const iqomah = parseInt(document.getElementById(`prayer-iqomah-${i}`).value);

      await fetch(`/api/prayers/${prayerTimes[i].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: time,
          iqomah_duration: iqomah
        })
      });
    }

    showSuccess();
  } catch (error) {
    console.error('Error saving:', error);
    showError();
  }
}

// Show success message
function showSuccess() {
  const msg = document.getElementById('success-msg');
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}

// Show error message
function showError() {
  const msg = document.getElementById('error-msg');
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}
