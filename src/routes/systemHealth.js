const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/system-health/:tankId - Latest health snapshot (query B4)
router.get('/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const [rows] = await pool.execute(
      `SELECT overall_score, temp_status, ph_status, water_level_status, snapshot_at
       FROM system_health
       WHERE tank_id = ?
       ORDER BY snapshot_at DESC
       LIMIT 1`,
      [tankId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'No health data found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /api/system-health - All tanks health
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sh.*, t.tank_name
       FROM system_health sh
       JOIN tanks t ON sh.tank_id = t.tank_id
       INNER JOIN (
         SELECT tank_id, MAX(snapshot_at) AS max_time
         FROM system_health GROUP BY tank_id
       ) latest ON sh.tank_id = latest.tank_id AND sh.snapshot_at = latest.max_time`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
