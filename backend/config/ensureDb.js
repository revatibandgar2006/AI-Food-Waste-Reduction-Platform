const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function ensureDatabase() {
  const dbName = process.env.DB_NAME || 'foodbridge_db';
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Postgres@123',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('[PostgreSQL] Connected to default database server.');
    
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rows.length === 0) {
      console.log(`[PostgreSQL] Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[PostgreSQL] Database "${dbName}" created successfully.`);
    } else {
      console.log(`[PostgreSQL] Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('[PostgreSQL Error]:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  ensureDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = ensureDatabase;

