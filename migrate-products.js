// Script pentru migrarea produselor din localStorage în server
// Rulează acest script în browser console după ce te loghezi ca admin

const migrateProducts = async () => {
  // Ia produsele din localStorage
  const productsFromStorage = localStorage.getItem('luxmobila_products');
  
  if (!productsFromStorage) {
    console.log('Nu există produse în localStorage');
    return;
  }
  
  const products = JSON.parse(productsFromStorage);
  console.log(`Găsite ${products.length} produse în localStorage`);
  
  // Trimite fiecare produs la server
  for (const product of products) {
    try {
      const { id, ...productData } = product; // Exclude id-ul vechi
      const response = await fetch(`http://${window.location.hostname}:3001/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        const newProduct = await response.json();
        console.log(`✅ Produs migrat: ${newProduct.name}`);
      } else {
        console.error(`❌ Eroare la migrarea: ${product.name}`);
      }
    } catch (error) {
      console.error(`❌ Eroare la migrarea: ${product.name}`, error);
    }
  }
  
  console.log('🎉 Migrare completă! Poți reîncărca pagina.');
};

// Rulează migrarea
migrateProducts();
