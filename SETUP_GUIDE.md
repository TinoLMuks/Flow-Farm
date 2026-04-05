# FlowFarm Aquaponics Monitoring System - Setup Guide

This guide will help you set up the complete real-time monitoring system with your ESP32 and Raspberry Pi.

## System Architecture

```
┌─────────────┐      HTTP POST       ┌─────────────────────┐      WebSocket      ┌─────────────┐
│   ESP32     │ ──────────────────▶  │   Raspberry Pi      │ ◀──────────────────▶ │  Dashboard  │
│  (Sensors)  │    Every 5 seconds   │  (Node.js Server)   │     Real-time        │  (Browser)  │
└─────────────┘                      └─────────────────────┘                      └─────────────┘
                                              │
                                              ▼
                                     ┌─────────────────────┐
                                     │   MySQL Database    │
                                     │   + Resend Email    │
                                     └─────────────────────┘
```

## Step 1: Database Setup (Raspberry Pi)

### 1.1 Install MySQL
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 1.2 Create Database and Tables
```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE IF NOT EXISTS safs_db;
USE safs_db;
SOURCE /path/to/file/safs_schema.sql;
```

### 1.3 Add TDS Sensor Support
```bash
mysql -u root -p safs_db < /path/to/database/migrations/001_add_tds_sensor.sql
```

## Step 2: Backend Server Setup (Raspberry Pi)

### 2.1 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.2 Clone the Project
```bash
git clone https://github.com/TinoLMuks/Flow-Farm.git
cd Flow-Farm
npm install
```

### 2.3 Configure Environment
Create a `.env` file:
```bash
cp .env.example .env
nano .env
```

Update with your values:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=safs_db

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email Alerts (get key from https://resend.com)
RESEND_API_KEY=re_your_api_key_here
ALERT_EMAIL_TO=your-email@example.com
ALERT_EMAIL_FROM=FlowFarm Alerts <onboarding@resend.dev>
```

### 2.4 Start the Server
```bash
# Development
npm run server

# Production (with PM2)
npm install -g pm2
pm2 start server.js --name flowfarm-api
pm2 save
pm2 startup
```

### 2.5 Find Your Pi's IP Address
```bash
hostname -I
```
Note this IP (e.g., `192.168.1.100`) - you'll need it for the ESP32.

## Step 3: ESP32 Setup

### 3.1 Install Required Libraries
In Arduino IDE, go to **Sketch > Include Library > Manage Libraries** and install:
- `OneWire` by Jim Studt
- `DallasTemperature` by Miles Burton
- `ArduinoJson` by Benoit Blanchon

### 3.2 Configure the ESP32 Code
Open `esp32/flowfarm_esp32.ino` and update these values:

```cpp
// WiFi - Your network credentials
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASS = "YourWiFiPassword";

// Server - Your Raspberry Pi's IP address
const char* SERVER_URL = "http://192.168.1.100:5000/api/esp32/data";

// Device - Unique ID for this ESP32
const char* DEVICE_ID = "ESP32-001";
const int TANK_ID = 1;
```

### 3.3 Calibrate Sensors

**pH Sensor Calibration:**
1. Put sensor in pH 7 buffer solution
2. Read voltage from Serial Monitor
3. Put sensor in pH 4 buffer solution
4. Read voltage from Serial Monitor
5. Update these values:
```cpp
const float PH_VOLTAGE_AT_7 = 2.20;  // Your pH 7 voltage
const float PH_VOLTAGE_AT_4 = 3.00;  // Your pH 4 voltage
```

**Water Level Calibration:**
1. With sensor dry, read raw value from Serial Monitor
2. With sensor fully submerged, read raw value
3. Update these values:
```cpp
const int LEVEL_RAW_MIN = 640;   // Your dry reading
const int LEVEL_RAW_MAX = 3200;  // Your submerged reading
```

### 3.4 Upload to ESP32
1. Select your ESP32 board in Arduino IDE
2. Select the correct COM port
3. Click Upload

### 3.5 Verify Connection
Open Serial Monitor (115200 baud). You should see:
```
╔═══════════════════════════════════════════╗
║     FLOWFARM AQUAPONICS MONITOR           ║
╚═══════════════════════════════════════════╝

WiFi connected! IP: 192.168.1.xxx
Checking server connection... OK!

========== READING SENSORS ==========
[TEMP] 25.50 C
[pH]  voltage=2.15V  pH=7.05
[TDS] voltage=1.25V  TDS=320 ppm
[LVL] raw=2100  level=65.0%
[HTTP] Response code: 201
[OK] Data sent successfully!
```

## Step 4: Frontend Dashboard

### 4.1 Create Frontend Environment
Create `frontend/.env` (or in project root if using Vite):
```env
VITE_API_URL=http://192.168.1.100:5000/api
VITE_SOCKET_URL=http://192.168.1.100:5000
```

### 4.2 Start the Dashboard
```bash
npm run dev
```

Access at `http://localhost:5173`

## Step 5: Email Alerts Setup

### 5.1 Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up for free (100 emails/day)
3. Go to API Keys and create a new key
4. Copy the key to your `.env` file

### 5.2 Configure Alert Recipients
In `.env`:
```env
# Single recipient
ALERT_EMAIL_TO=you@example.com

# Multiple recipients (comma-separated)
ALERT_EMAIL_TO=you@example.com,team@example.com
```

### 5.3 Test Email
```bash
curl -X POST http://localhost:5000/api/esp32/data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "TEST",
    "tank_id": 1,
    "readings": {
      "temperature": 35,
      "ph": 5.0
    }
  }'
```

If temperature exceeds threshold, you should receive an email!

## Step 6: Configure Thresholds

1. Open the dashboard
2. Go to **Settings** (sidebar)
3. Adjust min/max thresholds for each sensor
4. Click **Save Changes**

## Troubleshooting

### ESP32 not sending data
- Check WiFi credentials
- Verify server IP address is correct
- Ensure server is running: `curl http://YOUR_PI_IP:5000/api/esp32/status`

### Dashboard not updating in real-time
- Check WebSocket connection status (green dot in header)
- Verify `VITE_SOCKET_URL` matches your server address
- Check browser console for errors

### Not receiving email alerts
- Verify `RESEND_API_KEY` is set correctly
- Check `ALERT_EMAIL_TO` is set
- Email cooldown is 5 minutes between same alerts
- Check server logs for email errors

### Database connection failed
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/esp32/data` | POST | Receive sensor data from ESP32 |
| `/api/esp32/status` | GET | Health check for ESP32 |
| `/api/esp32/config/:tankId` | GET | Get thresholds for ESP32 local checking |
| `/api/sensors/readings/latest/:tankId` | GET | Get latest readings |
| `/api/thresholds/:tankId` | GET | Get all thresholds |
| `/api/thresholds/:tankId/:sensorTypeId` | PUT | Update a threshold |

## Running as a Service (Production)

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start both frontend and backend
pm2 start server.js --name flowfarm-api
pm2 start npm --name flowfarm-dashboard -- run dev

# Save and enable startup
pm2 save
pm2 startup
```

### Using systemd
Create `/etc/systemd/system/flowfarm.service`:
```ini
[Unit]
Description=FlowFarm Aquaponics API
After=network.target mysql.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Flow-Farm
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable flowfarm
sudo systemctl start flowfarm
```

---

Need help? Open an issue on GitHub or check the logs:
```bash
# Server logs (PM2)
pm2 logs flowfarm-api

# Server logs (systemd)
sudo journalctl -u flowfarm -f
```
