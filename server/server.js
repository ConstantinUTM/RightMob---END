// Pornire server API – trebuie să ruleze pe port 3001 ca proxy-ul Vite să funcționeze
console.log('[API] Încărcare server...');

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { translateToAll, translateText, translateFromAny } from './translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const ADMIN_SETTINGS_FILE = path.join(__dirname, 'adminSettings.json');
const GALLERY_FILE = path.join(__dirname, 'gallery.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const ANALYTICS_FILE = path.join(__dirname, 'analytics.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('[API] Director public/uploads creat.');
}

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

const isValidAdminToken = (token) => token && (token === 'admin-secret-token' || String(token).startsWith('admin-session-token-'));

// Simple rate limiting
const rateLimitMap = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter(time => now - time < windowMs);
  requests.push(now);
  rateLimitMap.set(ip, requests);

  if (requests.length > maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
};

// Admin auth + CSRF guard (Origin/Referer when present)
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1|[\d.]+|[a-zA-Z0-9.-]+):(5173|5174|5175)$/.test(origin);
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
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));
app.get('/favicon.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'favicon.png'));
});

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

// Setări implicite dacă fișierul lipsește sau e invalid
const DEFAULT_ADMIN_SETTINGS = {
  profile: { username: 'Admin', email: 'admin@luxmobila.com', profileImage: '' },
  credentials: { email: 'admin@luxmobila.com', password: 'admin123', uid: 'mock-admin-uid' },
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

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '';
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

// POST - Adaugă un produs nou
app.post('/api/products', (req, res) => {
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

// PUT - Actualizează un produs
app.put('/api/products/:id', (req, res) => {
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

// DELETE - Șterge un produs
app.delete('/api/products/:id', (req, res) => {
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

// POST - Adaugă un comentariu/recenzie la un item din galerie (public – vizitatori sau proprietar)
app.post('/api/gallery/:id/reviews', express.json(), async (req, res) => {
  try {
    const { text, author, source, lang } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Textul recenziei este obligatoriu' });
    }
    const gallery = await readGallery();
    const idParam = String(req.params.id || '').trim();
    const index = gallery.findIndex((it) => String(it.id) === idParam);
    if (index === -1) return res.status(404).json({ error: 'Element nu a fost găsit' });
    const item = gallery[index];
    if (!Array.isArray(item.reviews)) item.reviews = [];

    const trimmed = text.trim();
    const sourceLang = ['ro', 'en', 'ru'].includes(lang) ? lang : undefined;
    const translated = translateReviewText(trimmed, sourceLang);

    const review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      text: trimmed,
      text_ro: translated.ro,
      text_en: translated.en,
      text_ru: translated.ru,
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
          review: { id: r.id, text: r.text, text_ro: r.text_ro || r.text, text_en: r.text_en || r.text, text_ru: r.text_ru || r.text, author: r.author, date: r.date, source: r.source }
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
        review: { id: r.id, text: r.text, text_ro: r.text_ro || r.text, text_en: r.text_en || r.text, text_ru: r.text_ru || r.text, author: r.author, date: r.date, visible: r.visible !== false, source: r.source }
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
  if (!adminToken) return res.status(401).json({ error: 'Unauthorized - token missing' });

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
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized - token missing' });
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
      const safeName = Date.now() + '-' + fname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const dir = useSubDir ? subDir : UPLOADS_DIR;
      const savePath = path.join(dir, safeName);
      if (useSubDir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(savePath, buffer);
      const relativePath = useSubDir ? path.join(categorySlug, projectSlug, safeName) : safeName;
      const url = '/uploads/' + relativePath.replace(/\\/g, '/');
      return { filename: safeName, url };
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
      const fullPath = path.join(UPLOADS_DIR, rel);
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
          text: textVal,
          text_ro: translated ? translated.ro : (existing?.text_ro || textVal),
          text_en: translated ? translated.en : (existing?.text_en || ''),
          text_ru: translated ? translated.ru : (existing?.text_ru || ''),
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
      const safeName = Date.now() + '-' + (fname || 'image').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      const savePath = path.join(subDir, safeName);
      fs.writeFileSync(savePath, buffer);
      const relativePath = path.join(categorySlug, projectSlug, safeName);
      const url = '/uploads/' + relativePath.replace(/\\/g, '/');
      return { filename: safeName, url };
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
    // șterge fișierul
    const filePath = path.join(UPLOADS_DIR, removed.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('Nu am putut șterge fișierul:', e); }
    }

    // șterge imaginile din detalii dacă există (support multiple images)
    if (Array.isArray(removed.details)) {
      removed.details.forEach(d => {
        // legacy single filename property
        if (d.imageFilename) {
          const p = path.join(UPLOADS_DIR, d.imageFilename);
          if (fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch (e) { console.warn('Nu am putut șterge imagine detaliu:', e); }
          }
        }
        // images array
        if (Array.isArray(d.images)) {
          d.images.forEach(img => {
            const fname = img.filename || img.imageFilename;
            if (fname) {
              const p = path.join(UPLOADS_DIR, fname);
              if (fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (e) { console.warn('Nu am putut șterge imagine detaliu:', e); }
              }
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
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized - token missing' });
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
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized - token missing' });
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

// POST - Admin login (acceptă email SAU nume utilizator). Nu aruncă niciodată – răspunde mereu 200/400/401.
app.post('/api/admin/login', async (req, res) => {
  const loginInput = (req.body && (req.body.email != null ? req.body.email : req.body.username));
  const password = (req.body && req.body.password) != null ? String(req.body.password) : '';

  if (!loginInput || !password) {
    return res.status(400).json({ error: 'Utilizator și parolă sunt obligatorii' });
  }

  const inputStr = String(loginInput).toLowerCase().trim();

  // Fallback: credențiale implicite (funcționează și fără adminSettings.json)
  const defaultEmail = 'admin@luxmobila.com';
  const defaultPass = 'admin123';
  if (inputStr === defaultEmail.toLowerCase() && password === defaultPass) {
    const token = 'admin-session-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    return res.json({ token, user: { email: defaultEmail, displayName: 'Admin' } });
  }

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

  try {
    const storedPass = (creds.password != null && String(creds.password).length > 0) ? String(creds.password) : defaultPass;
    const emailMatch = creds.email && String(creds.email).toLowerCase() === inputStr;
    const userMatch = profile && profile.username && String(profile.username).toLowerCase() === inputStr;

    if (!emailMatch && !userMatch) {
      return res.status(401).json({ error: 'Utilizator sau parolă incorectă' });
    }
    if (password !== storedPass) {
      return res.status(401).json({ error: 'Utilizator sau parolă incorectă' });
    }

    const token = 'admin-session-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    return res.json({
      token,
      user: {
        email: (creds && creds.email) ? String(creds.email) : '',
        displayName: (profile && profile.username) ? String(profile.username) : 'Admin'
      }
    });
  } catch (err) {
    console.error('Eroare la login:', err && err.message);
    try { res.status(500).json({ error: 'Eroare server la login' }); } catch (_) {}
  }
});

// POST - Schimbă parola admin (admin only)
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
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Parola nouă trebuie să aibă cel puțin 6 caractere' });
    }

    const settings = await readAdminSettings();
    if (!settings || !settings.credentials) {
      return res.status(500).json({ error: 'Eroare la citirea setărilor' });
    }

    const stored = settings.credentials.password || '1234567890';
    if (currentPassword !== stored) {
      return res.status(401).json({ error: 'Parola curentă este incorectă' });
    }

    settings.credentials.password = newPassword;
    if (await writeAdminSettings(settings)) {
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

  res.json(settings);
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

// POST - Înregistrează o vizionare (path + ip, opțional geo)
app.post('/api/analytics/view', async (req, res) => {
  try {
    const path = req.body?.path || req.path || '/';
    const ip = getClientIp(req);
    const view = { path: path === '' ? '/' : path, ts: new Date().toISOString(), ip: ip || null };
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
    if (ip && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
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
    views.forEach((v) => {
      const p = v.path || '/';
      byPath[p] = (byPath[p] || 0) + 1;
      try {
        const day = v.ts ? v.ts.slice(0, 10) : null;
        if (day) byDay[day] = (byDay[day] || 0) + 1;
      } catch (_) {}
    });
    const sortedPaths = Object.entries(byPath).sort((a, b) => b[1] - a[1]);
    const mostViewed = sortedPaths[0] ? { path: sortedPaths[0][0], count: sortedPaths[0][1] } : null;
    const recent = views.slice(-100).reverse().map((v) => ({
      path: v.path,
      ts: v.ts,
      country: v.country || null,
      city: v.city || null,
      ip: v.ip ? v.ip.replace(/(\d+)$/, '.***') : null
    }));
    res.json({ totalViews, byPath, byDay, mostViewed, recent });
  } catch (error) {
    console.error('Eroare la citirea analytics:', error);
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
  res.status(500).json({ error: 'Eroare server: ' + (err.message || 'necunoscută') });
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
