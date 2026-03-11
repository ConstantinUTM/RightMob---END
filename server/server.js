// Pornire server API – trebuie să ruleze pe port 3001 ca proxy-ul Vite să funcționeze
console.log('[API] Încărcare server...');

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { translateToAll, translateText, translateFromAny, detectLanguage } from './translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Încarcă variabilele din .env (fără dotenv)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
  console.log('[API] .env încărcat.');
}

const app = express();
const PORT = 3001;
const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('[API] JWT_SECRET nu e setat în .env – folosesc secret temporar (token-urile expiră la repornire).');
}
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const tokenBlacklist = new Set();
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
const SAFE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAGIC = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  webp: Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF, then later WEBP
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF8
};
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const ADMIN_SETTINGS_FILE = path.join(__dirname, 'adminSettings.json');
const GALLERY_FILE = path.join(__dirname, 'gallery.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const ANALYTICS_FILE = path.join(__dirname, 'analytics.json');
const SITE_CONTENT_FILE = path.join(__dirname, 'siteContent.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('[API] Director public/uploads creat.');
}
const LOGS_DIR = path.join(__dirname, 'logs');
const SECURITY_LOG_FILE = path.join(LOGS_DIR, 'security.log');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  console.log('[API] Director logs creat.');
}
const getClientIp = (req) => req.ip || req.socket?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
const secureLog = (event, req, extra = {}) => {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ip: getClientIp(req),
    ...extra
  }) + '\n';
  try {
    fs.appendFileSync(SECURITY_LOG_FILE, line);
  } catch (e) {
    console.error('[SEC] Eroare scriere log:', e?.message);
  }
  console.log('[SEC]', event, getClientIp(req), extra?.email || extra?.message || '');
};

// Bază de date: PostgreSQL (DATABASE_URL) sau SQLite – API async
let dbGallery, dbMessages, dbCategories, dbAdminSettings, dbAnalytics, useDb;
try {
  const dbModule = await import('./db.js');
  dbGallery = dbModule.dbGallery;
  dbMessages = dbModule.dbMessages;
  dbCategories = dbModule.dbCategories;
  dbAdminSettings = dbModule.dbAdminSettings;
  dbAnalytics = dbModule.dbAnalytics;
  useDb = dbModule.useDb;
} catch (e) {
  useDb = () => false;
}

const isValidImageBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (buffer.compare(MAGIC.jpeg, 0, 3, 0, 3) === 0) return true;
  if (buffer.compare(MAGIC.png, 0, 8, 0, 8) === 0) return true;
  if (buffer.compare(MAGIC.gif, 0, 4, 0, 4) === 0) return true;
  if (buffer.compare(MAGIC.webp, 0, 4, 0, 4) === 0 && buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
  return false;
};
const sanitizeImageFilename = (fname) => {
  const base = (fname || 'image').replace(/\.\.\/?/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = path.extname(base).toLowerCase();
  return SAFE_IMAGE_EXTENSIONS.has(ext) ? base : base.replace(/\.[^.]+$/, '') || 'image';
};
const isPasswordHash = (str) => typeof str === 'string' && str.startsWith('$2b$');
const validatePasswordComplexity = (password) => {
  if (typeof password !== 'string' || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^a-zA-Z0-9]/.test(password)) return false; // cel puțin un simbol
  return true;
};

const isValidAdminToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (tokenBlacklist.has(token)) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (_) {
    return false;
  }
};

// Curățare blacklist la fiecare oră (token-uri expirate)
setInterval(() => {
  for (const t of tokenBlacklist) {
    try {
      const payload = jwt.decode(t);
      if (payload && payload.exp && payload.exp < Date.now() / 1000) tokenBlacklist.delete(t);
    } catch (_) {}
  }
}, 60 * 60 * 1000);

// Admin auth + CSRF guard
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o));
};

const requireAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  const origin = req.headers.origin || req.headers.referer;
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'CSRF check failed' });
  }
  if (isValidAdminToken(adminToken)) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};



// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o))) return cb(null, true);
    cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));
app.get('/favicon.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favicon.png'));
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Prea multe încercări, reîncearcă în 15 minute' },
  standardHeaders: true,
  handler: (req, res) => {
    secureLog('rate_limit_login', req, { message: 'Prea multe încercări login' });
    res.status(429).json({ error: 'Prea multe încercări, reîncearcă în 15 minute' });
  }
});
app.use('/api/admin/login', loginRateLimiter);

const messagesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Prea multe cereri. Încearcă mai târziu.' },
  standardHeaders: true
});
app.use('/api/messages', messagesRateLimiter);

const translateRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Prea multe cereri de traducere. Încearcă mai târziu.' },
  standardHeaders: true
});
app.use('/api/translate', translateRateLimiter);

const emailTrackRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Prea multe cereri. Încearcă mai târziu.' },
  standardHeaders: true
});
app.use('/api/email-track', emailTrackRateLimiter);

// Health check – fără fișiere, doar răspunde 200 (pentru a verifica că serverul și proxy merg)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server rulează' });
});

// Traducere automată (MyMemory API – gratuit, fără cheie). Limită ~500 bytes/request, deci fragmentăm.
const MYMEMORY_MAX_CHARS = 350;
const chunkText = (text) => {
  const t = String(text).trim();
  if (!t) return [];
  if (t.length <= MYMEMORY_MAX_CHARS) return [t];
  const chunks = [];
  let rest = t;
  while (rest.length > 0) {
    if (rest.length <= MYMEMORY_MAX_CHARS) {
      chunks.push(rest);
      break;
    }
    const slice = rest.slice(0, MYMEMORY_MAX_CHARS);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > MYMEMORY_MAX_CHARS / 2 ? lastSpace + 1 : MYMEMORY_MAX_CHARS;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trim();
  }
  return chunks;
};
const translateWithMyMemory = async (text, fromLang, toLang) => {
  const chunks = chunkText(text);
  if (chunks.length === 0) return '';
  const langpair = `${fromLang}|${toLang}`;
  const results = [];
  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      results.push(translated && typeof translated === 'string' ? translated : chunk);
    } catch (e) {
      results.push(chunk);
    }
  }
  return results.join(' ');
};
app.post('/api/translate', express.json(), async (req, res) => {
  try {
    const { text, from, to } = req.body || {};
    const fromLang = (from && /^[a-z]{2}$/.test(String(from))) ? String(from) : 'ro';
    const toLang = (to && /^[a-z]{2}$/.test(String(to))) ? String(to) : 'en';
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Lipsește textul de tradus' });
    }
    const translated = await translateWithMyMemory(text.trim(), fromLang, toLang);
    res.json({ translated });
  } catch (err) {
    console.error('Eroare traducere:', err);
    res.status(500).json({ error: 'Traducerea a eșuat' });
  }
});

// Traducere în batch – un singur request pentru mai multe texte (mai puțină încărcare pentru client).
// body: { items: [ { id: string, text: string, from?: 'ro', to: 'en'|'ru' } ] }
// răspuns: { results: [ { id, translated } ] } – traducere după contextul frazei, nu mot-a-mot.
const BATCH_DELAY_MS = 120;
app.post('/api/translate/batch', express.json(), async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Trimite un array "items" cu { id, text, to }' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 texte per request' });
    }
    const fromLang = 'ro';
    const results = [];
    for (const it of items) {
      const id = it.id != null ? String(it.id) : '';
      const text = (it.text != null && typeof it.text === 'string') ? it.text.trim() : '';
      const toLang = (it.to === 'ru' || it.to === 'en') ? it.to : 'en';
      if (!text) {
        results.push({ id, translated: '' });
        continue;
      }
      const translated = await translateWithMyMemory(text, fromLang, toLang);
      results.push({ id, translated });
      if (BATCH_DELAY_MS > 0) await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
    res.json({ results });
  } catch (err) {
    console.error('Eroare traducere batch:', err);
    res.status(500).json({ error: 'Traducerea în batch a eșuat' });
  }
});

// Funcție helper pentru citirea produselor
const readProducts = () => {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Eroare la citirea produselor:', error);
    return [];
  }
};

// Funcție helper pentru scrierea produselor
const writeProducts = (products) => {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    return true;
  } catch (error) {
    console.error('Eroare la scrierea produselor:', error);
    return false;
  }
};

// Mesaje (DB sau JSON)
const readMessagesFile = () => {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch (error) {
    console.error('Eroare la citirea mesajelor:', error);
    return [];
  }
};
const writeMessagesFile = (messages) => {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Eroare la scrierea mesajelor:', error);
    return false;
  }
};
const readMessages = async () => {
  if (useDb()) {
    let data = await dbMessages.get([]);
    if (Array.isArray(data) && data.length === 0 && fs.existsSync(MESSAGES_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        if (Array.isArray(data)) await dbMessages.set(data);
      } catch (_) {}
    }
    return Array.isArray(data) ? data : [];
  }
  return readMessagesFile();
};
const writeMessages = async (messages) => {
  if (useDb()) return await dbMessages.set(messages);
  return writeMessagesFile(messages);
};

// Setări implicite – fără parolă validă (configurare manuală necesară dacă fișierul lipsește)
const DEFAULT_ADMIN_SETTINGS = {
  profile: { username: 'Admin', email: 'admin@luxmobila.com', profileImage: '' },
  credentials: { email: 'admin@luxmobila.com', password: '', uid: 'mock-admin-uid' },
  notificationsEmail: '',
  notificationsPhone: '',
  features: { tryInMyRoomEnabled: true }
};

// Setări admin (DB sau JSON)
const readAdminSettingsFile = () => {
  try {
    if (!fs.existsSync(ADMIN_SETTINGS_FILE)) {
      fs.writeFileSync(ADMIN_SETTINGS_FILE, JSON.stringify(DEFAULT_ADMIN_SETTINGS, null, 2));
      return DEFAULT_ADMIN_SETTINGS;
    }
    const data = fs.readFileSync(ADMIN_SETTINGS_FILE, 'utf8');
    if (!data || data.length > 50 * 1024 * 1024) return { ...DEFAULT_ADMIN_SETTINGS };
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_ADMIN_SETTINGS };
    if (!parsed.credentials || typeof parsed.credentials !== 'object') parsed.credentials = DEFAULT_ADMIN_SETTINGS.credentials;
    if (parsed.notificationsEmail === undefined) parsed.notificationsEmail = DEFAULT_ADMIN_SETTINGS.notificationsEmail;
    if (parsed.notificationsPhone === undefined) parsed.notificationsPhone = DEFAULT_ADMIN_SETTINGS.notificationsPhone;
    return parsed;
  } catch (error) {
    console.error('Eroare la citirea setărilor admin:', error.message);
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
};
const writeAdminSettingsFile = (settings) => {
  try {
    fs.writeFileSync(ADMIN_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Eroare la scrierea setărilor admin:', error);
    return false;
  }
};
const readAdminSettings = async () => {
  if (useDb()) {
    let data = await dbAdminSettings.get(null);
    if (!data && fs.existsSync(ADMIN_SETTINGS_FILE)) {
      try {
        data = readAdminSettingsFile();
        if (data) await dbAdminSettings.set(data);
      } catch (_) {}
    }
    if (!data || typeof data !== 'object') data = { ...DEFAULT_ADMIN_SETTINGS };
    if (data.notificationsEmail === undefined) data.notificationsEmail = DEFAULT_ADMIN_SETTINGS.notificationsEmail;
    if (data.notificationsPhone === undefined) data.notificationsPhone = DEFAULT_ADMIN_SETTINGS.notificationsPhone;
    return data;
  }
  return readAdminSettingsFile();
};
const writeAdminSettings = async (settings) => {
  if (useDb()) return await dbAdminSettings.set(settings);
  return writeAdminSettingsFile(settings);
};

// Funcții helper pentru galerie (DB sau JSON)
const readGalleryFile = () => {
  try {
    if (!fs.existsSync(GALLERY_FILE)) {
      fs.writeFileSync(GALLERY_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(GALLERY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Eroare la citirea galeriei:', error);
    return [];
  }
};
const writeGalleryFile = (items) => {
  try {
    fs.writeFileSync(GALLERY_FILE, JSON.stringify(items, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Eroare la scrierea galeriei:', error);
    return false;
  }
};
const readGallery = async () => {
  if (useDb()) {
    let items = await dbGallery.get([]);
    if (Array.isArray(items) && items.length === 0 && fs.existsSync(GALLERY_FILE)) {
      try {
        items = JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf8'));
        if (Array.isArray(items)) await dbGallery.set(items);
      } catch (_) {}
    }
    return Array.isArray(items) ? items : [];
  }
  return readGalleryFile();
};
const writeGallery = async (items) => {
  if (useDb()) return await dbGallery.set(items);
  return writeGalleryFile(items);
};

// Categorii galerie (editabile din admin)
const defaultCategories = [
  { id: 'living', label: 'Cameră de zi' },
  { id: 'dormitor', label: 'Dormitor' },
  { id: 'bucatarie', label: 'Bucătărie' },
  { id: 'birou', label: 'Birou' },
  { id: 'hol', label: 'Hol' },
  { id: 'baie', label: 'Baie' },
  { id: 'copii', label: 'Cameră Copii' },
  { id: 'gradina', label: 'Grădină' },
];
const readCategoriesFile = () => {
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2));
      return defaultCategories;
    }
    const list = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    return Array.isArray(list) && list.length > 0 ? list : defaultCategories;
  } catch (error) {
    console.error('Eroare la citirea categoriilor:', error);
    return defaultCategories;
  }
};
const writeCategoriesFile = (list) => {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(list, null, 2));
    return true;
  } catch (error) {
    console.error('Eroare la scrierea categoriilor:', error);
    return false;
  }
};
const readCategories = async () => {
  if (useDb()) {
    let list = await dbCategories.get(null);
    if (!Array.isArray(list) || list.length === 0) {
      list = readCategoriesFile();
      if (Array.isArray(list) && list.length > 0) await dbCategories.set(list);
    }
    return Array.isArray(list) && list.length > 0 ? list : defaultCategories;
  }
  return readCategoriesFile();
};
const writeCategories = async (list) => {
  if (useDb()) return await dbCategories.set(list);
  return writeCategoriesFile(list);
};

// Analytics (DB sau JSON)
const readAnalyticsFile = () => {
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) {
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ views: [] }));
      return { views: [] };
    }
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
  } catch (error) {
    console.error('Eroare la citirea analytics:', error);
    return { views: [] };
  }
};
const writeAnalyticsFile = (data) => {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Eroare la scrierea analytics:', error);
    return false;
  }
};
const readAnalytics = async () => {
  if (useDb()) {
    let data = await dbAnalytics.get(null);
    if (!data || !data.views) {
      data = readAnalyticsFile();
      if (data && Array.isArray(data.views)) await dbAnalytics.set(data);
    }
    return data && typeof data === 'object' ? data : { views: [] };
  }
  return readAnalyticsFile();
};
const writeAnalytics = async (data) => {
  if (useDb()) return await dbAnalytics.set(data);
  return writeAnalyticsFile(data);
};

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Slug pentru foldere: doar caractere sigure
function slugForFolder(str) {
  if (!str || typeof str !== 'string') return 'general';
  return str
    .trim()
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9\u0080-\u024F\-_\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase() || 'general';
}

// GET - Obține toate produsele
app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

// GET - Obține un produs după ID
app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Produs nu a fost găsit' });
  }
});

// POST - Adaugă un produs nou (admin only)
app.post('/api/products', requireAdmin, (req, res) => {
  const products = readProducts();
  const newProduct = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  
  if (writeProducts(products)) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: 'Eroare la salvarea produsului' });
  }
});

// PUT - Actualizează un produs (admin only)
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Produs nu a fost găsit' });
  }
  
  products[index] = {
    ...products[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  
  if (writeProducts(products)) {
    res.json(products[index]);
  } else {
    res.status(500).json({ error: 'Eroare la actualizarea produsului' });
  }
});

// DELETE - Șterge un produs (admin only)
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const products = readProducts();
  const filteredProducts = products.filter(p => p.id !== req.params.id);
  
  if (products.length === filteredProducts.length) {
    return res.status(404).json({ error: 'Produs nu a fost găsit' });
  }
  
  if (writeProducts(filteredProducts)) {
    res.json({ message: 'Produs șters cu succes' });
  } else {
    res.status(500).json({ error: 'Eroare la ștergerea produsului' });
  }
});

// TEST endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is working!' });
});

// POST - Adaugă un mesaj nou din formularul de contact
app.post('/api/messages', async (req, res) => {
  console.log('📧 POST /api/messages called!', req.body);
  try {
    const { fullName, email, phone, message, timestamp } = req.body;
    
    if (!fullName || !email || !message) {
      return res.status(400).json({ error: 'Numele, emailul și mesajul sunt obligatorii' });
    }

    const messages = await readMessages();
    const newMessage = {
      id: Date.now().toString(),
      fullName,
      email,
      phone: phone != null ? String(phone).trim() : '',
      message,
      timestamp: timestamp || new Date().toISOString(),
      read: false,
    };

    messages.push(newMessage);
    if (await writeMessages(messages)) {
      const settings = await readAdminSettings();
      const toEmail = (settings?.notificationsEmail || process.env.NOTIFICATIONS_EMAIL || '').trim();
      if (toEmail && toEmail.includes('@')) {
        const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
        if (!hasSmtp) {
          console.warn('[Contact] Notificare email: SMTP nu e configurat. Setează SMTP_USER și SMTP_PASS în .env pentru a trimite mesajele pe email.');
        }
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS || ''
            } : undefined
          });
          if (transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const phoneLine = newMessage.phone ? `\nTelefon: ${newMessage.phone}` : '';
            const phoneHtml = newMessage.phone ? `<p><strong>Telefon:</strong> ${newMessage.phone}</p>` : '';
            const notifPhone = (settings?.notificationsPhone || '').trim();
            const notifPhoneLine = notifPhone ? `\n\nContact notificări (opțional): ${notifPhone}` : '';
            const notifPhoneHtml = notifPhone ? `<p><em>Dacă dorești, poți contacta și la: ${notifPhone}</em></p>` : '';
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: toEmail,
              subject: `[Contact] Mesaj de la ${fullName}`,
              text: `Nume: ${fullName}\nEmail: ${email}${phoneLine}\n\nMesaj:\n${message}${notifPhoneLine}`,
              html: `<p><strong>Nume:</strong> ${fullName}</p><p><strong>Email:</strong> ${email}</p>${phoneHtml}<p><strong>Mesaj:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>${notifPhoneHtml}`
            });
          }
        } catch (mailErr) {
          console.error('Eroare la trimiterea email notificare:', mailErr);
        }
      }
      res.status(201).json({ message: 'Mesaj salvat cu succes', id: newMessage.id });
    } else {
      res.status(500).json({ error: 'Eroare la salvarea mesajului' });
    }
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Eroare la salvarea mesajului' });
  }
});

// POST - Salvează metadata de la click pe email/whatsapp/viber (fără autentificare, public)
app.post('/api/email-track', async (req, res) => {
  try {
    const { device, city, lang, page, pageDetails, source } = req.body;
    const messages = await readMessages();
    const newEntry = {
      id: Date.now().toString(),
      fullName: source === 'whatsapp' ? 'WhatsApp Click' : source === 'viber' ? 'Viber Click' : 'Email Click',
      email: '',
      phone: '',
      message: pageDetails || page || 'Vizitator a apăsat butonul de contact',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'contact-click',
      metadata: { device: device || '', city: city || '', lang: lang || '', page: page || '', source: source || 'email' },
    };
    messages.push(newEntry);
    await writeMessages(messages);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Error saving email-track:', err);
    res.status(500).json({ error: 'Eroare internă' });
  }
});

// GET - Obține toate mesajele (admin only)
app.get('/api/admin/messages', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized - token missing' });
  }

  const messages = await readMessages();
  res.json(messages);
});

const normAbout = (it) => {
  const s = (v) => (v != null ? String(v) : '');
  return {
    ...it,
    aboutDescription: s(it.aboutDescription),
    aboutDescription_ro: s(it.aboutDescription_ro || it.aboutDescription),
    aboutDescription_en: s(it.aboutDescription_en),
    aboutDescription_ru: s(it.aboutDescription_ru)
  };
};
// GET - Obține toate imaginile din galerie (fiecare item cu aboutDescription normalizat)
app.get('/api/gallery', async (req, res) => {
  const gallery = await readGallery();
  res.json(gallery.map(normAbout));
});

// GET - Categorii (public, pentru site)
app.get('/api/categories', async (req, res) => {
  res.json(await readCategories());
});

// POST - Adaugă categorie (admin)
app.post('/api/categories', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) return res.status(401).json({ error: 'Unauthorized' });
  const { id, label } = req.body || {};
  if (!id || !label || typeof id !== 'string' || typeof label !== 'string') {
    return res.status(400).json({ error: 'id și label sunt obligatorii' });
  }
  const safeId = id.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || 'categorie';
  const list = await readCategories();
  if (list.some((c) => c.id === safeId)) return res.status(400).json({ error: 'Există deja o categorie cu acest id' });
  list.push({ id: safeId, label: label.trim() });
  await writeCategories(list);
  res.status(201).json({ id: safeId, label: label.trim() });
});

// PUT - Actualizează categorie (admin)
app.put('/api/categories/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) return res.status(401).json({ error: 'Unauthorized' });
  const { label } = req.body || {};
  if (typeof label !== 'string' || !label.trim()) return res.status(400).json({ error: 'label obligatoriu' });
  const list = await readCategories();
  const idx = list.findIndex((c) => String(c.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Categorie negăsită' });
  list[idx].label = label.trim();
  await writeCategories(list);
  res.json(list[idx]);
});

// DELETE - Șterge categorie (admin)
app.delete('/api/categories/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) return res.status(401).json({ error: 'Unauthorized' });
  const list = await readCategories();
  const filtered = list.filter((c) => String(c.id) !== String(req.params.id));
  if (filtered.length === list.length) return res.status(404).json({ error: 'Categorie negăsită' });
  await writeCategories(filtered);
  res.status(204).end();
});

// GET - Obține un item din galerie după ID (acceptă id string sau number în URL)
app.get('/api/gallery/:id', async (req, res) => {
  const gallery = await readGallery();
  const idParam = req.params.id;
  const item = gallery.find((it) => String(it.id) === String(idParam));
  if (!item) {
    return res.status(404).json({ error: 'Element nu a fost găsit' });
  }
  const str = (v) => (v != null ? String(v) : '');
  const out = {
    ...item,
    aboutDescription: str(item.aboutDescription),
    aboutDescription_ro: str(item.aboutDescription_ro || item.aboutDescription),
    aboutDescription_en: str(item.aboutDescription_en),
    aboutDescription_ru: str(item.aboutDescription_ru)
  };
  res.json(out);
});

function translateReviewText(originalText, sourceLang) {
  return translateFromAny(originalText, sourceLang);
}

// Traducere recenzie cu fallback MyMemory când dicționarul local nu are cuvântul (orice limbă → ro, en, ru)
async function translateReviewTextAsync(originalText, sourceLang) {
  const trimmed = (originalText || '').trim();
  if (!trimmed) return { ro: '', en: '', ru: '' };
  const src = sourceLang || detectLanguage(trimmed);
  let out = translateFromAny(trimmed, src);
  for (const target of ['ro', 'en', 'ru']) {
    if (target === src) continue;
    const val = out[target];
    if (!val || val === trimmed || val.toLowerCase() === trimmed.toLowerCase()) {
      try {
        const translated = await translateWithMyMemory(trimmed, src, target);
        if (translated && translated.trim() && translated !== trimmed) out[target] = translated.trim();
      } catch (e) {
        console.warn('[translate] MyMemory fallback failed:', e?.message);
      }
    }
  }
  out.ro = out.ro || trimmed;
  out.en = out.en || trimmed;
  out.ru = out.ru || trimmed;
  return out;
}

// POST - Adaugă un comentariu/recenzie la un item din galerie (public – vizitatori sau proprietar)
app.post('/api/gallery/:id/reviews', express.json(), async (req, res) => {
  try {
    const { text, title, rating, author, source, lang } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Textul recenziei este obligatoriu' });
    }
    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const gallery = await readGallery();
    const idParam = String(req.params.id || '').trim();
    const index = gallery.findIndex((it) => String(it.id) === idParam);
    if (index === -1) return res.status(404).json({ error: 'Element nu a fost găsit' });
    const item = gallery[index];
    if (!Array.isArray(item.reviews)) item.reviews = [];

    const trimmed = text.trim();
    const sourceLang = ['ro', 'en', 'ru'].includes(lang) ? lang : undefined;
    const translated = await translateReviewTextAsync(trimmed, sourceLang);

    const review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: (title != null ? String(title) : '').trim(),
      text: trimmed,
      text_ro: translated.ro,
      text_en: translated.en,
      text_ru: translated.ru,
      rating: numericRating,
      author: (author != null ? String(author) : '').trim(),
      date: new Date().toISOString(),
      visible: true,
      source: source === 'owner' ? 'owner' : 'visitor'
    };
    item.reviews.push(review);
    if (await writeGallery(gallery)) {
      res.status(201).json({ review, item });
    } else {
      res.status(500).json({ error: 'Eroare la salvarea recenziei' });
    }
  } catch (e) {
    console.error('Eroare POST review:', e);
    res.status(500).json({ error: 'Eroare la adăugarea recenziei' });
  }
});

// GET - Recenzii recente (pentru homepage) – cu produsul și textul
app.get('/api/reviews/recent', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 6, 20);
  const gallery = await readGallery();
  const list = [];
  gallery.forEach((it) => {
    if (!Array.isArray(it.reviews)) return;
    const itemUrl = it.url || (it.details && it.details[0] && it.details[0].images && it.details[0].images[0] && it.details[0].images[0].url) || '';
    it.reviews.forEach((r) => {
      if (r.visible !== false && (r.text || '').trim()) {
        list.push({
          productId: it.id,
          productName: it.description || '',
          productName_en: it.description_en || it.description || '',
          productName_ru: it.description_ru || it.description || '',
          productImage: itemUrl,
          review: {
            id: r.id,
            title: r.title || '',
            text: r.text,
            text_ro: r.text_ro || r.text,
            text_en: r.text_en || r.text,
            text_ru: r.text_ru || r.text,
            rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
            author: r.author,
            date: r.date,
            source: r.source
          }
        });
      }
    });
  });
  list.sort((a, b) => (b.review.date || '').localeCompare(a.review.date || ''));
  res.json(list.slice(0, limit));
});

// GET - Toate recenziile (admin) – pentru filtrare, afișare/ascundere, ștergere
app.get('/api/admin/reviews', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || !isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const gallery = await readGallery();
  const list = [];
  gallery.forEach((it) => {
    (it.reviews || []).forEach((r) => {
      list.push({
        productId: it.id,
        productName: it.description || '',
        productImage: it.url || '',
        review: {
          id: r.id,
          title: r.title || '',
          text: r.text,
          text_ro: r.text_ro || r.text,
          text_en: r.text_en || r.text,
          text_ru: r.text_ru || r.text,
          rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
          author: r.author,
          date: r.date,
          visible: r.visible !== false,
          source: r.source
        }
      });
    });
  });
  list.sort((a, b) => (b.review.date || '').localeCompare(a.review.date || ''));
  res.json(list);
});

// POST - Traduce retroactiv recenziile + descrierile elementelor din galerie (admin)
app.post('/api/admin/reviews/translate-all', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || !isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const gallery = await readGallery();
  let translatedReviews = 0;
  let translatedDescriptions = 0;
  for (const item of gallery) {
    // Traduce description → description_en, description_ru
    if (item.description && item.description.trim()) {
      const descT = translateToAll(item.description);
      if (!item.description_en || !item.description_en.trim()) {
        item.description_en = descT.en;
        translatedDescriptions++;
      }
      if (!item.description_ru || !item.description_ru.trim()) {
        item.description_ru = descT.ru;
      }
    }
    // Traduce recenzii
    if (!Array.isArray(item.reviews)) continue;
    for (const r of item.reviews) {
      if (r.text_ro && r.text_en && r.text_ru) continue;
      if (!r.text || !r.text.trim()) continue;
      const t = translateReviewText(r.text);
      r.text_ro = t.ro;
      r.text_en = t.en;
      r.text_ru = t.ru;
      translatedReviews++;
    }
  }
  if (translatedReviews > 0 || translatedDescriptions > 0) await writeGallery(gallery);
  res.json({
    message: `${translatedReviews} recenzii + ${translatedDescriptions} descrieri traduse.`,
    translatedReviews,
    translatedDescriptions
  });
});

// PATCH - Actualizează vizibilitatea unei recenzii (admin)
app.patch('/api/gallery/:id/reviews/:reviewId', express.json(), async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || !isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const gallery = await readGallery();
  const idParam = String(req.params.id || '').trim();
  const reviewId = String(req.params.reviewId || '').trim();
  const index = gallery.findIndex((it) => String(it.id) === idParam);
  if (index === -1) return res.status(404).json({ error: 'Element nu a fost găsit' });
  const item = gallery[index];
  const rev = (item.reviews || []).find((r) => String(r.id) === reviewId);
  if (!rev) return res.status(404).json({ error: 'Recenzie nu a fost găsită' });
  const { visible } = req.body || {};
  if (typeof visible === 'boolean') rev.visible = visible;
  if (await writeGallery(gallery)) res.json(item);
  else res.status(500).json({ error: 'Eroare la salvare' });
});

// DELETE - Șterge o recenzie (admin)
app.delete('/api/gallery/:id/reviews/:reviewId', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || !isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const gallery = await readGallery();
  const idParam = String(req.params.id || '').trim();
  const reviewId = String(req.params.reviewId || '').trim();
  const index = gallery.findIndex((it) => String(it.id) === idParam);
  if (index === -1) return res.status(404).json({ error: 'Element nu a fost găsit' });
  const item = gallery[index];
  const before = (item.reviews || []).length;
  item.reviews = (item.reviews || []).filter((r) => String(r.id) !== reviewId);
  if (item.reviews.length === before) return res.status(404).json({ error: 'Recenzie nu a fost găsită' });
  if (await writeGallery(gallery)) res.json({ message: 'Recenzie ștearsă', item });
  else res.status(500).json({ error: 'Eroare la salvare' });
});

// POST - Migrează produsele existente în galerie (admin only)
app.post('/api/admin/migrate-products-to-gallery', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const products = readProducts();
    if (!Array.isArray(products) || products.length === 0) {
      return res.json({ migrated: 0 });
    }

    const gallery = await readGallery();
    let migrated = 0;

    products.forEach(p => {
      // determine main image url from product fields
      let imageUrl = '';
      let filename = '';
      if (p.image) {
        imageUrl = p.image;
        filename = path.basename(p.image);
      } else if (Array.isArray(p.images) && p.images.length > 0) {
        imageUrl = p.images[0];
        filename = path.basename(p.images[0]);
      }

      const item = {
        id: Date.now().toString() + Math.random().toString(36).substr(2,6),
        filename: filename || ('prod-' + Date.now()),
        url: imageUrl || '',
        category: p.category || '',
        description: p.description || p.name || '',
        isPrimary: false,
        details: [],
        createdAt: new Date().toISOString()
      };

      gallery.push(item);
      migrated += 1;
    });

    await writeGallery(gallery);
    res.json({ migrated });
  } catch (e) {
    console.error('Migration error:', e);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// POST - Încarcă o imagine în galerie (admin only)
app.post('/api/gallery/upload', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filename, data, category, description, aboutDescription, isPrimary, details, project } = req.body;
    const aboutRo = (req.body.aboutDescription_ro != null ? String(req.body.aboutDescription_ro).trim() : (aboutDescription != null ? String(aboutDescription).trim() : ''));
    const aboutEn = (req.body.aboutDescription_en != null ? String(req.body.aboutDescription_en).trim() : '');
    const aboutRu = (req.body.aboutDescription_ru != null ? String(req.body.aboutDescription_ru).trim() : '');
    if (!filename || !data) {
      return res.status(400).json({ error: 'Filename and data are required' });
    }
    if (!category || String(category).trim() === '') {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Subfoldere: uploads/categorie/lucrare (pentru sortare ușoară în folder)
    const categorySlug = slugForFolder(category);
    const projectSlug = slugForFolder(project || description || 'lucrare');
    const subDir = path.join(UPLOADS_DIR, categorySlug, projectSlug);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }

    // helper to save a dataURI/base64 payload to uploads and return saved filename/url
    const saveData = (fname, payload, useSubDir = true) => {
      let base64Data = payload;
      if (typeof payload === 'string' && payload.startsWith('data:')) {
        const commaIndex = payload.indexOf(',');
        base64Data = payload.substring(commaIndex + 1);
      }
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('Fișier prea mare (max 15MB)');
      if (!isValidImageBuffer(buffer)) throw new Error('Format imagine invalid');
      const safeBase = sanitizeImageFilename(fname);
      const safeName = Date.now() + '-' + (safeBase || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(safeName).toLowerCase();
      const finalName = SAFE_IMAGE_EXTENSIONS.has(ext) ? safeName : safeName + '.jpg';
      const dir = useSubDir ? subDir : UPLOADS_DIR;
      const savePath = path.join(dir, finalName);
      if (useSubDir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(savePath, buffer);
      const relativePath = useSubDir ? path.join(categorySlug, projectSlug, finalName) : finalName;
      const url = '/uploads/' + relativePath.replace(/\\/g, '/');
      return { filename: finalName, url };
    };

    // save main image (în subfolder categorie/lucrare)
    const mainSaved = saveData(filename, data, true);

    // process details (if any) - support multiple images per detail; text_en, text_ru pentru traducere
    // incoming detail format: { title, text, text_en?, text_ru?, images: [{ filename, data }, ...] }
    const processedDetails = Array.isArray(details) ? details.map(d => {
      const out = { title: d.title || '', text: d.text || '', text_en: d.text_en || '', text_ru: d.text_ru || '', images: [] };
      // support legacy single image fields
      if (d.data && d.filename) {
        try {
          const saved = saveData(d.filename, d.data, true);
          out.images.push({ url: saved.url, filename: saved.filename });
        } catch (e) {
          console.warn('Nu am putut salva imagine detaliu:', e);
        }
      }
      // images array
      if (Array.isArray(d.images)) {
        d.images.forEach(img => {
          if (img && img.data && img.filename) {
            try {
              const saved = saveData(img.filename, img.data, true);
              out.images.push({ url: saved.url, filename: saved.filename });
            } catch (e) {
              console.warn('Nu am putut salva imagine detaliu:', e);
            }
          }
        });
      }
      return out;
    }) : [];

    const aboutDesc = (aboutDescription != null) ? String(aboutDescription).trim() : '';
    const descTranslated = translateToAll(description || '');
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      filename: mainSaved.filename,
      url: mainSaved.url,
      category: category || '',
      description: description || '',
      description_en: descTranslated.en,
      description_ru: descTranslated.ru,
      aboutDescription: aboutDesc || aboutRo || '',
      aboutDescription_ro: aboutRo || aboutDesc,
      aboutDescription_en: aboutEn,
      aboutDescription_ru: aboutRu,
      isPrimary: !!isPrimary,
      visible: true,
      details: processedDetails,
      createdAt: new Date().toISOString()
    };

    const gallery = await readGallery();
    // If this new item is marked primary, unset isPrimary for existing items in same category
    if (newItem.isPrimary) {
      gallery.forEach(g => {
        if (g.category === newItem.category) g.isPrimary = false;
      });
    }
    gallery.unshift(newItem);
    await writeGallery(gallery);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Eroare la upload galerie:', error);
    res.status(500).json({ error: 'Eroare la upload' });
  }
});

// PUT - Actualizează un item din galerie (admin only). Suportă mainImage și newExtraImages (base64).
app.put('/api/gallery/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
  try {
    if (process.env.NODE_ENV !== 'production' && body.aboutDescription !== undefined) {
      console.log('[PUT gallery] aboutDescription length:', typeof body.aboutDescription === 'string' ? body.aboutDescription.length : 0);
    }
    const gallery = await readGallery();
    const idParam = String(req.params.id || '').trim();
    if (!idParam) return res.status(400).json({ error: 'ID lipsă' });
    const index = gallery.findIndex(it => String(it.id) === idParam);
    if (index === -1) {
      return res.status(404).json({ error: 'Element nu a fost găsit' });
    }
    const item = gallery[index];
    const { description, category, isPrimary, details: detailsPayload, mainImage, newExtraImages, setMainImageUrl, removeImageUrls, visible, reviews: reviewsPayload } = body;
    const aboutDescriptionFromBody = body.aboutDescription;
    if (typeof aboutDescriptionFromBody === 'string') {
      item.aboutDescription = aboutDescriptionFromBody.trim();
    } else if (aboutDescriptionFromBody !== undefined && aboutDescriptionFromBody !== null) {
      item.aboutDescription = String(aboutDescriptionFromBody).trim();
    } else if (Object.prototype.hasOwnProperty.call(body, 'aboutDescription')) {
      item.aboutDescription = '';
    }
    ['ro', 'en', 'ru'].forEach((lang) => {
      const key = 'aboutDescription_' + lang;
      const val = body[key];
      if (val !== undefined && val !== null) item[key] = String(val).trim();
      else if (Object.prototype.hasOwnProperty.call(body, key)) item[key] = '';
    });
    const deleteFileByUrl = (url) => {
      if (!url || !url.startsWith('/uploads/')) return;
      const rel = url.replace(/^\/uploads\/?/, '').replace(/\//g, path.sep);
      const fullPath = path.resolve(UPLOADS_DIR, rel);
      // Previne path traversal – nu permite ștergerea în afara UPLOADS_DIR
      if (!fullPath.startsWith(path.resolve(UPLOADS_DIR))) return;
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { console.warn('Nu am putut șterge fișierul:', e); }
      }
    };
    if (description !== undefined) {
      item.description = description;
      const descT = translateToAll(description);
      item.description_en = descT.en;
      item.description_ru = descT.ru;
    }
    if (category !== undefined) item.category = category;
    if (visible !== undefined) item.visible = !!visible;
    if (Array.isArray(reviewsPayload)) {
      const existingReviews = Array.isArray(item.reviews) ? item.reviews : [];
      item.reviews = reviewsPayload.map((r, i) => {
        const textVal = typeof r.text === 'string' ? r.text.trim() : '';
        const existing = existingReviews.find(er => er.id === r.id);
        const needsTranslation = !existing || existing.text !== textVal || !existing.text_en;
        const translated = needsTranslation && textVal ? translateToAll(textVal) : null;
        return {
          id: r.id || `rev_${Date.now()}_${i}`,
          title: r.title != null ? String(r.title).trim() : '',
          text: textVal,
          text_ro: translated ? translated.ro : (existing?.text_ro || textVal),
          text_en: translated ? translated.en : (existing?.text_en || ''),
          text_ru: translated ? translated.ru : (existing?.text_ru || ''),
          rating: Math.max(1, Math.min(5, Number(r.rating) || Number(existing?.rating) || 5)),
          author: r.author != null ? String(r.author).trim() : '',
          date: r.date != null ? String(r.date).trim() : '',
          visible: r.visible !== false,
          source: r.source === 'owner' ? 'owner' : (r.source === 'visitor' ? 'visitor' : undefined)
        };
      });
    }
    if (isPrimary !== undefined) {
      item.isPrimary = !!isPrimary;
      if (item.isPrimary) {
        gallery.forEach((g, i) => {
          if (i !== index && g.category === item.category) g.isPrimary = false;
        });
      }
    }
    if (Array.isArray(detailsPayload)) {
      const existing = item.details || [];
      const extraRow = existing.find(d => !d.title && !d.text);
      item.details = detailsPayload.map((d) => {
        const title = typeof d.title === 'string' ? d.title.trim() : '';
        const text = typeof d.text === 'string' ? d.text.trim() : '';
        const text_en = typeof d.text_en === 'string' ? d.text_en.trim() : '';
        const text_ru = typeof d.text_ru === 'string' ? d.text_ru.trim() : '';
        const existingItem = existing.find(e => (e.title || '').trim() === title);
        const images = (existingItem && Array.isArray(existingItem.images)) ? existingItem.images : [];
        return { title, text, text_en, text_ru, images };
      });
      if (extraRow && Array.isArray(extraRow.images) && extraRow.images.length > 0) {
        item.details.push({ title: '', text: '', text_en: '', text_ru: '', images: extraRow.images });
      }
    }
    const categorySlug = slugForFolder(item.category);
    const projectSlug = slugForFolder(item.description || 'lucrare');
    const subDir = path.join(UPLOADS_DIR, categorySlug, projectSlug);
    const saveDataToSubdir = (fname, payload) => {
      let base64Data = payload;
      if (typeof payload === 'string' && payload.startsWith('data:')) {
        const commaIndex = payload.indexOf(',');
        base64Data = payload.substring(commaIndex + 1);
      }
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('Fișier prea mare (max 15MB)');
      if (!isValidImageBuffer(buffer)) throw new Error('Format imagine invalid');
      const safeBase = sanitizeImageFilename(fname);
      const safeName = Date.now() + '-' + (safeBase || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(safeName).toLowerCase();
      const finalName = SAFE_IMAGE_EXTENSIONS.has(ext) ? safeName : safeName + '.jpg';
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      const savePath = path.join(subDir, finalName);
      fs.writeFileSync(savePath, buffer);
      const relativePath = path.join(categorySlug, projectSlug, finalName);
      const url = '/uploads/' + relativePath.replace(/\\/g, '/');
      return { filename: finalName, url };
    };
    if (mainImage && mainImage.filename && mainImage.data) {
      try {
        const saved = saveDataToSubdir(mainImage.filename, mainImage.data);
        const oldUrl = item.url;
        item.filename = saved.filename;
        item.url = saved.url;
        if (oldUrl && oldUrl.startsWith('/uploads/')) {
          const oldPath = path.join(UPLOADS_DIR, oldUrl.replace(/^\/uploads\/?/, '').replace(/\//g, path.sep));
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Nu am putut șterge vechea imagine:', e); }
          }
        }
      } catch (e) {
        console.warn('Nu am putut salva noua imagine principală:', e);
      }
    }
    if (Array.isArray(newExtraImages) && newExtraImages.length > 0) {
      if (!item.details) item.details = [];
      let extraRow = item.details.find(d => !d.title && !d.text);
      if (!extraRow) {
        extraRow = { title: '', text: '', images: [] };
        item.details.push(extraRow);
      }
      if (!Array.isArray(extraRow.images)) extraRow.images = [];
      newExtraImages.forEach(img => {
        if (img && img.filename && img.data) {
          try {
            const saved = saveDataToSubdir(img.filename, img.data);
            extraRow.images.push({ url: saved.url, filename: saved.filename });
          } catch (e) {
            console.warn('Nu am putut salva imagine suplimentară:', e);
          }
        }
      });
    }
    // Setează o imagine existentă ca principală (căutată în orice rând din details)
    if (setMainImageUrl && typeof setMainImageUrl === 'string') {
      const url = setMainImageUrl.trim();
      if (url === item.url) {
        // deja e principală
      } else {
        let found = null;
        let rowWithImage = null;
        if (Array.isArray(item.details)) {
          for (const row of item.details) {
            if (!Array.isArray(row.images)) continue;
            const img = row.images.find(i => i && i.url === url);
            if (img) {
              found = img;
              rowWithImage = row;
              break;
            }
          }
        }
        if (found && rowWithImage) {
          const oldMainUrl = item.url;
          const oldMainFilename = item.filename;
          item.url = found.url;
          item.filename = found.filename || '';
          rowWithImage.images = rowWithImage.images.filter(i => i && i.url !== url);
          // Mută vechea imagine principală în rândul „extra” (fără titlu/text)
          if (oldMainUrl && oldMainUrl.startsWith('/uploads/')) {
            if (!item.details) item.details = [];
            let extraRow = item.details.find(d => !d.title && !d.text);
            if (!extraRow) {
              extraRow = { title: '', text: '', images: [] };
              item.details.push(extraRow);
            }
            extraRow.images = extraRow.images || [];
            extraRow.images.push({ url: oldMainUrl, filename: oldMainFilename || '' });
          }
        }
      }
    }
    // Elimină imaginile după URL (principală sau din orice rând details)
    const toRemove = Array.isArray(removeImageUrls) ? removeImageUrls.filter(u => typeof u === 'string' && u.trim()) : [];
    toRemove.forEach(removeUrl => {
      if (item.url === removeUrl) {
        deleteFileByUrl(removeUrl);
        item.url = '';
        item.filename = '';
        return;
      }
      if (!Array.isArray(item.details)) return;
      for (const row of item.details) {
        if (!Array.isArray(row.images)) continue;
        const idx = row.images.findIndex(img => img && img.url === removeUrl);
        if (idx !== -1) {
          deleteFileByUrl(removeUrl);
          row.images.splice(idx, 1);
          return;
        }
      }
    });
    if (item.aboutDescription === undefined) item.aboutDescription = '';
    const written = await writeGallery(gallery);
    if (!written) {
      return res.status(500).json({ error: 'Nu s-a putut salva pe disc' });
    }
    res.json({ ...gallery[index], aboutDescription: gallery[index].aboutDescription ?? '' });
  } catch (error) {
    console.error('Eroare la actualizarea galeriei:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// DELETE - Șterge o imagine din galerie (admin only)
app.delete('/api/gallery/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const gallery = await readGallery();
    const index = gallery.findIndex(item => String(item.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Element nu a fost găsit' });
    }

    const [removed] = gallery.splice(index, 1);
    // șterge fișierul (cu protecție path traversal)
    const safeDelete = (fp) => {
      const resolved = path.resolve(fp);
      if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) return;
      if (fs.existsSync(resolved)) {
        try { fs.unlinkSync(resolved); } catch (e) { console.warn('Nu am putut șterge fișierul:', e); }
      }
    };
    safeDelete(path.join(UPLOADS_DIR, removed.filename));

    // șterge imaginile din detalii dacă există (support multiple images)
    if (Array.isArray(removed.details)) {
      removed.details.forEach(d => {
        // legacy single filename property
        if (d.imageFilename) {
          safeDelete(path.join(UPLOADS_DIR, d.imageFilename));
        }
        // images array
        if (Array.isArray(d.images)) {
          d.images.forEach(img => {
            const fname = img.filename || img.imageFilename;
            if (fname) {
              safeDelete(path.join(UPLOADS_DIR, fname));
            }
          });
        }
      });
    }

    await writeGallery(gallery);
    res.json({ message: 'Imagine ștearsă cu succes' });
  } catch (error) {
    console.error('Eroare la ștergerea imaginii:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET - Obține un mesaj după ID (admin only)
app.get('/api/admin/messages/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const messages = await readMessages();
  const message = messages.find(m => m.id === req.params.id);
  
  if (!message) {
    return res.status(404).json({ error: 'Mesaj nu a fost găsit' });
  }

  res.json(message);
});

// PUT - Marchează un mesaj ca citit (admin only)
app.put('/api/admin/messages/:id/read', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const messages = await readMessages();
  const index = messages.findIndex(m => m.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Mesaj nu a fost găsit' });
  }

  messages[index].read = true;
  if (await writeMessages(messages)) {
    res.json({ message: 'Mesajul a fost marcat ca citit' });
  } else {
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

// DELETE - Șterge un mesaj (admin only)
app.delete('/api/admin/messages/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized - token missing' });
  }

  const messages = await readMessages();
  const filteredMessages = messages.filter(m => m.id !== req.params.id);
  
  if (messages.length === filteredMessages.length) {
    return res.status(404).json({ error: 'Mesaj nu a fost găsit' });
  }
  
  if (await writeMessages(filteredMessages)) {
    res.json({ message: 'Mesaj șters cu succes' });
  } else {
    res.status(500).json({ error: 'Eroare la ștergerea mesajului' });
  }
});

// POST - Admin login (acceptă email SAU nume utilizator). Mesaj generic la eșec.
app.post('/api/admin/login', async (req, res) => {
  const loginInput = (req.body && (req.body.email != null ? req.body.email : req.body.username));
  const password = (req.body && req.body.password) != null ? String(req.body.password) : '';

  if (!loginInput || !password) {
    return res.status(400).json({ error: 'Credențiale invalide' });
  }

  const inputStr = String(loginInput).toLowerCase().trim();

  let creds = DEFAULT_ADMIN_SETTINGS.credentials;
  let profile = DEFAULT_ADMIN_SETTINGS.profile;
  try {
    const settings = await readAdminSettings();
    if (settings && settings.credentials && typeof settings.credentials === 'object') {
      creds = settings.credentials;
    }
    if (settings && settings.profile && typeof settings.profile === 'object') {
      profile = settings.profile;
    }
  } catch (e) {
    console.error('Login: citire setări:', e && e.message);
  }

  const storedPass = creds.password != null ? String(creds.password) : '';
  if (!storedPass || storedPass.length === 0) {
    return res.status(401).json({ error: 'Credențiale invalide' });
  }

  const emailMatch = creds.email && String(creds.email).toLowerCase() === inputStr;
  const userMatch = profile && profile.username && String(profile.username).toLowerCase() === inputStr;
  if (!emailMatch && !userMatch) {
    return res.status(401).json({ error: 'Credențiale invalide' });
  }

  let passwordValid = false;
  if (isPasswordHash(storedPass)) {
    try {
      passwordValid = await bcrypt.compare(password, storedPass);
    } catch (e) {
      console.error('bcrypt.compare:', e && e.message);
      return res.status(500).json({ error: 'Credențiale invalide' });
    }
  } else {
    passwordValid = password === storedPass;
    if (passwordValid) {
      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      try {
        const settings = await readAdminSettings();
        if (settings && settings.credentials) {
          settings.credentials.password = hashed;
          await writeAdminSettings(settings);
        }
      } catch (e) {
        console.error('Migrare parolă bcrypt:', e && e.message);
      }
    }
  }

  if (!passwordValid) {
    secureLog('login_fail', req, { email: inputStr });
    return res.status(401).json({ error: 'Credențiale invalide' });
  }

  const token = jwt.sign(
    { sub: (creds && creds.uid) || 'admin', email: (creds && creds.email) || '' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  secureLog('login_ok', req, { email: (creds && creds.email) || inputStr });
  return res.json({
    token,
    user: {
      email: (creds && creds.email) ? String(creds.email) : '',
      displayName: (profile && profile.username) ? String(profile.username) : 'Admin'
    }
  });
});

// POST - Logout admin (adaugă token-ul în blacklist)
app.post('/api/admin/logout', express.json(), (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token && typeof token === 'string') {
    tokenBlacklist.add(token);
    secureLog('logout', req);
  }
  res.json({ message: 'Delogat cu succes' });
});

// POST - Schimbă parola admin (admin only) – validare complexitate + bcrypt
app.post('/api/admin/change-password', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Parola curentă și cea nouă sunt obligatorii' });
    }
    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({ error: 'Parola trebuie să aibă minim 8 caractere, o literă mare, o literă mică, o cifră și un simbol' });
    }

    const settings = await readAdminSettings();
    if (!settings || !settings.credentials) {
      return res.status(500).json({ error: 'Eroare la citirea setărilor' });
    }

    const stored = settings.credentials.password != null ? String(settings.credentials.password) : '';
    if (!stored) {
      return res.status(401).json({ error: 'Parola curentă este incorectă' });
    }

    let currentValid = false;
    if (isPasswordHash(stored)) {
      currentValid = await bcrypt.compare(currentPassword, stored);
    } else {
      currentValid = currentPassword === stored;
    }
    if (!currentValid) {
      return res.status(401).json({ error: 'Parola curentă este incorectă' });
    }

    settings.credentials.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    if (await writeAdminSettings(settings)) {
      secureLog('password_changed', req, { message: 'Parolă actualizată' });
      res.json({ message: 'Parolă actualizată cu succes' });
    } else {
      res.status(500).json({ error: 'Eroare la salvarea parolei' });
    }
  } catch (error) {
    console.error('Eroare la schimbarea parolei:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET - Obține setările admin (admin only)
app.get('/api/admin/settings', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const settings = await readAdminSettings();
  if (!settings) {
    return res.status(500).json({ error: 'Eroare la citirea setărilor' });
  }
  const credsSafe = settings.credentials && typeof settings.credentials === 'object'
    ? (() => { const { password, ...r } = settings.credentials; return r; })()
    : {};
  res.json({ ...settings, credentials: credsSafe });
});

// GET - Loguri securitate (admin only) – ultimele N linii pentru monitorizare
app.get('/api/admin/logs', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const n = Math.min(parseInt(req.query.n, 10) || 200, 500);
  try {
    if (!fs.existsSync(SECURITY_LOG_FILE)) {
      return res.json({ lines: [], message: 'Fișier log încă necreat.' });
    }
    const raw = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean).slice(-n);
    const parsed = lines.map((l) => {
      try {
        return JSON.parse(l);
      } catch (_) {
        return { raw: l };
      }
    });
    res.json({ lines: parsed });
  } catch (e) {
    console.error('Eroare citire log:', e?.message);
    res.status(500).json({ error: 'Eroare la citirea logurilor' });
  }
});

// PUT - Actualizează setările admin (admin only)
app.put('/api/admin/settings', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { profile, credentials, notificationsEmail, notificationsPhone } = req.body;
  
  if (!profile && !credentials && notificationsEmail === undefined && notificationsPhone === undefined) {
    return res.status(400).json({ error: 'Niciun câmp de actualizat' });
  }

  const currentSettings = await readAdminSettings();
  if (!currentSettings) {
    return res.status(500).json({ error: 'Eroare la citirea setărilor' });
  }

  if (profile) {
    currentSettings.profile = { ...currentSettings.profile, ...profile };
  }
  if (credentials) {
    const { password: _drop, ...rest } = credentials;
    currentSettings.credentials = { ...currentSettings.credentials, ...rest };
  }
  if (notificationsEmail !== undefined) {
    currentSettings.notificationsEmail = typeof notificationsEmail === 'string' ? notificationsEmail.trim() : '';
  }
  if (notificationsPhone !== undefined) {
    currentSettings.notificationsPhone = typeof notificationsPhone === 'string' ? notificationsPhone.trim() : '';
  }

  if (await writeAdminSettings(currentSettings)) {
    res.json({ message: 'Setări actualizate cu succes', settings: currentSettings });
  } else {
    res.status(500).json({ error: 'Eroare la salvarea setărilor' });
  }
});

/* ─── Site Content (CMS) ─── */
const DEFAULT_SITE_CONTENT = { translations: { ro: {}, en: {}, ru: {} }, images: {} };
const readSiteContent = () => {
  try {
    if (!fs.existsSync(SITE_CONTENT_FILE)) {
      fs.writeFileSync(SITE_CONTENT_FILE, JSON.stringify(DEFAULT_SITE_CONTENT, null, 2));
      return { ...DEFAULT_SITE_CONTENT };
    }
    const raw = fs.readFileSync(SITE_CONTENT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : { ...DEFAULT_SITE_CONTENT };
  } catch (e) {
    console.error('Eroare citire siteContent:', e?.message);
    return { ...DEFAULT_SITE_CONTENT };
  }
};
const writeSiteContent = (content) => {
  try {
    fs.writeFileSync(SITE_CONTENT_FILE, JSON.stringify(content, null, 2));
    return true;
  } catch (e) {
    console.error('Eroare scriere siteContent:', e?.message);
    return false;
  }
};

// GET - Public endpoint for site content overrides
app.get('/api/site-content', (req, res) => {
  const content = readSiteContent();
  res.json(content);
});

// PUT - Admin only: update site content
app.put('/api/admin/site-content', (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { translations, images } = req.body || {};
  if (!translations && !images) {
    return res.status(400).json({ error: 'Niciun câmp de actualizat' });
  }
  const current = readSiteContent();
  if (translations && typeof translations === 'object') {
    for (const lang of ['ro', 'en', 'ru']) {
      if (translations[lang] && typeof translations[lang] === 'object') {
        if (!current.translations) current.translations = { ro: {}, en: {}, ru: {} };
        if (!current.translations[lang]) current.translations[lang] = {};
        Object.assign(current.translations[lang], translations[lang]);
        // Remove keys set to empty string (revert to default)
        for (const [k, v] of Object.entries(current.translations[lang])) {
          if (v === '') delete current.translations[lang][k];
        }
      }
    }
  }
  if (images && typeof images === 'object') {
    if (!current.images) current.images = {};
    Object.assign(current.images, images);
    for (const [k, v] of Object.entries(current.images)) {
      if (v === '') delete current.images[k];
    }
  }
  if (writeSiteContent(current)) {
    res.json({ message: 'Conținut actualizat', content: current });
  } else {
    res.status(500).json({ error: 'Eroare la salvare' });
  }
});

// POST - Înregistrează o vizionare (path + ip, opțional geo)
  // POST - Upload media (imagine/video) pentru site-content (admin)
  const SAFE_MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.ogg']);
  app.post('/api/admin/site-content/upload', async (req, res) => {
    const adminToken = req.headers['x-admin-token'];
    if (!isValidAdminToken(adminToken)) return res.status(401).json({ error: 'Unauthorized' });
    const { filename, data } = req.body || {};
    if (!filename || !data) return res.status(400).json({ error: 'filename și data sunt obligatorii' });
    try {
      const base64Data = typeof data === 'string' && data.includes(',') ? data.split(',')[1] : data;
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 30 * 1024 * 1024) return res.status(400).json({ error: 'Fișier prea mare (max 30MB)' });
      const siteDir = path.join(UPLOADS_DIR, 'site-content');
      if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });
      const rawBase = path.basename(String(filename)).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
      const ext = path.extname(rawBase).toLowerCase();
      // Validare magic bytes pentru imagini (video-urile trec fără – sunt prea variate)
      const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
      if (IMAGE_EXTS.has(ext) && !isValidImageBuffer(buffer)) {
        return res.status(400).json({ error: 'Conținutul fișierului nu corespunde extensiei imagine' });
      }
      const safeName = Date.now() + '-' + (SAFE_MEDIA_EXTENSIONS.has(ext) ? rawBase : rawBase + '.jpg');
      const savePath = path.resolve(siteDir, safeName);
      if (!savePath.startsWith(path.resolve(siteDir))) return res.status(400).json({ error: 'Nume fișier invalid' });
      fs.writeFileSync(savePath, buffer);
      res.json({ url: '/uploads/site-content/' + safeName });
    } catch (e) {
      console.error('Eroare upload site-content:', e);
      res.status(500).json({ error: 'Eroare la upload' });
    }
  });

  // POST - Înregistrează o vizionare (path + ip, opțional geo)
app.post('/api/analytics/view', async (req, res) => {
  try {
    const path = req.body?.path || req.path || '/';
    const ip = getClientIp(req);
    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    const device = /ipad|tablet/.test(ua) ? 'Tablet' : /android|iphone|mobile/.test(ua) ? 'Mobile' : 'Desktop';
    const view = { path: path === '' ? '/' : path, ts: new Date().toISOString(), ip: ip || null, device };
    const data = await readAnalytics();
    data.views = data.views || [];
    data.views.push(view);
    // Păstrăm maxim 10000 vizionări
    if (data.views.length > 10000) {
      data.views = data.views.slice(-8000);
    }
    await writeAnalytics(data);
    res.status(204).end();
    // Opțional: rezolvă geo în background (doar pentru IP-uri reale, nu localhost)
    const IP_REGEX = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
    if (ip && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && IP_REGEX.test(ip)) {
      fetch(`http://ip-api.com/json/${ip}?fields=country,city`, { signal: AbortSignal.timeout(2000) })
        .then((r) => r.json())
        .then(async (geo) => {
          if (geo && (geo.country || geo.city)) {
            const d = await readAnalytics();
            const last = d.views[d.views.length - 1];
            if (last && last.ts === view.ts) {
              last.country = geo.country || null;
              last.city = geo.city || null;
              await writeAnalytics(d);
            }
          }
        })
        .catch(() => {});
    }
  } catch (error) {
    console.error('Eroare la înregistrarea vizionării:', error);
    res.status(500).end();
  }
});

// GET - Rezumat analytics (admin only)
app.get('/api/analytics/summary', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const data = await readAnalytics();
    const views = data.views || [];
    const totalViews = views.length;
    const byPath = {};
    const byDay = {};
    const byHour = {};
    const byCountry = {};
    const byCity = {};
    const byRegion = {};
    const byDevice = {};
    const byPathPerDay = {}; // { "2026-02-18": { "/": 3, "/galerie": 2 } }

    views.forEach((v) => {
      const p = v.path || '/';
      byPath[p] = (byPath[p] || 0) + 1;
      try {
        let day = null;
        if (v.ts) {
          const dObj = new Date(v.ts);
          day = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
        }
        if (day) {
          byDay[day] = (byDay[day] || 0) + 1;
          if (!byPathPerDay[day]) byPathPerDay[day] = {};
          byPathPerDay[day][p] = (byPathPerDay[day][p] || 0) + 1;
        }
        const hour = v.ts ? new Date(v.ts).getHours() : null;
        if (hour !== null) byHour[hour] = (byHour[hour] || 0) + 1;
      } catch (_) {}
      if (v.country) byCountry[v.country] = (byCountry[v.country] || 0) + 1;
      if (v.city) byCity[v.city] = (byCity[v.city] || 0) + 1;
      const regionKey = v.country || 'Necunoscut';
      byRegion[regionKey] = (byRegion[regionKey] || 0) + 1;
      const deviceKey = v.device || 'Unknown';
      byDevice[deviceKey] = (byDevice[deviceKey] || 0) + 1;
    });
    const sortedPaths = Object.entries(byPath).sort((a, b) => b[1] - a[1]);
    const mostViewed = sortedPaths[0] ? { path: sortedPaths[0][0], count: sortedPaths[0][1] } : null;
    const recent = views.slice(-500).reverse().map((v) => ({
      path: v.path,
      ts: v.ts,
      country: v.country || null,
      city: v.city || null,
      device: v.device || 'Unknown',
      ip: v.ip ? v.ip.replace(/(\d+)$/, '.***') : null
    }));
    res.json({ totalViews, byPath, byDay, byHour, byCountry, byCity, byRegion, byDevice, byPathPerDay, mostViewed, recent });
  } catch (error) {
    console.error('Eroare la citirea analytics:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET - Export analytics as CSV (admin only)
app.get('/api/analytics/export', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const data = await readAnalytics();
    const views = data.views || [];
    const period = req.query.period || 'all'; // last_month, last_6_months, last_year, all
    const now = new Date();
    let fromDate = null;

    if (period === 'last_month') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (period === 'last_6_months') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else if (period === 'last_year') {
      fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const format = req.query.format || 'csv'; // csv, json or json_graphs
    let filtered = views;
    if (fromDate) {
      const fromStr = fromDate.toISOString();
      filtered = views.filter((v) => v.ts && v.ts >= fromStr);
    }

    if (format === 'json') {
      const exportData = filtered.map((v) => ({
        path: v.path,
        timestamp: v.ts,
        country: v.country || '',
        city: v.city || '',
      }));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${period}_${now.toISOString().slice(0, 10)}.json"`);
      return res.json(exportData);
    }

    if (format === 'json_graphs') {
      const byDay = {};
      const byHour = {};
      const byPath = {};
      const byCountry = {};
      const byRegion = {};
      const byDevice = {};

      filtered.forEach((v) => {
        const p = v.path || '/';
        byPath[p] = (byPath[p] || 0) + 1;
        if (v.country) byCountry[v.country] = (byCountry[v.country] || 0) + 1;
        const regionKey = v.country || 'Necunoscut';
        byRegion[regionKey] = (byRegion[regionKey] || 0) + 1;
        const deviceKey = v.device || 'Unknown';
        byDevice[deviceKey] = (byDevice[deviceKey] || 0) + 1;
        try {
          let day = null;
          if (v.ts) {
            const dObj = new Date(v.ts);
            day = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
          }
          if (day) byDay[day] = (byDay[day] || 0) + 1;
          const hour = v.ts ? new Date(v.ts).getHours() : null;
          if (hour !== null) byHour[hour] = (byHour[hour] || 0) + 1;
        } catch (_) {}
      });

      const exportData = {
        meta: {
          exportedAt: now.toISOString(),
          period,
          totalViews: filtered.length,
        },
        charts: {
          byDay: Object.entries(byDay)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, views]) => ({ date, views })),
          byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, views: byHour[hour] || 0 })),
          byPath: Object.entries(byPath)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([path, views]) => ({ path, views })),
          byCountry: Object.entries(byCountry)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([country, views]) => ({ country, views })),
          byRegion: Object.entries(byRegion)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([region, views]) => ({ region, views })),
          byDevice: Object.entries(byDevice)
            .sort((a, b) => b[1] - a[1])
            .map(([device, views]) => ({ device, views })),
        },
        rows: filtered.map((v) => ({
          path: v.path,
          timestamp: v.ts,
          country: v.country || '',
          city: v.city || '',
        })),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${period}_${now.toISOString().slice(0, 10)}_graphs.json"`);
      return res.json(exportData);
    }

    // CSV export
    const csvRows = ['Pagina,Data,Ora,Țara,Orașul'];
    filtered.forEach((v) => {
      const d = v.ts ? new Date(v.ts) : null;
      const dateStr = d ? d.toLocaleDateString('ro-RO') : '';
      const timeStr = d ? d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '';
      const escapeCsv = (s) => {
        if (!s) return '';
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      csvRows.push([
        escapeCsv(v.path),
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(v.country || ''),
        escapeCsv(v.city || ''),
      ].join(','));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics_${period}_${now.toISOString().slice(0, 10)}.csv"`);
    res.send('\ufeff' + csvRows.join('\n'));
  } catch (error) {
    console.error('Eroare la exportul analytics:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET - Site features/configuration (întotdeauna 200, nu 500)
app.get('/api/site/features', async (req, res) => {
  try {
    let settings;
    try {
      settings = await readAdminSettings();
    } catch (e) {
      settings = null;
    }
    const tryInMyRoom = settings?.features?.tryInMyRoomEnabled !== false;
    res.json({ tryInMyRoomEnabled: tryInMyRoom });
  } catch (err) {
    console.error('Eroare GET /api/site/features:', err);
    res.json({ tryInMyRoomEnabled: true });
  }
});

// PUT - Actualizează site features 
app.put('/api/site/features', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!isValidAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized - token missing' });
  }

  try {
    const { tryInMyRoomEnabled } = req.body;
    
    const settings = await readAdminSettings();
    if (!settings) {
      return res.status(500).json({ error: 'Eroare la citirea setărilor' });
    }

    settings.features = settings.features || {};
    settings.features.tryInMyRoomEnabled = tryInMyRoomEnabled;

    if (await writeAdminSettings(settings)) {
      res.json(settings.features);
    } else {
      res.status(500).json({ error: 'Eroare la salvarea setărilor' });
    }
  } catch (error) {
    console.error('Eroare la actualizarea features:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// POST - Remove background from product image

// Handler global pentru erori neprinse (evită 500 fără mesaj)
app.use((err, req, res, next) => {
  console.error('Eroare neprinsă:', err);
  res.status(500).json({ error: 'Eroare internă de server' });
});

// Servește frontend-ul construit (dist/) pentru producție – SPA fallback
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/images')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log('[API] Frontend (dist/) servit de Express.');
}

// Pornește serverul (obligatoriu pentru /api/* – proxy Vite trimite aici)
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[API] 🚀 Server pornit pe http://localhost:${PORT} – login și /api funcționează acum`);
  const adminExists = fs.existsSync(ADMIN_SETTINGS_FILE);
  console.log(`[API] 📄 adminSettings.json: ${adminExists ? 'există' : 'LIPSEȘTE'}`);

  // Auto-translate reviews that are missing translations
  try {
    const gallery = await readGallery();
    let changed = false;
    gallery.forEach((item) => {
      if (!Array.isArray(item.reviews)) return;
      item.reviews.forEach((rev) => {
        if (rev.text && (!rev.text_en || !rev.text_ru)) {
          const t = translateToAll(rev.text);
          rev.text_ro = t.ro;
          rev.text_en = t.en;
          rev.text_ru = t.ru;
          changed = true;
        }
      });
    });
    if (changed) {
      await writeGallery(gallery);
      console.log('[API] ✅ Recenzii existente traduse automat');
    }
  } catch (e) { console.warn('[API] Nu am putut traduce recenziile:', e); }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[API] ❌ Portul ${PORT} e deja folosit. Oprește alt proces sau schimbă PORT.`);
  } else {
    console.error('[API] ❌ Eroare la pornire:', err.message);
  }
  process.exit(1);
});
