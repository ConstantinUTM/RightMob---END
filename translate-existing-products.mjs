import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_FILE = path.join(__dirname, 'server', 'products.json');

// Auto-translation function using LibreTranslate API
const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return '';
  
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'ro',
        target: targetLang,
        format: 'text'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.translatedText || text;
    }
  } catch (error) {
    console.warn(`Translation failed for ${targetLang}, using fallback:`, error.message);
  }
  
  // Fallback: return original text
  return text;
};

const translateProduct = async (product) => {
  console.log(`\n📝 Translating: ${product.name}...`);
  
  const name = product.name?.trim() || '';
  const description = product.description?.trim() || '';
  const features = product.features?.filter(f => f.trim() !== '') || [];
  const materials = product.materials?.filter(m => m.trim() !== '') || [];

  // Translate all fields in parallel
  const promises = [
    translateText(name, 'en'),
    translateText(name, 'ru'),
    translateText(description, 'en'),
    translateText(description, 'ru'),
    ...features.map(f => translateText(f, 'en')),
    ...features.map(f => translateText(f, 'ru')),
    ...materials.map(m => translateText(m, 'en')),
    ...materials.map(m => translateText(m, 'ru')),
  ];

  const [nameEn, nameRu, descEn, descRu, ...rest] = await Promise.all(promises);

  const featuresEn = rest.slice(0, features.length);
  const featuresRu = rest.slice(features.length, features.length * 2);
  const materialsEn = rest.slice(features.length * 2, features.length * 2 + materials.length);
  const materialsRu = rest.slice(features.length * 2 + materials.length);

  return {
    ...product,
    translations: {
      en: {
        name: nameEn,
        description: descEn,
        features: featuresEn,
        materials: materialsEn,
      },
      ru: {
        name: nameRu,
        description: descRu,
        features: featuresRu,
        materials: materialsRu,
      },
    },
  };
};

const migrateProducts = async () => {
  console.log('🚀 Starting product translation migration...\n');
  
  // Read existing products
  const productsData = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  const products = JSON.parse(productsData);
  
  console.log(`📦 Found ${products.length} products to translate.\n`);
  
  // Translate each product
  const translatedProducts = [];
  for (const product of products) {
    // Skip if already has translations
    if (product.translations?.en?.name && product.translations?.ru?.name) {
      console.log(`✅ Skipping "${product.name}" - already translated`);
      translatedProducts.push(product);
      continue;
    }
    
    const translated = await translateProduct(product);
    translatedProducts.push(translated);
    
    console.log(`   ✅ EN: ${translated.translations.en.name}`);
    console.log(`   ✅ RU: ${translated.translations.ru.name}`);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save back to file
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(translatedProducts, null, 2));
  
  console.log(`\n✨ Migration complete! ${translatedProducts.length} products translated and saved.`);
};

migrateProducts().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
