import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create db directory if it doesn't exist
const dbDir = join(__dirname, '..', '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite database file path
const dbPath = process.env.DATABASE_PATH || join(dbDir, 'tablica.db');

// Create or open SQLite database
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log(`✅ Connected to SQLite database at: ${dbPath}`);

// Helper function for queries (similar API to pg)
export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    // Convert PostgreSQL-style $1, $2 to SQLite-style ?
    const sqliteQuery = text.replace(/\$\d+/g, '?');

    // Determine if it's a SELECT query or modification query
    const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');

    let result;
    if (isSelect) {
      const stmt = db.prepare(sqliteQuery);
      const rows = stmt.all(...params);
      result = { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(sqliteQuery);
      const info = stmt.run(...params);
      result = {
        rows: info.lastInsertRowid ? [{ id: info.lastInsertRowid }] : [],
        rowCount: info.changes
      };
    }

    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('executed query', { text: sqliteQuery, duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    console.error('Query error:', error);
    console.error('Query was:', text);
    console.error('Params were:', params);
    throw error;
  }
};

// Helper function for transactions
export const transaction = async (callback) => {
  const beginTransaction = db.prepare('BEGIN TRANSACTION');
  const commitTransaction = db.prepare('COMMIT');
  const rollbackTransaction = db.prepare('ROLLBACK');

  try {
    beginTransaction.run();
    const result = await callback({ query });
    commitTransaction.run();
    return result;
  } catch (error) {
    rollbackTransaction.run();
    throw error;
  }
};

// Export raw database for direct access if needed
export const rawDb = db;

export default db;
