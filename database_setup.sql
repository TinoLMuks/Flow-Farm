-- ============================================================
--  FlowFarm Database Setup
--  Run this in MySQL Workbench or any MySQL client
--  Command: mysql -u root -p < database_setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS flowfarm;
USE flowfarm;

-- Tanks
CREATE TABLE IF NOT EXISTS tanks (
  tank_id    INT AUTO_INCREMENT PRIMARY KEY,
  tank_name  VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor types
CREATE TABLE IF NOT EXISTS sensor_types (
  sensor_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name      VARCHAR(50) NOT NULL,
  unit           VARCHAR(20)
);

-- Sensors
CREATE TABLE IF NOT EXISTS sensors (
  sensor_id      INT AUTO_INCREMENT PRIMARY KEY,
  tank_id        INT NOT NULL,
  sensor_type_id INT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
  FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id)
);

-- Sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
  reading_id     INT AUTO_INCREMENT PRIMARY KEY,
  sensor_id      INT NOT NULL,
  tank_id        INT NOT NULL,
  sensor_type_id INT NOT NULL,
  value          DECIMAL(10,3) NOT NULL,
  recorded_at    DATETIME NOT NULL,
  FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id),
  FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
  FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id)
);

-- Thresholds
CREATE TABLE IF NOT EXISTS thresholds (
  threshold_id   INT AUTO_INCREMENT PRIMARY KEY,
  tank_id        INT NOT NULL,
  sensor_type_id INT NOT NULL,
  min_value      DECIMAL(10,3),
  max_value      DECIMAL(10,3),
  FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
  FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  alert_id       INT AUTO_INCREMENT PRIMARY KEY,
  tank_id        INT NOT NULL,
  sensor_type_id INT NOT NULL,
  reading_id     INT,
  alert_type     VARCHAR(10) NOT NULL,
  message        TEXT,
  value_recorded DECIMAL(10,3),
  threshold_min  DECIMAL(10,3),
  threshold_max  DECIMAL(10,3),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tank_id) REFERENCES tanks(tank_id),
  FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(sensor_type_id)
);

-- ============================================================
--  SEED DATA — insert required lookup data
-- ============================================================

-- Sensor types (IDs must match SENSOR_TYPE_MAP in esp32.js)
INSERT INTO sensor_types (sensor_type_id, type_name, unit) VALUES
  (1, 'temperature', '°C'),
  (2, 'ph',          'pH'),
  (3, 'water_level', '%'),
  (4, 'tds',         'ppm')
ON DUPLICATE KEY UPDATE type_name=VALUES(type_name);

-- Your tank
INSERT INTO tanks (tank_id, tank_name) VALUES
  (1, 'Main Tank')
ON DUPLICATE KEY UPDATE tank_name=VALUES(tank_name);

-- Sensors for tank 1 (one per type)
INSERT INTO sensors (sensor_id, tank_id, sensor_type_id, is_active) VALUES
  (1, 1, 1, TRUE),  -- temperature
  (2, 1, 2, TRUE),  -- ph
  (3, 1, 3, TRUE),  -- water_level
  (4, 1, 4, TRUE)   -- tds
ON DUPLICATE KEY UPDATE is_active=TRUE;

-- Thresholds for tank 1
INSERT INTO thresholds (tank_id, sensor_type_id, min_value, max_value) VALUES
  (1, 1, 20.0,  28.0),   -- temperature: 20–28°C
  (1, 2,  6.0,   7.0),   -- ph: 6.0–7.0
  (1, 3, 20.0, 100.0),   -- water level: 20–100%
  (1, 4,  0.0, 400.0)    -- tds: 0–400ppm
ON DUPLICATE KEY UPDATE min_value=VALUES(min_value), max_value=VALUES(max_value);

-- ============================================================
--  Verify setup
-- ============================================================
SELECT 'tanks' as tbl, COUNT(*) as rows FROM tanks
UNION SELECT 'sensor_types', COUNT(*) FROM sensor_types
UNION SELECT 'sensors', COUNT(*) FROM sensors
UNION SELECT 'thresholds', COUNT(*) FROM thresholds;
