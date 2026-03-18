import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase, closeDatabase } from './database.js';
import studentRoutes from './routes/students.js';
import subjectRoutes from './routes/subjects.js';
import resultRoutes from './routes/results.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/results', resultRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Initialize and start server
async function start() {
  try {
    await initializeDatabase();
    console.log('School Result Management System running on http://0.0.0.0:' + PORT);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeDatabase();
  process.exit(0);
});

start();