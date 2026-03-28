const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// POST /api/verification-codes (query C5)
const createSchema = z.object({
  user_id: z.number().int().positive(),
  code: z.string().length(6),
  code_type: z.enum(['sms', 'email']).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const [result] = await pool.execute(
      "INSERT INTO verification_codes (user_id, code, code_type, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [data.user_id, data.code, data.code_type || 'sms']
    );
    res.status(201).json({ success: true, data: { code_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// POST /api/verification-codes/validate (query C6)
const validateSchema = z.object({
  user_id: z.number().int().positive(),
  code: z.string().length(6),
});

router.post('/validate', async (req, res, next) => {
  try {
    const data = validateSchema.parse(req.body);
    const [rows] = await pool.execute(
      'SELECT code_id FROM verification_codes WHERE user_id = ? AND code = ? AND used = FALSE AND expires_at > NOW()',
      [data.user_id, data.code]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'Invalid or expired code' });
    await pool.execute('UPDATE verification_codes SET used = TRUE WHERE code_id = ?', [rows[0].code_id]);
    res.json({ success: true, data: { code_id: rows[0].code_id } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

module.exports = router;
