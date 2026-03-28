const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// POST /api/audit-log (query F)
const auditSchema = z.object({
  user_id: z.number().int().positive().optional(),
  action: z.string().min(1).max(100),
  entity_type: z.string().max(50).optional(),
  entity_id: z.number().int().optional(),
  details: z.record(z.unknown()).optional(),
  ip_address: z.string().max(45).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = auditSchema.parse(req.body);
    const [result] = await pool.execute(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [data.user_id || null, data.action, data.entity_type || null,
       data.entity_id || null, data.details ? JSON.stringify(data.details) : null, data.ip_address || null]
    );
    res.status(201).json({ success: true, data: { log_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// GET /api/audit-log
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const [rows] = await pool.execute(
      `SELECT al.*, u.full_name
       FROM audit_log al
       LEFT JOIN users u ON al.user_id = u.user_id
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
