const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/alerts/frequency/:tankId - Alert frequency by type (query E2)
router.get('/frequency/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const [rows] = await pool.execute(
      `SELECT st.type_name, a.alert_type, COUNT(*) AS alert_count
       FROM alerts a
       JOIN sensor_types st ON a.sensor_type_id = st.sensor_type_id
       WHERE a.tank_id = ?
         AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY st.type_name, a.alert_type`,
      [tankId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/alerts/:tankId - Paginated alert log (query B3)
router.get('/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const [rows] = await pool.execute(
      `SELECT a.alert_id, a.created_at, st.type_name AS sensor,
              a.message AS issue, a.value_recorded, st.unit,
              a.alert_type AS status
       FROM alerts a
       JOIN sensor_types st ON a.sensor_type_id = st.sensor_type_id
       WHERE a.tank_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [tankId, limit, offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/alerts - All alerts (for overview recent issues)
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const [rows] = await pool.execute(
      `SELECT a.alert_id, a.created_at, st.type_name AS sensor,
              a.message AS issue, a.value_recorded, st.unit,
              a.alert_type AS status, a.status AS resolution_status,
              t.tank_name
       FROM alerts a
       JOIN sensor_types st ON a.sensor_type_id = st.sensor_type_id
       JOIN tanks t ON a.tank_id = t.tank_id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// PUT /api/alerts/:alertId/acknowledge
const ackSchema = z.object({
  acknowledged_by: z.number().int().positive(),
});

router.put('/:alertId/acknowledge', async (req, res, next) => {
  try {
    const data = ackSchema.parse(req.body);
    await pool.execute(
      `UPDATE alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW() WHERE alert_id = ?`,
      [data.acknowledged_by, req.params.alertId]
    );
    res.json({ success: true, data: { alert_id: parseInt(req.params.alertId, 10) } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// PUT /api/alerts/:alertId/resolve
router.put('/:alertId/resolve', async (req, res, next) => {
  try {
    await pool.execute(
      `UPDATE alerts SET status = 'resolved', resolved_at = NOW() WHERE alert_id = ?`,
      [req.params.alertId]
    );
    res.json({ success: true, data: { alert_id: parseInt(req.params.alertId, 10) } });
  } catch (err) { next(err); }
});

module.exports = router;
