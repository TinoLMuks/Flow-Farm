-- ============================================================
-- Smart Aquaponics Farming System (SAFS)
-- Database Schema - MySQL
-- Author: Courtney Fradreck (Database Administrator)
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS safs_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE safs_db;

-- ============================================================
-- 1. ROLES TABLE
-- Supports RBAC (Role-Based Access Control)
-- ============================================================
CREATE TABLE roles (
    role_id       INT AUTO_INCREMENT PRIMARY KEY,
    role_name     VARCHAR(50) NOT NULL UNIQUE,
    description   VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_name, description) VALUES
  ('admin', 'Full system access, user management, and configuration'),
  ('operator', 'Can view dashboards, acknowledge alerts, and manage feeding schedules'),
  ('viewer', 'Read-only access to dashboards and reports');

-- ============================================================
-- 2. USERS TABLE
-- Matches Sign-in/Sign-up UI mockups (email/password + Google OAuth)
-- ============================================================
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),                     -- NULL if using Google OAuth only
    google_id       VARCHAR(255) UNIQUE,              -- Google OAuth identifier
    phone_number    VARCHAR(20),                      -- For SMS verification (Verify it's you screen)
    role_id         INT NOT NULL DEFAULT 2,           -- Default: operator
    is_verified     BOOLEAN DEFAULT FALSE,
    remember_token  VARCHAR(255),
    profile_image   VARCHAR(500),
    last_login      TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ============================================================
-- 3. PASSWORD RESETS TABLE
-- Supports Forgot Password flow from UI mockups
-- ============================================================
CREATE TABLE password_resets (
    reset_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    reset_token   VARCHAR(255) NOT NULL,
    expires_at    TIMESTAMP NOT NULL,
    used          BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. VERIFICATION CODES TABLE
-- Supports 6-digit SMS verification (Verify it's you screen)
-- ============================================================
CREATE TABLE verification_codes (
    code_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    code          VARCHAR(6) NOT NULL,
    code_type     ENUM('sms', 'email') DEFAULT 'sms',
    expires_at    TIMESTAMP NOT NULL,
    used          BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 5. TANKS TABLE
-- Represents individual aquaponics tank setups (scalability)
-- ============================================================
CREATE TABLE tanks (
    tank_id       INT AUTO_INCREMENT PRIMARY KEY,
    tank_name     VARCHAR(100) NOT NULL,
    location      VARCHAR(255),
    description   TEXT,
    fish_species  VARCHAR(100) DEFAULT 'Tilapia',
    plant_types   VARCHAR(255),
    capacity_litres DECIMAL(10,2),
    is_active     BOOLEAN DEFAULT TRUE,
    created_by    INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ============================================================
-- 6. SENSOR TYPES TABLE
-- Reference table for sensor categories
-- ============================================================
CREATE TABLE sensor_types (
    sensor_type_id  INT AUTO_INCREMENT PRIMARY KEY,
    type_name       VARCHAR(50) NOT NULL UNIQUE,     -- 'temperature', 'ph', 'water_level'
    unit            VARCHAR(20) NOT NULL,             -- '°C', 'pH', '%'
    description     VARCHAR(255),
    min_safe_value  DECIMAL(10,2),                    -- Default safe range lower bound
    max_safe_value  DECIMAL(10,2)                     -- Default safe range upper bound
);

INSERT INTO sensor_types (type_name, unit, description, min_safe_value, max_safe_value) VALUES
  ('temperature', '°C', 'Water temperature sensor', 20.00, 30.00),
  ('ph', 'pH', 'Water acidity/alkalinity sensor', 6.80, 7.20),
  ('water_level', '%', 'Tank water level sensor', 40.00, 100.00);

-- ============================================================
-- 7. SENSORS TABLE
-- Individual sensor devices linked to tanks
-- ============================================================
CREATE TABLE sensors (
    sensor_id       INT AUTO_INCREMENT PRIMARY KEY,
    tank_id         INT NOT NULL,
    sensor_type_id  INT NOT NULL,
    device_label    VARCHAR(100),                     -- e.g., 'Tank-1-pH'
    esp32_device_id VARCHAR(100),                     -- Links to ESP32 hardware
    is_active       BOOLEAN DEFAULT TRUE,
    installed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id)
);

-- ============================================================
-- 8. SENSOR READINGS TABLE (Core IoT Data)
-- High-frequency time-series data from ESP32
-- ============================================================
CREATE TABLE sensor_readings (
    reading_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id       INT NOT NULL,
    tank_id         INT NOT NULL,
    sensor_type_id  INT NOT NULL,
    value           DECIMAL(10,2) NOT NULL,
    recorded_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When backend received it
    FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id),
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
    FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id),
    INDEX idx_readings_tank_time (tank_id, recorded_at DESC),
    INDEX idx_readings_sensor_time (sensor_id, recorded_at DESC),
    INDEX idx_readings_type_time (sensor_type_id, recorded_at DESC)
);

-- ============================================================
-- 9. THRESHOLDS TABLE
-- Configurable alert thresholds per tank (overrides sensor_types defaults)
-- ============================================================
CREATE TABLE thresholds (
    threshold_id    INT AUTO_INCREMENT PRIMARY KEY,
    tank_id         INT NOT NULL,
    sensor_type_id  INT NOT NULL,
    min_value       DECIMAL(10,2) NOT NULL,
    max_value       DECIMAL(10,2) NOT NULL,
    updated_by      INT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),
    UNIQUE KEY uk_tank_sensor (tank_id, sensor_type_id)
);

-- ============================================================
-- 10. ALERTS TABLE
-- Generated when sensor readings breach thresholds
-- Matches dashboard "Recent Customers" (alert log) section
-- ============================================================
CREATE TABLE alerts (
    alert_id        INT AUTO_INCREMENT PRIMARY KEY,
    tank_id         INT NOT NULL,
    sensor_type_id  INT NOT NULL,
    reading_id      BIGINT,
    alert_type      ENUM('high', 'low', 'critical') NOT NULL,
    message         VARCHAR(255) NOT NULL,            -- e.g., 'pH above safe range'
    value_recorded  DECIMAL(10,2) NOT NULL,
    threshold_min   DECIMAL(10,2),
    threshold_max   DECIMAL(10,2),
    status          ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
    acknowledged_by INT,
    acknowledged_at TIMESTAMP NULL,
    resolved_at     TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
    FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id),
    FOREIGN KEY (reading_id) REFERENCES sensor_readings(reading_id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(user_id),
    INDEX idx_alerts_status (status, created_at DESC),
    INDEX idx_alerts_tank (tank_id, created_at DESC)
);

-- ============================================================
-- 11. FEEDING SCHEDULES TABLE
-- From requirements: ~8 feeding intervals per day
-- ============================================================
CREATE TABLE feeding_schedules (
    schedule_id     INT AUTO_INCREMENT PRIMARY KEY,
    tank_id         INT NOT NULL,
    feed_time       TIME NOT NULL,
    feed_amount_g   DECIMAL(8,2),                     -- Grams of feed
    feed_type       VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ============================================================
-- 12. FEEDING LOGS TABLE
-- Tracks actual feeding events (manual or automated)
-- ============================================================
CREATE TABLE feeding_logs (
    log_id          INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id     INT,
    tank_id         INT NOT NULL,
    fed_by          INT,                              -- NULL if automated
    feed_amount_g   DECIMAL(8,2),
    method          ENUM('manual', 'automated') DEFAULT 'manual',
    notes           TEXT,
    fed_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES feeding_schedules(schedule_id),
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
    FOREIGN KEY (fed_by) REFERENCES users(user_id)
);

-- ============================================================
-- 13. SYSTEM HEALTH TABLE
-- Aggregated system health snapshots (dashboard "System Health" card)
-- ============================================================
CREATE TABLE system_health (
    health_id       INT AUTO_INCREMENT PRIMARY KEY,
    tank_id         INT NOT NULL,
    overall_score   INT,                              -- Computed health score
    temp_status     ENUM('normal', 'high', 'low', 'critical') DEFAULT 'normal',
    ph_status       ENUM('normal', 'high', 'low', 'critical') DEFAULT 'normal',
    water_level_status ENUM('normal', 'high', 'low', 'critical') DEFAULT 'normal',
    snapshot_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
    INDEX idx_health_tank_time (tank_id, snapshot_at DESC)
);

-- ============================================================
-- 14. AUDIT LOG TABLE
-- Security: tracks all significant system actions
-- ============================================================
CREATE TABLE audit_log (
    log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT,
    action          VARCHAR(100) NOT NULL,            -- e.g., 'LOGIN', 'THRESHOLD_UPDATE', 'ALERT_ACK'
    entity_type     VARCHAR(50),                      -- e.g., 'user', 'threshold', 'alert'
    entity_id       INT,
    details         JSON,                             -- Additional context
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_audit_user (user_id, created_at DESC),
    INDEX idx_audit_action (action, created_at DESC)
);

-- ============================================================
-- 15. MESSAGES TABLE
-- Supports Messages feature from dashboard sidebar (notification count: 2)
-- ============================================================
CREATE TABLE messages (
    message_id      INT AUTO_INCREMENT PRIMARY KEY,
    sender_id       INT,                              -- NULL for system-generated messages
    recipient_id    INT NOT NULL,
    subject         VARCHAR(255),
    body            TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    message_type    ENUM('system', 'alert', 'user') DEFAULT 'system',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id),
    INDEX idx_messages_recipient (recipient_id, is_read, created_at DESC)
);

-- ============================================================
-- VIEWS: Pre-built queries for dashboard
-- ============================================================

-- Latest reading per sensor type per tank (dashboard top cards)
CREATE VIEW v_latest_readings AS
SELECT
    sr.tank_id,
    t.tank_name,
    st.type_name,
    st.unit,
    sr.value,
    sr.recorded_at
FROM sensor_readings sr
INNER JOIN (
    SELECT tank_id, sensor_type_id, MAX(recorded_at) AS max_time
    FROM sensor_readings
    GROUP BY tank_id, sensor_type_id
) latest ON sr.tank_id = latest.tank_id
    AND sr.sensor_type_id = latest.sensor_type_id
    AND sr.recorded_at = latest.max_time
JOIN tanks t ON sr.tank_id = t.tank_id
JOIN sensor_types st ON sr.sensor_type_id = st.sensor_type_id;

-- Alert history view (dashboard "Recent Customers" table)
CREATE VIEW v_alert_history AS
SELECT
    a.alert_id,
    a.created_at,
    st.type_name AS sensor,
    a.message AS issue,
    CONCAT(a.value_recorded, ' ', st.unit) AS display_value,
    a.alert_type AS status,
    a.status AS resolution_status,
    t.tank_name
FROM alerts a
JOIN sensor_types st ON a.sensor_type_id = st.sensor_type_id
JOIN tanks t ON a.tank_id = t.tank_id
ORDER BY a.created_at DESC;

-- Unread messages count per user (dashboard sidebar badge)
CREATE VIEW v_unread_messages AS
SELECT
    recipient_id AS user_id,
    COUNT(*) AS unread_count
FROM messages
WHERE is_read = FALSE
GROUP BY recipient_id;
