require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'cafe',
  password: process.env.DB_PASSWORD || 'cafe123',
  database: process.env.DB_NAME || 'cafe'
});

async function waitForDb(retries = 20) {
  while (retries > 0) {
    try {
      await pool.query('SELECT NOW()');
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
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(5, 2) NOT NULL,
      category VARCHAR(50) NOT NULL
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM menu_items');
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO menu_items (name, description, price, category) VALUES
      ('Velvet Latte', 'House espresso with silky oat foam and cinnamon.', 5.50, 'Coffee'),
      ('Golden Matcha', 'Ceremonial matcha topped with citrus zest.', 6.20, 'Tea'),
      ('Croissant Stack', 'Buttery pastry with vanilla bean cream.', 4.80, 'Bakery'),
      ('Sunset Toast', 'Sourdough with whipped ricotta and berry compote.', 5.90, 'Breakfast');
    `);
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/menu', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load menu' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { itemName, customerName } = req.body;

  if (!itemName || !customerName) {
    return res.status(400).json({ error: 'itemName and customerName are required' });
  }

  res.json({ message: `Thanks ${customerName}! Your ${itemName} is brewing.` });
});

initializeDb()
  .then(() => {
    app.listen(5000, () => {
      console.log('Cafe API running on port 5000');
    });
  })
  .catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
  });
