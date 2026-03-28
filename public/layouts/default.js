/**
 * Layout: Default (3 Kolom)
 *
 * Layout standar dengan 3 kolom:
 * - Kiri: Pengumuman & Donasi
 * - Tengah: Jam, Countdown, Iqomah
 * - Kanan: Video Ka'bah
 *
 * Elemen ID Contract:
 * Semua ID yang direferensikan oleh display.js harus ada di HTML ini.
 * Lihat display.js bagian "LAYOUT ELEMENT ID CONTRACT" untuk daftar lengkap.
 */

var MasjidLayout = {
  id: 'default',
  name: 'Default (3 Kolom)',
  description: 'Layout standar dengan 3 kolom: pengumuman/donasi, jam, dan video Ka\'bah',

  getHTML: function() {
    return `
  <!-- Background Image Overlay -->
  <div class="bg-overlay" id="bg-overlay"></div>

  <!-- Main Container -->
  <div class="main-container">

    <!-- ==================== HEADER SECTION ==================== -->
    <header class="header">
      <!-- Left: Logo & Mosque Name -->
      <div class="header-left">
        <div class="mosque-logo" id="mosque-logo">
          <img id="mosque-logo-img" class="mosque-logo-img" style="display: none;">
          <span id="mosque-logo-emoji">\uD83D\uDD4C</span>
        </div>
        <div class="mosque-name-wrapper">
          <h1 class="mosque-name" id="mosque-name">Masjid Al-Muhajirin</h1>
          <span class="mosque-tagline" id="mosque-tagline" style="display: none;"></span>
          <span class="mosque-address" id="mosque-address" style="display: none;"></span>
          <span class="mosque-phone" id="mosque-phone" style="display: none;"></span>
        </div>
      </div>

      <!-- Center: Date Display -->
      <div class="header-center">
        <div class="date-card">
          <div class="date-masehi" id="date-masehi">-</div>
          <div class="date-hijri" id="date-hijri">-</div>
        </div>
      </div>

      <!-- Right: Live Indicator -->
      <div class="header-right">
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span>LIVE</span>
        </div>
      </div>
    </header>

    <!-- ==================== 3-COLUMN MAIN SECTION ==================== -->
    <section class="main-three-column">

      <!-- Left Column: Announcements + Donations -->
      <div class="column-left">
        <div class="info-card card-announcements">
          <div class="info-card-header">
            <span class="info-card-icon">\uD83D\uDCE2</span>
            <h3 class="info-card-title">PENGUMUMAN</h3>
          </div>
          <div class="announcements-container" id="announcements-list">
            <span style="color: var(--color-text-muted); font-size: 0.8rem;">Memuat pengumuman...</span>
          </div>
        </div>

        <div class="info-card card-donations">
          <div class="info-card-header">
            <span class="info-card-icon">\u2764\uFE0F</span>
            <h3 class="info-card-title">DONASI</h3>
          </div>
          <div class="donations-wrapper" id="donations-wrapper">
            <div class="donations-container" id="donations-list">
              <span style="color: var(--color-text-muted); font-size: 0.8rem;">Memuat data donasi...</span>
            </div>
            <div class="donation-qr-section" id="donation-qr-section" style="display: none;">
              <div class="donation-qr-label">Scan untuk Donasi</div>
              <img class="donation-qr-image" id="donation-qr-image" alt="QR Code Donasi">
            </div>
          </div>
        </div>

        <!-- Fullscreen QR Display (for rotation mode) -->
        <div class="qr-fullscreen-display" id="qr-fullscreen-display">
          <div class="qr-fullscreen-content">
            <div class="qr-fullscreen-label">Scan untuk Donasi</div>
            <img class="qr-fullscreen-image" id="qr-fullscreen-image" alt="QR Code Donasi">
            <div class="qr-fullscreen-subtext" id="qr-fullscreen-subtext"></div>
          </div>
        </div>
      </div>

      <!-- Center Column: Clock + Countdown -->
      <div class="column-center">

        <!-- Main Clock -->
        <div class="clock-container">
          <div class="clock-time" id="current-time">00:00</div>
          <div class="clock-seconds" id="current-seconds">:00</div>
        </div>

        <!-- Countdown Pill -->
        <div class="countdown-pill" id="countdown-pill">
          <span class="countdown-label" id="countdown-label">Menuju Adzan Subuh</span>
          <span class="countdown-time" id="countdown-time">07:45:10</span>
        </div>

        <!-- Iqomah Section (Hidden by default) -->
        <div class="iqomah-section" id="iqomah-section" style="display: none;">
          <div class="iqomah-title">IQOMAH</div>
          <div class="iqomah-time" id="iqomah-time">10:00</div>
        </div>

        <!-- Prayer Progress Section (Hidden by default) -->
        <div class="prayer-progress" id="prayer-progress" style="display: none;">
          <div class="prayer-progress-icon">\uD83D\uDD4C</div>
          <div class="prayer-progress-text">SHOLAT <span id="current-prayer-name">SUBUH</span></div>
          <div class="prayer-progress-sub" id="prayer-subtext">Luruskan dan Rapatkan Shaf</div>
          <div class="prayer-progress-sub2" id="prayer-subtext-2"></div>
        </div>

      </div>

      <!-- Right Column: Ka'bah Video -->
      <div class="column-right">
        <div class="video-container" id="video-container">
          <div class="video-placeholder" id="video-placeholder">
            <div class="video-placeholder-icon">\uD83D\uDD4B</div>
            <div class="video-placeholder-text">
              VIDEO LIVE KA'BAH<br>
              <span style="opacity: 0.6">(OFF)</span>
            </div>
            <!-- Live indicator -->
            <div class="video-live-indicator">
              <span class="video-live-dot"></span>
              <span class="video-live-status" id="video-live-status">LIVE</span>
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- ==================== OPTIONAL TIMES SECTION ==================== -->
    <section class="optional-times-section" id="optional-times-section" style="display: none;">
      <div class="optional-times-grid" id="optional-times-grid">
        <!-- Imsak and Syuruq cards will be generated by JavaScript -->
      </div>
    </section>

    <!-- ==================== PRAYER GRID SECTION ==================== -->
    <section class="prayer-section">
      <div class="prayer-grid" id="prayer-grid">
        <!-- Prayer cards will be generated by JavaScript -->
      </div>
    </section>

    <!-- ==================== HADITH/INFO SECTION ==================== -->
    <section class="info-section">
      <div class="info-container">
        <div class="info-icon">\uD83D\uDCDC</div>
        <div class="info-content">
          <p class="info-text" id="info-text">"Sholat berjamaah lebih utama 27 derajat dibanding sholat sendirian."</p>
          <span class="info-source" id="info-source">\u2014 HR. Bukhari</span>
        </div>
      </div>
    </section>

    <!-- ==================== FOOTER - RUNNING TEXT ==================== -->
    <footer class="footer">
      <div class="marquee-container">
        <div class="marquee" id="marquee">
          <!-- Dynamic content loaded from API -->
        </div>
      </div>
    </footer>

  </div>

  <!-- Audio for notifications -->
  <audio id="beep-sound" preload="auto"></audio>
`;
  }
};
