require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Database ----
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// สร้างตาราง todos ถ้ายังไม่มี (รัน 1 ครั้งตอน boot)
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id         SERIAL PRIMARY KEY,
      text       TEXT        NOT NULL,
      done       BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ---- Middleware ----
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Helper ----
function parseId(param) {
  const id = parseInt(param, 10);
  return Number.isNaN(id) ? null : id;
}

// ---- Routes ----

// GET /api/todos — คืน todo ทั้งหมด เรียงจากใหม่ไปเก่า
app.get('/api/todos', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, text, done, created_at AS "createdAt" FROM todos ORDER BY id ASC'
    );
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/todos — เพิ่ม todo ใหม่  body: { text }
app.post('/api/todos', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text is required and must be a non-empty string' });
    }

    const { rows } = await pool.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done, created_at AS "createdAt"',
      [text.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/todos/:id — toggle done/undone
app.put('/api/todos/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'id must be a valid integer' });
    }

    const { rows } = await pool.query(
      `UPDATE todos SET done = NOT done
       WHERE id = $1
       RETURNING id, text, done, created_at AS "createdAt"`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Todo with id ${id} not found` });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/todos/:id — ลบ todo แล้วคืน row ที่ถูกลบ
app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'id must be a valid integer' });
    }

    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING id, text, done, created_at AS "createdAt"',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Todo with id ${id} not found` });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ---- Start ----
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
