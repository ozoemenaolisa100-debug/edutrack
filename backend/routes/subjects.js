import express from 'express';
import { query, queryOne, run } from '../database.js';

const router = express.Router();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await query('SELECT * FROM subjects ORDER BY name');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get subject by ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create subject
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await run(
      'INSERT INTO subjects (name, code) VALUES (?, ?)',
      [name, code]
    );
    res.status(201).json({ id: result.id, name, code });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Subject or code already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update subject
router.put('/:id', async (req, res) => {
  try {
    const { name, code } = req.body;
    await run(
      'UPDATE subjects SET name = ?, code = ? WHERE id = ?',
      [name, code, req.params.id]
    );
    const updated = await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;