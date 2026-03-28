const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.role_id, u.is_verified,
              u.profile_image, u.last_login, u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/users/register (query C1)
const registerSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(150),
  password_hash: z.string().min(1),
  phone_number: z.string().max(20).optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash, phone_number) VALUES (?, ?, ?, ?)',
      [data.full_name, data.email, data.password_hash, data.phone_number || null]
    );
    res.status(201).json({ success: true, data: { user_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: 'Email already registered' });
    next(err);
  }
});

// POST /api/users/login (query C2)
const loginSchema = z.object({
  email: z.string().email(),
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const [rows] = await pool.execute(
      'SELECT user_id, full_name, email, password_hash, role_id, is_verified FROM users WHERE email = ?',
      [data.email]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// POST /api/users/google-auth (query C3)
const googleSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(150),
  google_id: z.string().min(1),
  profile_image: z.string().max(500).optional(),
});

router.post('/google-auth', async (req, res, next) => {
  try {
    const data = googleSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, google_id, is_verified, profile_image)
       VALUES (?, ?, ?, TRUE, ?)
       ON DUPLICATE KEY UPDATE google_id = VALUES(google_id), last_login = CURRENT_TIMESTAMP`,
      [data.full_name, data.email, data.google_id, data.profile_image || null]
    );
    res.json({ success: true, data: { user_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

module.exports = router;
