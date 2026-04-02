/**
 * ESP32 Data Ingestion Endpoint
 * 
 * This route handles incoming sensor data from ESP32 devices.
 * It stores readings, checks thresholds, creates alerts, and emits real-time updates.
 * 
 * Endpoint: POST /api/esp32/data
 * 
 * Expected payload from ESP32:
 * {
 *   "device_id": "ESP32-001",
 *   "tank_id": 1,
 *   "readings": {
 *     "temperature": 25.5,
 *     "ph": 7.1,
 *     "tds": 320,
 *     "water_level": 65.0
 *   }
 * }
 */

const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');
const { sendAlertEmail } = require('../services/emailService');

// Map sensor type names to their IDs (must match database)
const SENSOR_TYPE_MAP = {
  'temperature': 1,
  'ph': 2,
  'water_level': 3,
  'tds': 4
};

// Cooldown tracking to prevent email spam (in-memory, reset on server restart)
const alertCooldowns = new Map();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between same alert emails

// Validation schema for ESP32 data
const esp32DataSchema = z.object({
  device_id: z.string().min(1),
  tank_id: z.number().int().positive(),
  readings: z.object({
    temperature: z.number().optional(),
    ph: z.number().optional(),
    tds: z.number().optional(),
    water_level: z.number().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one sensor reading is required"
  })
});

/**
 * Check if we should send an alert email (cooldown logic)
 */
function shouldSendEmail(tankId, sensorType, alertType) {
  const key = `${tankId}-${sensorType}-${alertType}`;
  const lastSent = alertCooldowns.get(key);
  const now = Date.now();
  
  if (!lastSent || (now - lastSent) > ALERT_COOLDOWN_MS) {
    alertCooldowns.set(key, now);
    return true;
  }
  return false;
}

/**
 * POST /api/esp32/data
 * Main endpoint for ESP32 to send sensor readings
 */
router.post('/data', async (req, res) => {
  const io = req.app.get('io');
  
  try {
    // Validate incoming data
    const data = esp32DataSchema.parse(req.body);
    const { device_id, tank_id, readings } = data;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const results = {
      readings_stored: [],
      alerts_created: [],
      emails_sent: []
    };

    // Get tank info for email alerts
    const [tankRows] = await pool.execute(
      'SELECT tank_name FROM tanks WHERE tank_id = ?',
      [tank_id]
    );
    const tankName = tankRows.length > 0 ? tankRows[0].tank_name : `Tank ${tank_id}`;

    // Get all thresholds for this tank
    const [thresholds] = await pool.execute(
      `SELECT th.sensor_type_id, th.min_value, th.max_value, st.type_name, st.unit
       FROM thresholds th
       JOIN sensor_types st ON th.sensor_type_id = st.sensor_type_id
       WHERE th.tank_id = ?`,
      [tank_id]
    );
    
    // Create threshold lookup map
    const thresholdMap = {};
    for (const th of thresholds) {
      thresholdMap[th.type_name] = th;
    }

    // Get sensor IDs for this tank
    const [sensors] = await pool.execute(
      `SELECT sensor_id, sensor_type_id FROM sensors 
       WHERE tank_id = ? AND is_active = TRUE`,
      [tank_id]
    );
    
    // Create sensor lookup map by type
    const sensorMap = {};
    for (const s of sensors) {
      sensorMap[s.sensor_type_id] = s.sensor_id;
    }

    // Process each reading
    for (const [sensorType, value] of Object.entries(readings)) {
      if (value === null || value === undefined) continue;
      
      const sensorTypeId = SENSOR_TYPE_MAP[sensorType];
      if (!sensorTypeId) {
        console.warn(`[ESP32] Unknown sensor type: ${sensorType}`);
        continue;
      }
      
      const sensorId = sensorMap[sensorTypeId];
      if (!sensorId) {
        console.warn(`[ESP32] No sensor found for type ${sensorType} in tank ${tank_id}`);
        continue;
      }

      // Insert reading into database
      const [insertResult] = await pool.execute(
        `INSERT INTO sensor_readings (sensor_id, tank_id, sensor_type_id, value, recorded_at)
         VALUES (?, ?, ?, ?, ?)`,
        [sensorId, tank_id, sensorTypeId, value, timestamp]
      );
      
      results.readings_stored.push({
        type: sensorType,
        value,
        reading_id: insertResult.insertId
      });

      // Check threshold
      const threshold = thresholdMap[sensorType];
      if (threshold) {
        let alertType = null;
        let message = null;

        if (value > threshold.max_value) {
          alertType = 'high';
          message = `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} is HIGH: ${value}${threshold.unit} (max: ${threshold.max_value}${threshold.unit})`;
        } else if (value < threshold.min_value) {
          alertType = 'low';
          message = `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} is LOW: ${value}${threshold.unit} (min: ${threshold.min_value}${threshold.unit})`;
        }

        if (alertType) {
          // Insert alert into database
          const [alertResult] = await pool.execute(
            `INSERT INTO alerts (tank_id, sensor_type_id, reading_id, alert_type, message, value_recorded, threshold_min, threshold_max)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tank_id, sensorTypeId, insertResult.insertId, alertType, message, value, threshold.min_value, threshold.max_value]
          );

          const alertData = {
            alert_id: alertResult.insertId,
            tank_id,
            tank_name: tankName,
            sensor_type: sensorType,
            alert_type: alertType,
            message,
            value,
            threshold_min: threshold.min_value,
            threshold_max: threshold.max_value,
            unit: threshold.unit,
            created_at: timestamp
          };

          results.alerts_created.push(alertData);

          // Emit alert via WebSocket
          if (io) {
            io.to(`tank-${tank_id}`).emit('alert', alertData);
            io.emit('global-alert', alertData); // For overview page
          }

          // Send email if cooldown allows
          if (shouldSendEmail(tank_id, sensorType, alertType)) {
            try {
              await sendAlertEmail(alertData);
              results.emails_sent.push({ sensor_type: sensorType, alert_type: alertType });
            } catch (emailErr) {
              console.error('[ESP32] Email send failed:', emailErr.message);
            }
          }
        }
      }
    }

    // Emit real-time sensor update via WebSocket
    const updatePayload = {
      tank_id,
      tank_name: tankName,
      device_id,
      readings,
      timestamp
    };
    
    if (io) {
      io.to(`tank-${tank_id}`).emit('sensor-update', updatePayload);
      io.emit('global-sensor-update', updatePayload); // For overview page
    }

    // Log for debugging
    console.log(`[ESP32] Data received from ${device_id}: ${JSON.stringify(readings)}`);

    res.status(201).json({
      success: true,
      message: 'Data received and processed',
      data: results
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('[ESP32] Validation error:', err.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        details: err.errors
      });
    }
    
    console.error('[ESP32] Processing error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process sensor data',
      message: err.message
    });
  }
});

/**
 * GET /api/esp32/status
 * Health check endpoint for ESP32 to verify connectivity
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'ESP32 endpoint is online',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/esp32/config/:tankId
 * Returns current thresholds for ESP32 local checking (optional)
 */
router.get('/config/:tankId', async (req, res) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    
    const [thresholds] = await pool.execute(
      `SELECT st.type_name, th.min_value, th.max_value, st.unit
       FROM thresholds th
       JOIN sensor_types st ON th.sensor_type_id = st.sensor_type_id
       WHERE th.tank_id = ?`,
      [tankId]
    );

    const config = {};
    for (const th of thresholds) {
      config[th.type_name] = {
        min: parseFloat(th.min_value),
        max: parseFloat(th.max_value),
        unit: th.unit
      };
    }

    res.json({ success: true, data: config });
  } catch (err) {
    console.error('[ESP32] Config fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
