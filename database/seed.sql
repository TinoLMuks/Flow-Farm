-- ============================================================
-- SAFS Seed Data
-- Run after safs_schema.sql to populate with demo data
-- ============================================================

USE safs_db;

-- Users (password_hash is bcrypt of 'password123')
INSERT INTO users (full_name, email, password_hash, phone_number, role_id, is_verified) VALUES
  ('Alexandra Mwondoka', 'alexandra@flowfarm.io', '$2b$10$xJ8Kz0Q1Z2Y3W4V5U6T7eOdC9B0A1M2N3P4Q5R6S7T8U9V0W1X2Y', '+263771234567', 1, TRUE),
  ('Tendai Moyo', 'tendai@flowfarm.io', '$2b$10$xJ8Kz0Q1Z2Y3W4V5U6T7eOdC9B0A1M2N3P4Q5R6S7T8U9V0W1X2Y', '+263772345678', 2, TRUE),
  ('Rumbidzai Choto', 'rumbi@flowfarm.io', '$2b$10$xJ8Kz0Q1Z2Y3W4V5U6T7eOdC9B0A1M2N3P4Q5R6S7T8U9V0W1X2Y', '+263773456789', 3, TRUE);

-- Tanks
INSERT INTO tanks (tank_name, location, description, fish_species, plant_types, capacity_litres, is_active, created_by) VALUES
  ('Tank Alpha', 'Greenhouse A', 'Primary tilapia production tank', 'Tilapia', 'Lettuce, Basil, Spinach', 5000.00, TRUE, 1),
  ('Tank Beta', 'Greenhouse A', 'Secondary grow-out tank', 'Tilapia', 'Tomatoes, Peppers', 3500.00, TRUE, 1),
  ('Tank Gamma', 'Greenhouse B', 'Fingerling nursery tank', 'Tilapia', 'Herbs, Kale', 2000.00, TRUE, 1);

-- Sensors (3 per tank: temperature, pH, water level)
INSERT INTO sensors (tank_id, sensor_type_id, device_label, esp32_device_id, is_active) VALUES
  (1, 1, 'Alpha-Temp', 'ESP32-001-T', TRUE),
  (1, 2, 'Alpha-pH', 'ESP32-001-P', TRUE),
  (1, 3, 'Alpha-Level', 'ESP32-001-L', TRUE),
  (2, 1, 'Beta-Temp', 'ESP32-002-T', TRUE),
  (2, 2, 'Beta-pH', 'ESP32-002-P', TRUE),
  (2, 3, 'Beta-Level', 'ESP32-002-L', TRUE),
  (3, 1, 'Gamma-Temp', 'ESP32-003-T', TRUE),
  (3, 2, 'Gamma-pH', 'ESP32-003-P', TRUE),
  (3, 3, 'Gamma-Level', 'ESP32-003-L', TRUE);

-- Thresholds per tank
INSERT INTO thresholds (tank_id, sensor_type_id, min_value, max_value, updated_by) VALUES
  (1, 1, 22.00, 28.00, 1),
  (1, 2, 6.80, 7.20, 1),
  (1, 3, 40.00, 90.00, 1),
  (2, 1, 22.00, 28.00, 1),
  (2, 2, 6.80, 7.20, 1),
  (2, 3, 40.00, 90.00, 1),
  (3, 1, 24.00, 30.00, 1),
  (3, 2, 6.80, 7.20, 1),
  (3, 3, 40.00, 90.00, 1);

-- Sensor readings (simulating a day of data for Tank Alpha)
INSERT INTO sensor_readings (sensor_id, tank_id, sensor_type_id, value, recorded_at) VALUES
  -- Temperature readings (sensor 1, tank 1, type 1)
  (1, 1, 1, 24.5, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  (1, 1, 1, 25.0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (1, 1, 1, 25.8, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (1, 1, 1, 26.2, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (1, 1, 1, 26.5, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (1, 1, 1, 26.0, NOW()),
  -- pH readings (sensor 2, tank 1, type 2)
  (2, 1, 2, 7.0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  (2, 1, 2, 7.1, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (2, 1, 2, 7.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (2, 1, 2, 6.9, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (2, 1, 2, 7.2, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (2, 1, 2, 7.1, NOW()),
  -- Water level readings (sensor 3, tank 1, type 3)
  (3, 1, 3, 72.0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
  (3, 1, 3, 70.5, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
  (3, 1, 3, 68.0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  (3, 1, 3, 65.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (3, 1, 3, 63.0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (3, 1, 3, 65.0, NOW()),
  -- Tank Beta readings
  (4, 2, 1, 25.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (4, 2, 1, 25.5, NOW()),
  (5, 2, 2, 7.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (5, 2, 2, 7.1, NOW()),
  (6, 2, 3, 78.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (6, 2, 3, 76.0, NOW()),
  -- Tank Gamma readings
  (7, 3, 1, 27.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (7, 3, 1, 27.5, NOW()),
  (8, 3, 2, 6.9, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (8, 3, 2, 7.0, NOW()),
  (9, 3, 3, 82.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (9, 3, 3, 80.0, NOW());

-- Alerts
INSERT INTO alerts (tank_id, sensor_type_id, reading_id, alert_type, message, value_recorded, threshold_min, threshold_max, status) VALUES
  (1, 2, 11, 'high', 'pH above safe range', 7.20, 6.80, 7.20, 'active'),
  (1, 3, 15, 'low', 'Water level dropping below optimal', 63.00, 40.00, 90.00, 'acknowledged');

-- Feeding schedules for Tank Alpha (8 intervals)
INSERT INTO feeding_schedules (tank_id, feed_time, feed_amount_g, feed_type, is_active, created_by) VALUES
  (1, '06:00:00', 150.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '08:30:00', 150.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '10:30:00', 120.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '12:30:00', 150.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '14:30:00', 120.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '16:30:00', 150.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '18:30:00', 120.00, 'Tilapia Pellets 3mm', TRUE, 1),
  (1, '20:00:00', 100.00, 'Tilapia Pellets 3mm', TRUE, 1);

-- Feeding logs
INSERT INTO feeding_logs (schedule_id, tank_id, fed_by, feed_amount_g, method, notes) VALUES
  (1, 1, 2, 150.00, 'automated', 'Morning feed completed'),
  (2, 1, 2, 150.00, 'automated', 'On schedule');

-- System health snapshots
INSERT INTO system_health (tank_id, overall_score, temp_status, ph_status, water_level_status) VALUES
  (1, 85, 'normal', 'normal', 'normal'),
  (2, 90, 'normal', 'normal', 'normal'),
  (3, 78, 'normal', 'normal', 'high');

-- Messages
INSERT INTO messages (sender_id, recipient_id, subject, body, is_read, message_type) VALUES
  (NULL, 1, 'pH Alert - Tank Alpha', 'pH reading of 7.2 detected on Tank Alpha. This is at the upper boundary of the safe range.', FALSE, 'alert'),
  (NULL, 1, 'Daily Report Ready', 'Your daily aquaponics system report for today is ready for review.', FALSE, 'system');

-- Audit log entries
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES
  (1, 'LOGIN', 'user', 1, '{"method": "email"}', '192.168.1.10'),
  (1, 'THRESHOLD_UPDATE', 'threshold', 1, '{"old_max": 30.00, "new_max": 28.00}', '192.168.1.10'),
  (2, 'FEEDING_LOG', 'feeding_log', 1, '{"method": "automated", "amount_g": 150}', '192.168.1.15');
