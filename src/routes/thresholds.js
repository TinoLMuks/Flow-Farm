const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/thresholds/:tankId
router.get('/:tankId', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT th.*, st.type_name, st.unit
       FROM thresholds th
       JOIN sensor_types st ON th.sensor_type_id = st.sensor_type_id
       WHERE th.tank_id = ?`,
      [req.params.tankId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// PUT /api/thresholds/:tankId/:sensorTypeId
const thresholdSchema = z.object({
  min_value: z.number(),
  max_value: z.number(),
  updated_by: z.number().int().positive(),
}).refine((data) => data.min_value <= data.max_value, {
  message: 'min_value must be less than or equal to max_value',
  path: ['min_value'],
});

router.put('/:tankId/:sensorTypeId', async (req, res, next) => {
  try {
    const data = thresholdSchema.parse(req.body);
    await pool.execute(
      `INSERT INTO thresholds (tank_id, sensor_type_id, min_value, max_value, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE min_value = VALUES(min_value), max_value = VALUES(max_value), updated_by = VALUES(updated_by)`,
      [req.params.tankId, req.params.sensorTypeId, data.min_value, data.max_value, data.updated_by]
    );
    res.json({ success: true, data: { tank_id: parseInt(req.params.tankId, 10) } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

module.exports = router;
