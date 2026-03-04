import fs from 'fs';

const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ro|${targetLang}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.warn(`Translation failed for ${targetLang}`);
  }
  return text;
};

const processProducts = async () => {
  const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  let translated = 0;
  
  for (const product of products) {
    if (product.colorVariants && product.colorVariants.length > 0) {
      for (const variant of product.colorVariants) {
        if (variant.name) {
          const [enName, ruName] = await Promise.all([
            translateText(variant.name, 'en'),
            translateText(variant.name, 'ru')
          ]);
          
          variant.translations = {
            en: enName,
            ru: ruName
          };
          
          console.log(`✓ ${variant.name} -> EN: ${enName}, RU: ${ruName}`);
          translated++;
        }
      }
    }
  }
  
  fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
  console.log(`✅ Traduse ${translated} culori!`);
};

processProducts().catch(e => console.error('Error:', e));
