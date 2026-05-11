require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku TEXT,
    brand TEXT,
    category JSONB DEFAULT '[]',
    name TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    sizes JSONB DEFAULT '[]',
    colors JSONB DEFAULT '[]',
    fabric TEXT,
    description TEXT,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  INSERT INTO brands (name, slug) VALUES
    ('Nike', 'nike'), ('Adidas', 'adidas'), ('Under Armour', 'ua')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO categories (name, slug) VALUES
    ('Hauts', 'tops'), ('Pantalons', 'pants'), ('Ensembles', 'sets')
  ON CONFLICT (slug) DO NOTHING;
`;

async function initDatabase() {
  try {
    await pool.query(INIT_SQL);
    console.log('Base de données connectée et tables prêtes.');
  } catch (err) {
    console.error('Erreur de connexion à la base de données :', err.message);
    process.exit(1);
  }
}

module.exports = { pool, initDatabase };
