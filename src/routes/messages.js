const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/messages/unread-count/:userId (query B5)
router.get('/unread-count/:userId', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS unread_count FROM messages WHERE recipient_id = ? AND is_read = FALSE',
      [req.params.userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// GET /api/messages/:userId
router.get('/:userId', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, u.full_name AS sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.user_id
       WHERE m.recipient_id = ?
       ORDER BY m.created_at DESC`,
      [req.params.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/messages
const messageSchema = z.object({
  sender_id: z.number().int().positive().nullable().optional(),
  recipient_id: z.number().int().positive(),
  subject: z.string().max(255).optional(),
  body: z.string().min(1),
  message_type: z.enum(['system', 'alert', 'user']).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = messageSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO messages (sender_id, recipient_id, subject, body, message_type)
       VALUES (?, ?, ?, ?, ?)`,
      [data.sender_id || null, data.recipient_id, data.subject || null, data.body, data.message_type || 'system']
    );
    res.status(201).json({ success: true, data: { message_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// PUT /api/messages/:messageId/read
router.put('/:messageId/read', async (req, res, next) => {
  try {
    await pool.execute('UPDATE messages SET is_read = TRUE WHERE message_id = ?', [req.params.messageId]);
    res.json({ success: true, data: { message_id: parseInt(req.params.messageId, 10) } });
  } catch (err) { next(err); }
});

module.exports = router;
