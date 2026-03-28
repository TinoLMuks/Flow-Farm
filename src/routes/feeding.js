const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/feeding/schedules/:tankId - Today's feeding schedule (query D1)
router.get('/schedules/:tankId', async (req, res, next) => {
  try {
    const tankId = parseInt(req.params.tankId, 10);
    const [rows] = await pool.execute(
      `SELECT fs.schedule_id, fs.feed_time, fs.feed_amount_g, fs.feed_type,
              fl.fed_at IS NOT NULL AS is_completed
       FROM feeding_schedules fs
       LEFT JOIN feeding_logs fl ON fs.schedule_id = fl.schedule_id
         AND DATE(fl.fed_at) = CURDATE()
       WHERE fs.tank_id = ? AND fs.is_active = TRUE
       ORDER BY fs.feed_time`,
      [tankId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/feeding/schedules
const scheduleSchema = z.object({
  tank_id: z.number().int().positive(),
  feed_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  feed_amount_g: z.number().positive().optional(),
  feed_type: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
  created_by: z.number().int().positive().optional(),
});

router.post('/schedules', async (req, res, next) => {
  try {
    const data = scheduleSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO feeding_schedules (tank_id, feed_time, feed_amount_g, feed_type, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.tank_id, data.feed_time, data.feed_amount_g || null, data.feed_type || null,
       data.is_active ?? true, data.created_by || null]
    );
    res.status(201).json({ success: true, data: { schedule_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// POST /api/feeding/logs - Log a feeding event (query D2)
const logSchema = z.object({
  schedule_id: z.number().int().positive().optional(),
  tank_id: z.number().int().positive(),
  fed_by: z.number().int().positive().optional(),
  feed_amount_g: z.number().positive().optional(),
  method: z.enum(['manual', 'automated']).optional(),
  notes: z.string().optional(),
});

router.post('/logs', async (req, res, next) => {
  try {
    const data = logSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO feeding_logs (schedule_id, tank_id, fed_by, feed_amount_g, method, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.schedule_id || null, data.tank_id, data.fed_by || null,
       data.feed_amount_g || null, data.method || 'manual', data.notes || null]
    );
    res.status(201).json({ success: true, data: { log_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// GET /api/feeding/logs/:tankId
router.get('/logs/:tankId', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT fl.*, u.full_name AS fed_by_name
       FROM feeding_logs fl
       LEFT JOIN users u ON fl.fed_by = u.user_id
       WHERE fl.tank_id = ?
       ORDER BY fl.fed_at DESC
       LIMIT 50`,
      [req.params.tankId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
