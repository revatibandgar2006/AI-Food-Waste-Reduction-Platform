const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runSchema() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('[Schema] Executing database schema on foodbridge_db...');
    await db.query(schemaSql);
    console.log('[Schema] All 8 tables, constraints, and indexes successfully executed!');
  } catch (err) {
    console.error('[Schema Error]:', err.message);
    throw err;
  }
}

if (require.main === module) {
  runSchema()
    .then(() => {
      console.log('[Schema] Migration completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Schema] Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runSchema;

