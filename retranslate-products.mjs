import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MyMemory Translation API (free, no API key needed, 10000 chars/day per IP)
async function translateWithMyMemory(text, fromLang, toLang) {
  if (!text || !text.trim()) {
    return text;
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    console.log(`⚠️ MyMemory translation failed for "${text}": ${data.responseStatus}`);
    return text; // fallback to original
  } catch (error) {
    console.error(`❌ Translation error for "${text}":`, error.message);
    return text;
  }
}

// Translate with delay to respect rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateText(text, toLang) {
  // MyMemory: 10000 chars/day, reasonable rate limits
  await delay(500); // 500ms delay between requests
  return await translateWithMyMemory(text, 'ro', toLang);
}

async function translateArray(arr, toLang) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [];
  }
  
  const translated = [];
  for (const item of arr) {
    const result = await translateText(item, toLang);
    translated.push(result);
  }
  return translated;
}

async function translateProduct(product) {
  console.log(`\n🔄 Translating: "${product.name}"`);
  
  const translations = {
    en: {},
    ru: {}
  };

  try {
    // Translate to English
    console.log('  → English...');
    translations.en.name = await translateText(product.name, 'en');
    translations.en.description = await translateText(product.description || '', 'en');
    translations.en.features = await translateArray(product.features || [], 'en');
    translations.en.materials = await translateArray(product.materials || [], 'en');

    // Translate to Russian
    console.log('  → Russian...');
    translations.ru.name = await translateText(product.name, 'ru');
    translations.ru.description = await translateText(product.description || '', 'ru');
    translations.ru.features = await translateArray(product.features || [], 'ru');
    translations.ru.materials = await translateArray(product.materials || [], 'ru');

    console.log('  ✅ Done');
    return translations;
  } catch (error) {
    console.error(`  ❌ Error translating product:`, error.message);
    // Return copy as fallback
    return {
      en: {
        name: product.name,
        description: product.description || '',
        features: product.features || [],
        materials: product.materials || []
      },
      ru: {
        name: product.name,
        description: product.description || '',
        features: product.features || [],
        materials: product.materials || []
      }
    };
  }
}

async function main() {
  try {
    console.log('🌍 Starting product translation with MyMemory API...\n');

    const productsPath = path.join(__dirname, 'server', 'products.json');
    const backupPath = path.join(__dirname, 'server', 'products_backup_retranslate.json');

    // Read products
    const data = await fs.readFile(productsPath, 'utf-8');
    const products = JSON.parse(data);

    console.log(`📦 Found ${products.length} products to translate\n`);

    // Create backup
    await fs.writeFile(backupPath, data, 'utf-8');
    console.log(`💾 Backup created: products_backup_retranslate.json\n`);

    // Translate each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}]`);
      
      const translations = await translateProduct(product);
      products[i].translations = translations;
      
      // Save progress after each product
      await fs.writeFile(productsPath, JSON.stringify(products, null, 2), 'utf-8');
    }

    console.log('\n✅ Translation complete! All products have been updated.');
    console.log('📊 Summary:');
    console.log(`   - Total products: ${products.length}`);
    console.log(`   - Languages: EN, RU`);
    console.log('   - Backup file: products_backup_retranslate.json\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
