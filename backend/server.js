require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'todo',
  password: process.env.DB_PASSWORD || 'todo123',
  database: process.env.DB_NAME || 'todoapp'
});

async function waitForDb(retries = 25) {
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      retries -= 1;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function initializeDb() {
  await waitForDb();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/todos', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, completed, created_at, updated_at FROM todos ORDER BY created_at DESC, id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load todos', error);
    res.status(500).json({ error: 'Unable to load todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  const title = String(req.body.title || '').trim();

  if (!title) {
    return res.status(400).json({ error: 'Todo title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed, created_at, updated_at',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create todo', error);
    res.status(500).json({ error: 'Unable to create todo' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const fields = [];
  const values = [];

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid todo id' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'Todo title cannot be empty' });
    }
    values.push(title);
    fields.push(`title = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'completed')) {
    values.push(Boolean(req.body.completed));
    fields.push(`completed = $${values.length}`);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No todo fields provided' });
  }

  values.push(id);

  try {
    const result = await pool.query(
      `
        UPDATE todos
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, title, completed, created_at, updated_at
      `,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update todo', error);
    res.status(500).json({ error: 'Unable to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid todo id' });
  }

  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete todo', error);
    res.status(500).json({ error: 'Unable to delete todo' });
  }
});

initializeDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Todo API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
  });
