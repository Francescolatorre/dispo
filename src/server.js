const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/database');
const employeesRouter = require('./routes/employees');
const projectsRouter = require('./routes/projects');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/employees', employeesRouter);
app.use('/api/projects', projectsRouter);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DispoMVP API' });
});

// Test database connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
