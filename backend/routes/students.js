import express from 'express';
import { query, queryOne, run } from '../database.js';

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await query('SELECT * FROM students ORDER BY class, name');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const { name, registration_number, class: studentClass } = req.body;
    if (!name || !registration_number || !studentClass) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await run(
      'INSERT INTO students (name, registration_number, class) VALUES (?, ?, ?)',
      [name, registration_number, studentClass]
    );
    res.status(201).json({ id: result.id, name, registration_number, class: studentClass });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Registration number already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { name, registration_number, class: studentClass } = req.body;
    await run(
      'UPDATE students SET name = ?, registration_number = ?, class = ? WHERE id = ?',
      [name, registration_number, studentClass, req.params.id]
    );
    const updated = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;