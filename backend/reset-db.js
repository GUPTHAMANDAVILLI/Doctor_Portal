const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

async function resetDatabase() {
  try {
    const sqlPath = path.join(__dirname, 'src', 'config', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Resetting PostgreSQL database tables with clean schema...');
    await pool.query(sql);
    console.log('✅ PostgreSQL database cleared successfully! Zero dummy data remains.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset error (PostgreSQL may be offline, mock store will be used):', err.message);
    process.exit(0);
  }
}

resetDatabase();
