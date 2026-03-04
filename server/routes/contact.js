/**
 * Contact API Routes
 * Provides endpoints for retrieving contact information and handling contact form submissions
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Path to messages file
const MESSAGES_FILE = path.join(__dirname, '../messages.json');

/**
 * GET /api/contact/info
 * Returns all contact information from environment variables
 */
router.get('/info', (req, res) => {
  try {
    const contactInfo = {
      email: process.env.VITE_COMPANY_EMAIL || 'contact@rightmob.md',
      phone: process.env.VITE_COMPANY_PHONE || '+373 XX XX XX XX',
      address: process.env.VITE_COMPANY_ADDRESS || 'Chișinău, Moldova',
      schedule: process.env.VITE_COMPANY_SCHEDULE || 'Lu - Sâm: 09:00 - 18:00',
      whatsapp: process.env.VITE_WHATSAPP_NUMBER || '373XXXXXXXX',
      viber: process.env.VITE_VIBER_NUMBER || '373XXXXXXXX',
      instagram: process.env.VITE_INSTAGRAM_URL || 'https://instagram.com/rightmob',
      facebook: process.env.VITE_FACEBOOK_URL || 'https://facebook.com/rightmob',
    };

    res.json({
      success: true,
      data: contactInfo
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la încărcarea informațiilor de contact'
    });
  }
});

/**
 * POST /api/contact/submit
 * Saves contact form submission to messages.json
 * Body: { fullName, email, phone, message }
 */
router.post('/submit', async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validation
    if (!fullName || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Toate câmpurile sunt obligatorii'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Adresa de email nu este validă'
      });
    }

    // Read existing messages
    let messages = [];
    try {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      messages = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      console.log('Messages file not found, creating new one');
    }

    // Create new message object
    const newMessage = {
      id: Date.now().toString(),
      fullName,
      email,
      phone,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'contact_form'
    };

    // Add to messages array
    messages.push(newMessage);

    // Save to file
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Mesajul a fost trimis cu succes! Vă vom contacta în curând.',
      data: { id: newMessage.id }
    });

  } catch (error) {
    console.error('Error saving contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la trimiterea mesajului. Vă rugăm să încercați din nou.'
    });
  }
});

export default router;
