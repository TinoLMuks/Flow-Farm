const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/sensors - List all sensors
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.sensor_id, s.tank_id, s.sensor_type_id, s.device_label,
              s.esp32_device_id, s.is_active, s.installed_at,
              t.tank_name, st.type_name, st.unit
       FROM sensors s
       JOIN tanks t ON s.tank_id = t.tank_id
       JOIN sensor_types st ON s.sensor_type_id = st.sensor_type_id`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/sensors/types - List sensor types
router.get('/types', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM sensor_types');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/sensors/readings - Ingest a sensor reading (ESP32 → Backend)
const readingSchema = z.object({
  sensor_id: z.number().int().positive(),
  tank_id: z.number().int().positive(),
  sensor_type_id: z.number().int().positive(),
  value: z.number(),
  recorded_at: z.string().optional(),
});

router.post('/readings', async (req, res, next) => {
  try {
    const data = readingSchema.parse(req.body);
    const recorded = data.recorded_at || new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.execute(
      'INSERT INTO sensor_readings (sensor_id, tank_id, sensor_type_id, value, recorded_at) VALUES (?, ?, ?, ?, ?)',
      [data.sensor_id, data.tank_id, data.sensor_type_id, data.value, recorded]
    );

    // Check thresholds
    const [thresholds] = await pool.execute(
      `SELECT t.threshold_id, t.min_value, t.max_value, st.type_name
       FROM thresholds t
       JOIN sensor_types st ON t.sensor_type_id = st.sensor_type_id
       WHERE t.tank_id = ? AND t.sensor_type_id = ?`,
      [data.tank_id, data.sensor_type_id]
    );

    let alert = null;
    if (thresholds.length > 0) {
      const th = thresholds[0];
      if (data.value > th.max_value) {
        const [alertResult] = await pool.execute(
          `INSERT INTO alerts (tank_id, sensor_type_id, reading_id, alert_type, message, value_recorded, threshold_min, threshold_max)
           VALUES (?, ?, ?, 'high', ?, ?, ?, ?)`,
          [data.tank_id, data.sensor_type_id, result.insertId,
           `${th.type_name} above safe range`, data.value, th.min_value, th.max_value]
        );
        alert = { type: 'high', alert_id: alertResult.insertId };
      } else if (data.value < th.min_value) {
        const [alertResult] = await pool.execute(
          `INSERT INTO alerts (tank_id, sensor_type_id, reading_id, alert_type, message, value_recorded, threshold_min, threshold_max)
           VALUES (?, ?, ?, 'low', ?, ?, ?, ?)`,
          [data.tank_id, data.sensor_type_id, result.insertId,
           `${th.type_name} below safe range`, data.value, th.min_value, th.max_value]
        );
        alert = { type: 'low', alert_id: alertResult.insertId };
      }
    }

    res.status(201).json({ success: true, data: { reading_id: result.insertId, alert } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err);
  }
});

// GET /api/sensors/readings/latest/:tankId - Latest readings for a tank (Dashboard top cards - query B1)
router.get('/readings/latest/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const [rows] = await pool.execute(
      `SELECT st.type_name, st.unit, sr.value, sr.recorded_at
       FROM sensor_readings sr
       JOIN sensor_types st ON sr.sensor_type_id = st.sensor_type_id
       WHERE sr.tank_id = ?
         AND sr.recorded_at = (
           SELECT MAX(recorded_at) FROM sensor_readings
           WHERE tank_id = sr.tank_id AND sensor_type_id = sr.sensor_type_id
         )`,
      [tankId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/sensors/readings/range/:tankId - Readings over time range (Performance chart - query B2)
router.get('/readings/range/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const { start, end } = req.query;
    const [rows] = await pool.execute(
      `SELECT sr.recorded_at, st.type_name, sr.value
       FROM sensor_readings sr
       JOIN sensor_types st ON sr.sensor_type_id = st.sensor_type_id
       WHERE sr.tank_id = ?
         AND sr.recorded_at BETWEEN ? AND ?
       ORDER BY sr.recorded_at ASC`,
      [tankId, start, end]
    );

    // Transform for the chart: group by type
    const labels = [];
    const byType = {};
    for (const row of rows) {
      const timeLabel = new Date(row.recorded_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      if (!labels.includes(timeLabel)) labels.push(timeLabel);
      if (!byType[row.type_name]) byType[row.type_name] = [];
      byType[row.type_name].push(parseFloat(row.value));
    }

    res.json({
      success: true,
      data: {
        labels,
        tempData: byType['temperature'] || [],
        waterData: byType['water_level'] || [],
        phData: byType['ph'] || [],
      },
    });
  } catch (err) { next(err); }
});

// GET /api/sensors/readings/history/:tankId - Daily averages (query E1)
router.get('/readings/history/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const sensorTypeId = parseInt(req.query.sensor_type_id, 10);
    const [rows] = await pool.execute(
      `SELECT DATE(recorded_at) AS reading_date, AVG(value) AS avg_value,
              MIN(value) AS min_value, MAX(value) AS max_value
       FROM sensor_readings
       WHERE tank_id = ? AND sensor_type_id = ?
         AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(recorded_at)
       ORDER BY reading_date`,
      [tankId, sensorTypeId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
