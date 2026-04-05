-- ============================================================
-- Migration 001: Add TDS Sensor Type
-- Run this after initial schema to add TDS sensor support
-- ============================================================

USE safs_db;

-- Add TDS sensor type
INSERT INTO sensor_types (type_name, unit, description, min_safe_value, max_safe_value) VALUES
  ('tds', 'ppm', 'Total Dissolved Solids sensor', 200.00, 400.00)
ON DUPLICATE KEY UPDATE type_name = type_name;

-- Add TDS sensors to existing tanks (sensor_type_id 4 = tds)
INSERT INTO sensors (tank_id, sensor_type_id, device_label, esp32_device_id, is_active) VALUES
  (1, 4, 'Alpha-TDS', 'ESP32-001-D', TRUE),
  (2, 4, 'Beta-TDS', 'ESP32-002-D', TRUE),
  (3, 4, 'Gamma-TDS', 'ESP32-003-D', TRUE)
ON DUPLICATE KEY UPDATE device_label = device_label;

-- Add TDS thresholds for existing tanks
INSERT INTO thresholds (tank_id, sensor_type_id, min_value, max_value, updated_by) VALUES
  (1, 4, 200.00, 400.00, 1),
  (2, 4, 200.00, 400.00, 1),
  (3, 4, 200.00, 400.00, 1)
ON DUPLICATE KEY UPDATE min_value = min_value;

-- Add sample TDS readings
INSERT INTO sensor_readings (sensor_id, tank_id, sensor_type_id, value, recorded_at) VALUES
  (10, 1, 4, 320.0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  (10, 1, 4, 315.0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (10, 1, 4, 325.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (10, 1, 4, 330.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (10, 1, 4, 318.0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (10, 1, 4, 322.0, NOW());
