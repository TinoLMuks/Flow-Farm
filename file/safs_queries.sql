-- ============================================================
-- SAFS Backend Integration - Common Queries
-- For use with Node.js + Express backend
-- Author: Courtney Fradreck (DBA)
-- ============================================================

-- ============================================================
-- A. SENSOR DATA INGESTION (ESP32 → Backend)
-- Called when ESP32 sends JSON payload via HTTP POST
-- ============================================================

-- Insert new sensor reading
INSERT INTO sensor_readings (sensor_id, tank_id, sensor_type_id, value, recorded_at)
VALUES (?, ?, ?, ?, ?);

-- Check reading against thresholds (trigger alert if needed)
SELECT
    t.threshold_id,
    t.min_value,
    t.max_value,
    st.type_name
FROM thresholds t
JOIN sensor_types st ON t.sensor_type_id = st.sensor_type_id
WHERE t.tank_id = ? AND t.sensor_type_id = ?;

-- ============================================================
-- B. DASHBOARD QUERIES
-- ============================================================

-- B1. Top Cards: Latest readings for a tank
SELECT
    st.type_name,
    st.unit,
    sr.value,
    sr.recorded_at
FROM sensor_readings sr
JOIN sensor_types st ON sr.sensor_type_id = st.sensor_type_id
WHERE sr.tank_id = ?
    AND sr.recorded_at = (
        SELECT MAX(recorded_at)
        FROM sensor_readings
        WHERE tank_id = sr.tank_id AND sensor_type_id = sr.sensor_type_id
    );

-- B2. Performance Chart: Readings over time range (9am - 1pm example)
SELECT
    sr.recorded_at,
    st.type_name,
    sr.value
FROM sensor_readings sr
JOIN sensor_types st ON sr.sensor_type_id = st.sensor_type_id
WHERE sr.tank_id = ?
    AND sr.recorded_at BETWEEN ? AND ?
ORDER BY sr.recorded_at ASC;

-- B3. Alert Log Table (paginated)
SELECT
    a.alert_id,
    a.created_at,
    st.type_name AS sensor,
    a.message AS issue,
    a.value_recorded,
    st.unit,
    a.alert_type AS status
FROM alerts a
JOIN sensor_types st ON a.sensor_type_id = st.sensor_type_id
WHERE a.tank_id = ?
ORDER BY a.created_at DESC
LIMIT ? OFFSET ?;

-- B4. System Health Score
SELECT
    overall_score,
    temp_status,
    ph_status,
    water_level_status,
    snapshot_at
FROM system_health
WHERE tank_id = ?
ORDER BY snapshot_at DESC
LIMIT 1;

-- B5. Unread Message Count (sidebar badge)
SELECT COUNT(*) AS unread_count
FROM messages
WHERE recipient_id = ? AND is_read = FALSE;

-- ============================================================
-- C. AUTHENTICATION QUERIES
-- ============================================================

-- C1. Register new user
INSERT INTO users (full_name, email, password_hash, phone_number)
VALUES (?, ?, ?, ?);

-- C2. Login lookup
SELECT user_id, full_name, email, password_hash, role_id, is_verified
FROM users
WHERE email = ?;

-- C3. Google OAuth login/register
INSERT INTO users (full_name, email, google_id, is_verified, profile_image)
VALUES (?, ?, ?, TRUE, ?)
ON DUPLICATE KEY UPDATE
    google_id = VALUES(google_id),
    last_login = CURRENT_TIMESTAMP;

-- C4. Create password reset token
INSERT INTO password_resets (user_id, reset_token, expires_at)
VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- C5. Create SMS verification code
INSERT INTO verification_codes (user_id, code, code_type, expires_at)
VALUES (?, ?, 'sms', DATE_ADD(NOW(), INTERVAL 10 MINUTE));

-- C6. Validate verification code
SELECT code_id FROM verification_codes
WHERE user_id = ? AND code = ? AND used = FALSE AND expires_at > NOW();

-- ============================================================
-- D. FEEDING MANAGEMENT QUERIES
-- ============================================================

-- D1. Get today's feeding schedule for a tank
SELECT
    fs.schedule_id,
    fs.feed_time,
    fs.feed_amount_g,
    fs.feed_type,
    fl.fed_at IS NOT NULL AS is_completed
FROM feeding_schedules fs
LEFT JOIN feeding_logs fl ON fs.schedule_id = fl.schedule_id
    AND DATE(fl.fed_at) = CURDATE()
WHERE fs.tank_id = ? AND fs.is_active = TRUE
ORDER BY fs.feed_time;

-- D2. Log a feeding event
INSERT INTO feeding_logs (schedule_id, tank_id, fed_by, feed_amount_g, method, notes)
VALUES (?, ?, ?, ?, ?, ?);

-- ============================================================
-- E. HISTORICAL DATA & REPORTING QUERIES
-- ============================================================

-- E1. Daily averages for a sensor type (last 30 days)
SELECT
    DATE(recorded_at) AS reading_date,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value
FROM sensor_readings
WHERE tank_id = ? AND sensor_type_id = ?
    AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(recorded_at)
ORDER BY reading_date;

-- E2. Alert frequency by type (last 7 days)
SELECT
    st.type_name,
    a.alert_type,
    COUNT(*) AS alert_count
FROM alerts a
JOIN sensor_types st ON a.sensor_type_id = st.sensor_type_id
WHERE a.tank_id = ?
    AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY st.type_name, a.alert_type;

-- ============================================================
-- F. AUDIT LOGGING
-- ============================================================

-- Log any significant action
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
VALUES (?, ?, ?, ?, ?, ?);
