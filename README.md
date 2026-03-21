# Masjid Display System

A lightweight, web-based mosque display system for STB (Set-Top Box) devices.

## Features

- **Display Page** (`/display`): Fullscreen TV display with:
  - Clock and date
  - Prayer schedule (Subuh, Dzuhur, Ashar, Maghrib, Isya)
  - Countdown to next adzan
  - Iqomah countdown with beep alert
  - Calm mode during prayer
  - Running text ticker
  - Changeable background image

- **Admin Panel** (`/admin`): Mobile-friendly control panel to:
  - Set mosque name
  - Configure prayer times
  - Set iqomah duration per prayer
  - Edit running text message
  - Upload background image

## Installation

### Option 1: Docker (Recommended)

Using Docker Compose:

```bash
docker-compose up -d
```

Or using Docker directly:

```bash
docker build -t masjid-display .
docker run -d -p 3000:3000 -v masjid-data:/app/data -e TZ=Asia/Jakarta masjid-display
```

### Option 2: Manual Installation

1. Install Node.js on your device
2. Clone or copy this project
3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Usage

- **Display**: Open `http://<device-ip>:3000/display` in Chromium kiosk mode
- **Admin**: Open `http://<device-ip>:3000/admin` from your phone/laptop

## Auto-start on Boot (Armbian)

Create a systemd service:

```bash
sudo nano /etc/systemd/system/masjid-display.service
```

Content:
```ini
[Unit]
Description=Masjid Display System
After=network.target

[Service]
Type=simple
User=<your-username>
WorkingDirectory=/path/to/masjid-display-jws
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable masjid-display
sudo systemctl start masjid-display
```

## Kiosk Mode (Chromium)

Auto-start Chromium in kiosk mode:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=OverlayScrollbar http://localhost:3000/display
```

## Technology Stack

- **Backend**: Express.js + SQLite (better-sqlite3)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Port**: 3000
- **Timezone**: WIB (Asia/Jakarta, UTC+7)

## API Endpoints

- `GET /api/state` - Get all settings and prayer times
- `GET /api/settings` - Get settings only
- `POST /api/settings` - Update settings
- `GET /api/prayers` - Get all prayer times
- `PUT /api/prayers/:id` - Update prayer time

## License

MIT
