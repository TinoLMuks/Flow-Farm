const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../config/db');

const tankSchema = z.object({
  tank_name: z.string().min(1).max(100),
  location: z.string().max(255).optional(),
  description: z.string().optional(),
  fish_species: z.string().max(100).optional(),
  plant_types: z.string().max(255).optional(),
  capacity_litres: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  created_by: z.number().int().positive().optional(),
});

// GET /api/tanks
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tanks WHERE is_active = TRUE');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/tanks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tanks WHERE tank_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Tank not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/tanks
router.post('/', async (req, res, next) => {
  try {
    const data = tankSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO tanks (tank_name, location, description, fish_species, plant_types, capacity_litres, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.tank_name, data.location || null, data.description || null, data.fish_species || 'Tilapia',
       data.plant_types || null, data.capacity_litres || null, data.is_active ?? true, data.created_by || null]
    );
    res.status(201).json({ success: true, data: { tank_id: result.insertId } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

// PUT /api/tanks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const data = tankSchema.partial().parse(req.body);
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    if (fields.length === 0) return res.status(400).json({ success: false, error: 'No fields to update' });
    values.push(req.params.id);
    await pool.execute(`UPDATE tanks SET ${fields.join(', ')} WHERE tank_id = ?`, values);
    res.json({ success: true, data: { tank_id: parseInt(req.params.id, 10) } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    next(err);
  }
});

module.exports = router;
