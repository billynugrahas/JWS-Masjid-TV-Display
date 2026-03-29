/**
 * Layout: Modern Glass Broadcast (v2)
 *
 * Layout mewah dengan background video Ka'bah, glassmorphism cards,
 * header terpadu, sidebar mengambang, dan double footer marquee.
 *
 * Elemen ID Contract:
 * Semua ID yang direferensikan oleh display.js harus ada di HTML ini.
 * Lihat display.js bagian "LAYOUT ELEMENT ID CONTRACT" untuk daftar lengkap.
 */

var MasjidLayout = {
  id: 'modern-v2',
  name: 'Modern Glass Broadcast',
  description: 'Layout modern dengan background video, glassmorphism, header terpadu, dan double footer.',

  getHTML: function() {
    return `
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">

<!-- Background layers -->
<div class="bg-overlay" id="bg-overlay"></div>

<style>
  /* ==================== BASE ==================== */
  body.layout-modern-v2 {
    margin: 0;
    padding: 1.5rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f8fafc;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #064e3b;
    box-sizing: border-box;
  }
  body.layout-modern-v2 *, body.layout-modern-v2 *::before, body.layout-modern-v2 *::after {
    box-sizing: border-box;
  }

  /* ==================== CONTENT WRAPPER (video scope) ==================== */
  .mv2-content-wrapper {
    flex-grow: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 2rem;
  }

  /* ==================== VIDEO BACKGROUND (inside wrapper) ==================== */
  .mv2-video-bg {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
    pointer-events: none;
  }
  .mv2-video-bg iframe,
  .mv2-video-bg video {
    width: 100%; height: 100%;
    object-fit: cover;
    border: none;
    border-radius: 2rem;
  }
  .mv2-video-placeholder {
    display: none;
  }

  /* ==================== GLASS EFFECT ==================== */
  .mv2-glass {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 2rem;
  }

  /* ==================== HEADER ==================== */
  .mv2-header {
    width: 100%;
    padding: 1.25rem 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }
  .mv2-header-left {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    width: 25%;
  }
  .mv2-header-center {
    width: 50%;
    text-align: center;
  }
  .mv2-header-right {
    width: 25%;
    text-align: right;
  }

  /* Clock */
  .mv2-clock {
    font-size: 3.75rem;
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 1;
  }
  .mv2-clock-seconds {
    font-size: 1.875rem;
    font-weight: 300;
    opacity: 0.4;
    line-height: 1;
  }

  /* Mosque name area */
  .mv2-mosque-logo-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .mv2-mosque-name {
    font-size: 1.875rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }
  .mv2-mosque-tagline {
    font-size: 0.75rem;
    font-weight: 700;
    opacity: 0.6;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    display: block;
  }
  .mv2-mosque-logo-img {
    height: 2.5rem;
    width: auto;
  }
  .mv2-mosque-logo-emoji {
    font-size: 1.875rem;
  }

  /* Date */
  .mv2-date-masehi {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1f2937;
  }
  .mv2-date-hijri {
    font-size: 1rem;
    font-weight: 700;
    color: #047857;
  }

  /* Live indicator */
  .mv2-live-indicator {
    display: inline-flex;
    align-items: center;
    font-size: 0.625rem;
    font-weight: 900;
    background: #ef4444;
    color: #fff;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
    margin-top: 0.25rem;
    margin-left: auto;
    width: fit-content;
  }

  /* ==================== MAIN CONTENT ==================== */
  .mv2-main {
    flex-grow: 1;
    display: flex;
    align-items: flex-start;
    padding: 2rem 0;
    gap: 2rem;
    position: relative;
  }

  /* Left Sidebar - Combined */
  .mv2-sidebar {
    width: 18rem;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    z-index: 1;
    max-height: 100%;
    overflow: hidden;
  }
  .mv2-sidebar-card {
    padding: 1.5rem;
    flex-shrink: 0;
  }
  .mv2-sidebar-card.card-announcements {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .mv2-sidebar-card.card-donations {
    flex-shrink: 0;
  }
  .mv2-sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #d1fae5;
    padding-bottom: 0.5rem;
  }
  .mv2-sidebar-icon {
    font-size: 1.25rem;
  }
  .mv2-sidebar-title {
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.625rem;
    letter-spacing: 0.15em;
    color: #064e3b;
  }

  /* Center content */
  .mv2-center {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    width: 100%;
  }

  /* Iqomah */
  .mv2-iqomah {
    padding: 2rem 3rem;
    text-align: center;
  }
  .mv2-iqomah-label {
    font-size: 0.875rem;
    font-weight: 900;
    color: #dc2626;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 0.5rem;
  }
  .mv2-iqomah-time {
    font-size: 5rem;
    font-weight: 900;
    line-height: 1;
  }

  /* Prayer progress */
  .mv2-prayer-progress {
    padding: 2rem 3rem;
    text-align: center;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 300px;
    background: rgba(255, 255, 255, 0.95) !important;
    border: 3px solid #047857 !important;
    border-radius: 2rem;
  }
  .mv2-prayer-progress-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: block;
    animation: mv2-float 3s ease-in-out infinite;
  }
  @keyframes mv2-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .mv2-prayer-progress-title {
    font-size: 2.5rem;
    font-weight: 900;
    color: #022c22 !important;
    margin-bottom: 1rem;
    text-transform: uppercase;
    display: block;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .mv2-prayer-progress-title span {
    color: #047857 !important;
  }
  .mv2-prayer-progress-sub {
    font-size: 1.25rem;
    font-weight: 700;
    color: #064e3b !important;
    margin-bottom: 0.5rem;
    display: block;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .mv2-prayer-progress-sub2 {
    font-size: 1.125rem;
    color: #6b7280 !important;
    display: block;
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* ==================== LOWER SECTION ==================== */
  .mv2-lower {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    z-index: 10;
  }

  /* Countdown pill */
  .mv2-countdown-pill {
    padding: 0.5rem 2rem;
    display: none;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
    color: #fff;
    border-radius: 9999px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    animation: mv2-bounce 1s infinite;
  }
  .mv2-countdown-label {
    font-size: 0.625rem;
    font-weight: 900;
    text-transform: uppercase;
    color: #d1fae5;
    letter-spacing: 0.15em;
  }
  .mv2-countdown-time {
    font-size: 1.5rem;
    font-weight: 900;
    color: #fff;
  }
  @keyframes mv2-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  /* Optional times */
  .mv2-optional-times {
    width: 100%;
    display: none;
    justify-content: center;
  }
  .mv2-optional-times-grid {
    display: flex;
    gap: 1rem;
    justify-content: center;
    width: 100%;
  }

  /* Prayer grid */
  .mv2-prayer-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  /* Prayer cards - more opaque to cover video background */
  body.layout-modern-v2 .prayer-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  body.layout-modern-v2 .prayer-card .name {
    color: #064e3b;
  }
  body.layout-modern-v2 .prayer-card .time {
    color: #022c22;
  }
  body.layout-modern-v2 .prayer-card .iqomah {
    color: #6b7280;
  }
  body.layout-modern-v2 .prayer-card.active {
    background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
  }
  body.layout-modern-v2 .prayer-card.active .name {
    color: #fff;
  }
  body.layout-modern-v2 .prayer-card.active .time {
    color: #a7f3d0;
  }
  body.layout-modern-v2 .prayer-card.active .iqomah {
    color: rgba(255, 255, 255, 0.85);
  }
  body.layout-modern-v2 .prayer-card.optional-time {
    background: rgba(255, 255, 255, 0.85);
  }

  /* Footer marquee */
  .mv2-footer-area {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0;
  }

  /* Upper marquee bar */
  .mv2-marquee-bar {
    height: 2.25rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    overflow: hidden;
    border: none;
    background: #064e3b;
    color: #d1fae5;
    z-index: 10;
    flex-shrink: 0;
  }
  .mv2-marquee-content {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    font-size: 1.125rem;
    font-weight: 700;
    color: #d1fae5;
    padding: 0 1rem;
    gap: var(--marquee-gap, 4rem);
  }
  /* Animated marquee - content starts off-screen */
  body.layout-modern-v2 .mv2-marquee-content:not(.static) {
    padding-left: 100%;
    animation: marquee-seamless var(--marquee-speed, 30s) linear infinite;
  }
  @keyframes marquee-seamless {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  body.layout-modern-v2 .mv2-marquee-content.static {
    overflow: visible;
    width: auto;
    justify-content: center;
    text-align: center;
    flex-wrap: wrap;
    white-space: normal;
    gap: 0.5rem 1.5rem;
  }
  body.layout-modern-v2 .mv2-marquee-bar:has(.static) {
    overflow: visible;
    justify-content: center;
  }
  body.layout-modern-v2 .mv2-marquee-content.static .marquee-separator {
    display: none;
  }

  /* Lower marquee bar (hadith) */
  .mv2-hadith-bar {
    background: #022c22;
    color: #d1fae5;
    height: 2.5rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  .mv2-hadith-label {
    background: #047857;
    padding: 0 1.25rem;
    height: 100%;
    display: flex;
    align-items: center;
    font-weight: 900;
    font-size: 0.5625rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    z-index: 1;
    white-space: nowrap;
  }
  .mv2-hadith-content {
    width: 100%;
    padding: 0 1rem;
    overflow: hidden;
    font-style: italic;
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0.8;
  }

  /* ==================== QR FULLSCREEN (within sidebar) ==================== */
  .mv2-qr-fullscreen {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    text-align: center;
    width: 100%;
    flex: 1;
  }
  .mv2-qr-fullscreen-img {
    width: 100%;
    max-width: 14rem;
    height: auto;
    margin-bottom: 1rem;
    border-radius: 0.5rem;
  }
  .mv2-qr-fullscreen-text {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #022c22;
    letter-spacing: 0.05em;
  }
  /* Expand sidebar width when QR fullscreen is active */
  body.layout-modern-v2 .column-left.qr-fullscreen {
    width: 24rem;
  }
  /* Show fullscreen QR when parent has qr-fullscreen class */
  body.layout-modern-v2 .column-left.qr-fullscreen .mv2-qr-fullscreen {
    display: flex;
  }
  /* Hide sidebar cards when QR fullscreen is active */
  body.layout-modern-v2 .column-left.qr-fullscreen .mv2-sidebar-card {
    display: none;
  }

  /* ==================== DONATION QR ==================== */
  .mv2-donation-qr {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #ecfdf5;
    text-align: center;
    display: none;
  }
  /* Show donation QR when enabled */
  body.layout-modern-v2 .card-donations .mv2-donation-qr {
    display: block;
  }
  .mv2-donation-qr img {
    width: 8rem;
    margin: 0 auto;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .mv2-donation-qr-label {
    font-size: 0.5625rem;
    font-weight: 700;
    opacity: 0.5;
    text-transform: uppercase;
  }

  /* ==================== ANNOUNCEMENTS & DONATIONS LIST ==================== */
  .mv2-announcements-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(6, 78, 59, 0.8);
  }
  .mv2-donations-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* ==================== NO TRANSITIONS (low-RAM) ==================== */
  body.no-transitions.layout-modern-v2 .mv2-countdown-pill {
    animation: none;
  }
  /* Marquee tags on dark background */
  body.layout-modern-v2 .mv2-marquee-bar .marquee-tag {
    background: rgba(255, 255, 255, 0.15);
    color: #d1fae5;
  }
  body.layout-modern-v2 .mv2-marquee-bar .tag-donation {
    background: rgba(251, 191, 36, 0.25);
    color: #fcd34d;
  }
  body.layout-modern-v2 .mv2-marquee-bar .tag-announcement {
    background: rgba(52, 211, 153, 0.25);
    color: #a7f3d0;
  }
  body.layout-modern-v2 .mv2-marquee-bar .marquee-separator {
    color: rgba(255, 255, 255, 0.3);
  }

  body.no-transitions.layout-modern-v2 .mv2-marquee-content,
  body.no-transitions.layout-modern-v2 .mv2-hadith-content {
    animation: none;
  }

  /* ==================== STATE MANAGEMENT ==================== */
  body.adhan-mode.layout-modern-v2 .mv2-sidebar,
  body.adhan-mode.layout-modern-v2 .mv2-footer-area {
    display: none !important;
  }
  body.adhan-mode.layout-modern-v2 .mv2-main {
    justify-content: center;
  }

  body.calm-mode.layout-modern-v2 .mv2-header,
  body.calm-mode.layout-modern-v2 .mv2-sidebar,
  body.calm-mode.layout-modern-v2 .mv2-lower,
  body.calm-mode.layout-modern-v2 .mv2-marquee-bar,
  body.calm-mode.layout-modern-v2 .mv2-video-bg {
    filter: blur(10px);
    opacity: 0.3;
    pointer-events: none;
  }
  body.calm-mode.layout-modern-v2 #prayer-progress {
    display: flex !important;
    opacity: 1 !important;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    border: 3px solid #047857;
    border-radius: 2rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  body.calm-mode.layout-modern-v2 .mv2-prayer-progress-icon {
    color: #064e3b;
  }
  body.calm-mode.layout-modern-v2 .mv2-prayer-progress-title {
    color: #022c22 !important;
  }
  body.calm-mode.layout-modern-v2 .mv2-prayer-progress-sub {
    color: #064e3b !important;
  }
  body.calm-mode.layout-modern-v2 .mv2-prayer-progress-sub2 {
    color: #6b7280 !important;
  }
</style>

<!-- ==================== CONTENT WRAPPER (video scope) ==================== -->
<div class="mv2-content-wrapper">
  <!-- Video Background (covers main + lower) -->
  <div id="video-container" class="mv2-video-bg"></div>
  <div id="video-placeholder" class="mv2-video-placeholder"></div>

  <!-- ==================== HEADER ==================== -->
  <header class="mv2-glass mv2-header">
    <div class="mv2-header-left">
      <span id="current-time" class="mv2-clock">00:00</span>
      <span id="current-seconds" class="mv2-clock-seconds">:00</span>
    </div>

    <div class="mv2-header-center">
      <div class="mv2-mosque-logo-row">
        <img id="mosque-logo-img" class="mv2-mosque-logo-img" style="display: none;">
        <span id="mosque-logo-emoji" class="mv2-mosque-logo-emoji">\uD83D\uDD4C</span>
        <h1 id="mosque-name" class="mv2-mosque-name">Masjid</h1>
      </div>
      <span id="mosque-tagline" class="mv2-mosque-tagline"></span>
      <span id="mosque-address" style="display: none;"></span>
      <span id="mosque-phone" style="display: none;"></span>
    </div>

    <div class="mv2-header-right">
      <div id="date-masehi" class="mv2-date-masehi">Date</div>
      <div id="date-hijri" class="mv2-date-hijri">Hijri</div>
      <div class="live-indicator mv2-live-indicator">\u25CF LIVE</div>
    </div>
  </header>

  <!-- ==================== MAIN CONTENT ==================== -->
  <main class="mv2-main">
    <!-- Left Sidebar: Announcements + Donations (Combined) -->
    <div class="column-left mv2-sidebar">
      <div class="mv2-glass mv2-sidebar-card card-announcements">
        <div class="mv2-sidebar-header">
          <span class="mv2-sidebar-icon">\uD83D\uDCE2</span>
          <h3 class="mv2-sidebar-title">Pengumuman</h3>
        </div>
        <div id="announcements-list" class="mv2-announcements-list">
          <span style="color: #6b7280; font-size: 0.8rem;">Memuat pengumuman...</span>
        </div>
      </div>

      <div class="mv2-glass mv2-sidebar-card card-donations">
        <div class="mv2-sidebar-header">
          <span class="mv2-sidebar-icon">\u2764\uFE0F</span>
          <h3 class="mv2-sidebar-title">Donasi</h3>
        </div>
        <div id="donations-wrapper">
          <div id="donations-list" class="mv2-donations-list">
            <span style="color: #6b7280; font-size: 0.8rem;">Memuat data donasi...</span>
          </div>
          <div id="donation-qr-section" class="mv2-donation-qr">
            <img id="donation-qr-image" alt="QR Code Donasi">
            <p class="mv2-donation-qr-label">Scan untuk Donasi</p>
          </div>
        </div>
      </div>

      <!-- Fullscreen QR Display (for rotation mode) - must be inside column-left -->
      <div id="qr-fullscreen-display" class="mv2-glass mv2-qr-fullscreen">
        <img id="qr-fullscreen-image" class="mv2-qr-fullscreen-img">
        <div id="qr-fullscreen-subtext" class="mv2-qr-fullscreen-text"></div>
      </div>
    </div>

    <!-- Center: Iqomah & Prayer Progress -->
    <div class="mv2-center">
      <div id="iqomah-section" class="mv2-glass mv2-iqomah" style="display: none;">
        <div class="mv2-iqomah-label">Iqomah</div>
        <div id="iqomah-time" class="mv2-iqomah-time">00:00</div>
      </div>

      <div id="prayer-progress" class="mv2-glass mv2-prayer-progress">
        <div class="mv2-prayer-progress-icon">🕌</div>
        <div class="mv2-prayer-progress-title">SHOLAT <span id="current-prayer-name"></span></div>
        <div id="prayer-subtext" class="mv2-prayer-progress-sub"></div>
        <div id="prayer-subtext-2" class="mv2-prayer-progress-sub2"></div>
      </div>
    </div>
  </main>

  <!-- ==================== LOWER SECTION ==================== -->
  <section class="mv2-lower">
    <!-- Countdown Pill -->
    <div id="countdown-pill" class="mv2-countdown-pill">
      <span id="countdown-label" class="mv2-countdown-label">Menuju</span>
      <span id="countdown-time" class="mv2-countdown-time">00:00:00</span>
    </div>

    <!-- Optional Times -->
    <div id="optional-times-section" class="mv2-optional-times">
      <div id="optional-times-grid" class="mv2-optional-times-grid"></div>
    </div>

    <!-- Prayer Grid -->
    <div id="prayer-grid" class="mv2-prayer-grid"></div>
  </section>

  <!-- Upper Marquee Bar (inside wrapper - with video background) -->
  <div class="mv2-marquee-bar">
    <div id="marquee" class="mv2-marquee-content"></div>
  </div>
</div>

<!-- Hadith Bar (outside wrapper - no video) -->
<div class="mv2-footer-area">
  <div class="mv2-hadith-bar">
    <div class="mv2-hadith-label">HADITS HARI INI</div>
    <div class="mv2-hadith-content">
      <span id="info-text"></span> <span id="info-source" style="font-weight: 700;"></span>
    </div>
  </div>
</div>

<!-- Audio -->
<audio id="beep-sound" preload="auto"></audio>
`;
  }
};
