#!/usr/bin/env node

/**
 * Script pentru a seta o nouă parolă admin
 * 
 * Utilizare:
 *   node set-admin-password.mjs
 * 
 * Va da opțiunea să alegi o nouă parolă și va crea hash-ul bcrypt
 */

import * as readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_SETTINGS_FILE = path.join(__dirname, 'server', 'adminSettings.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setPassword() {
  try {
    console.log('\n🔐 Set Admin Password\n');
    
    // Read current settings
    if (!fs.existsSync(ADMIN_SETTINGS_FILE)) {
      console.error('❌ Admin settings file not found!');
      process.exit(1);
    }
    
    const currentSettings = JSON.parse(fs.readFileSync(ADMIN_SETTINGS_FILE, 'utf8'));
    
    console.log('📧 Current admin email:', currentSettings.credentials?.email || 'No email set');
    console.log('');
    
    const password = await question('Enter new admin password (min 6 characters): ');
    
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }
    
    console.log('\n⏳ Generating password hash...\n');
    
    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update settings
    currentSettings.credentials.passwordHash = passwordHash;
    
    // Write to file
    fs.writeFileSync(ADMIN_SETTINGS_FILE, JSON.stringify(currentSettings, null, 2));
    
    console.log('✅ Password updated successfully!\n');
    console.log('📊 New hash:', passwordHash.substring(0, 20) + '...\n');
    console.log('🔑 You can now login with:');
    console.log('   Email:', currentSettings.credentials.email);
    console.log('   Password:', password);
    console.log('\n');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting password:');
    console.error(error.message);
    rl.close();
    process.exit(1);
  }
}

setPassword();
