const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// POST /api/password-resets (query C4)
const resetSchema = z.object({
  user_id: z.number().int().positive(),
  reset_token: z.string().min(1),
});

router.post('/', async (req, res, next) => {
  try {
    const data = resetSchema.parse(req.body);
    const [result] = await pool.execute(
      'INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [data.user_id, data.reset_token]
    );
    res.status(201).json({ success: true, data: { reset_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// POST /api/password-resets/validate
const validateSchema = z.object({
  reset_token: z.string().min(1),
});

router.post('/validate', async (req, res, next) => {
  try {
    const data = validateSchema.parse(req.body);
    const [rows] = await pool.execute(
      'SELECT reset_id, user_id FROM password_resets WHERE reset_token = ? AND used = FALSE AND expires_at > NOW()',
      [data.reset_token]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

module.exports = router;
