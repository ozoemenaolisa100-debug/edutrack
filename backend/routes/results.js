import express from 'express';
import { query, queryOne, run } from '../database.js';

const router = express.Router();

function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Get all results with student and subject details
router.get('/', async (req, res) => {
  try {
    const { semester, academic_year } = req.query;
    let sql = `
      SELECT r.id, r.student_id, r.subject_id, r.score, r.grade, r.semester, r.academic_year,
             s.name as student_name, s.registration_number, s.class,
             sub.name as subject_name, sub.code as subject_code
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
    `;
    let params = [];

    if (semester || academic_year) {
      const conditions = [];
      if (semester) {
        conditions.push('r.semester = ?');
        params.push(semester);
      }
      if (academic_year) {
        conditions.push('r.academic_year = ?');
        params.push(academic_year);
      }
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY s.class, s.name, sub.name';
    const results = await query(sql, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get results for a specific student
router.get('/student/:student_id', async (req, res) => {
  try {
    const results = await query(`
      SELECT r.id, r.student_id, r.subject_id, r.score, r.grade, r.semester, r.academic_year,
             s.name as student_name, s.registration_number, s.class,
             sub.name as subject_name, sub.code as subject_code
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      WHERE r.student_id = ?
      ORDER BY r.academic_year DESC, r.semester DESC, sub.name
    `, [req.params.student_id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get result by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await queryOne(`
      SELECT r.id, r.student_id, r.subject_id, r.score, r.grade, r.semester, r.academic_year,
             s.name as student_name, s.registration_number, s.class,
             sub.name as subject_name, sub.code as subject_code
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      WHERE r.id = ?
    `, [req.params.id]);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create result
router.post('/', async (req, res) => {
  try {
    const { student_id, subject_id, score, semester, academic_year } = req.body;
    if (!student_id || !subject_id || score === undefined || !semester || !academic_year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    const grade = calculateGrade(score);
    const result = await run(
      `INSERT INTO results (student_id, subject_id, score, grade, semester, academic_year) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id, score, grade, semester, academic_year]
    );
    res.status(201).json({ id: result.id, student_id, subject_id, score, grade, semester, academic_year });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Result already exists for this student, subject, semester, and year' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update result
router.put('/:id', async (req, res) => {
  try {
    const { score, semester, academic_year } = req.body;
    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }
    const grade = calculateGrade(score);
    await run(
      `UPDATE results SET score = ?, grade = ?, semester = ?, academic_year = ? WHERE id = ?`,
      [score, grade, semester, academic_year, req.params.id]
    );
    const updated = await queryOne(`
      SELECT r.id, r.student_id, r.subject_id, r.score, r.grade, r.semester, r.academic_year,
             s.name as student_name, s.registration_number, s.class,
             sub.name as subject_name, sub.code as subject_code
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      WHERE r.id = ?
    `, [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete result
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM results WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json({ message: 'Result deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;