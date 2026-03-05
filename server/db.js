/**
 * Bază de date: PostgreSQL (prioritar, pentru securitate) sau SQLite (fallback).
 * Setează DATABASE_URL pentru PostgreSQL, ex: postgresql://user:parola@host:5432/nume_baza
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data.sqlite');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pgPool = null;
let sqliteDb = null;

// ---------- PostgreSQL ----------
async function initPg() {
  if (!DATABASE_URL || pgPool) return pgPool;
  try {
    const { default: pg } = await import('pg');
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    console.log('[DB] PostgreSQL conectat.');
    return pgPool;
  } catch (e) {
    console.warn('[DB] PostgreSQL indisponibil:', e.message);
    return null;
  }
}

async function pgGet(key, defaultValue) {
  const pool = await initPg();
  if (!pool) return defaultValue;
  try {
    const res = await pool.query('SELECT value FROM kv WHERE key = $1', [key]);
    const row = res.rows[0];
    return row ? JSON.parse(row.value) : defaultValue;
  } catch (e) {
    console.warn('[DB] pg get', key, e.message);
    return defaultValue;
  }
}

async function pgSet(key, value) {
  const pool = await initPg();
  if (!pool) return false;
  try {
    await pool.query(
      'INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, JSON.stringify(value)]
    );
    return true;
  } catch (e) {
    console.warn('[DB] pg set', key, e.message);
    return false;
  }
}

// ---------- SQLite ----------
function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  try {
    const Database = require('better-sqlite3');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    console.log('[DB] SQLite conectat:', DB_PATH);
    return sqliteDb;
  } catch (e) {
    console.warn('[DB] SQLite indisponibil:', e.message);
    return null;
  }
}

function sqliteGet(key, defaultValue) {
  const d = getSqliteDb();
  if (!d) return defaultValue;
  try {
    const row = d.prepare('SELECT value FROM kv WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : defaultValue;
  } catch (e) {
    console.warn('[DB] sqlite get', key, e.message);
    return defaultValue;
  }
}

function sqliteSet(key, value) {
  const d = getSqliteDb();
  if (!d) return false;
  try {
    d.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[DB] sqlite set', key, e.message);
    return false;
  }
}

// ---------- API unificat (async) ----------
export function usePg() {
  return !!DATABASE_URL;
}

export async function get(key, defaultValue) {
  if (usePg()) return pgGet(key, defaultValue);
  return Promise.resolve(sqliteGet(key, defaultValue));
}

export async function set(key, value) {
  if (usePg()) return pgSet(key, value);
  return Promise.resolve(sqliteSet(key, value));
}

export const dbGallery = {
  get: (defaultVal = []) => get('gallery', defaultVal),
  set: (items) => set('gallery', items),
};
export const dbMessages = {
  get: (defaultVal = []) => get('messages', defaultVal),
  set: (messages) => set('messages', messages),
};
export const dbCategories = {
  get: (defaultVal = null) => get('categories', defaultVal),
  set: (list) => set('categories', list),
};
export const dbAdminSettings = {
  get: (defaultVal = null) => get('admin_settings', defaultVal),
  set: (settings) => set('admin_settings', settings),
};
export const dbAnalytics = {
  get: (defaultVal = { views: [] }) => get('analytics', defaultVal),
  set: (data) => set('analytics', data),
};

export function useDb() {
  if (usePg()) return true;
  try {
    getSqliteDb();
    return !!sqliteDb;
  } catch {
    return false;
  }
}
