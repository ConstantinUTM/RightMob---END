import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  Upload, 
  ArrowLeft, 
  Image as ImageIcon,
  AlertCircle,
  Plus,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ColorVariant } from '../data/products';
import { 
  addProduct, 
  updateProduct, 
  getProductById,
  uploadProductImage
} from '../services/productService';
import { translateBatch } from '../lib/translationService';

const CATEGORY_OPTIONS = [
  { value: 'living', label: 'Living' },
  { value: 'dormitor', label: 'Dormitor' },
  { value: 'bucatarie', label: 'Bucătărie' },
  { value: 'birou', label: 'Birou' },
  { value: 'hol', label: 'Hol' },
  { value: 'baie', label: 'Baie' },
  { value: 'copii', label: 'Cameră Copii' },
  { value: 'gradina', label: 'Grădină' }
];

const AddEditProductPage: React.FC = () => {
  const { isAdmin, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tempIdRef = React.useRef<number>(Date.now());

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'living',
    price: 0,
    originalPrice: undefined,
    image: '',
    images: [],
    description: '',
    features: [''],
    materials: [''],
    dimensions: { width: 100, height: 100, depth: 50 },
    colors: [],
    colorVariants: [
      {
        name: '',
        hexCode: '#808080',
        images: [],
        inStock: true
      }
    ],
    inStock: true,
    rating: 5.0,
    reviews: 0,
    isNew: false,
    isBestseller: false,
    specificFeatures: {}
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isEditMode && id) {
      loadProduct(Number(id));
    }
  }, [id, isEditMode]);

  const loadProduct = async (productId: number) => {
    setLoading(true);
    try {
      const product = await getProductById(productId);
      if (product) {
        // Migrate old colors format to colorVariants if needed
        if (!product.colorVariants && product.colors && product.colors.length > 0) {
          product.colorVariants = product.colors.map((colorName, index) => ({
            name: colorName,
            hexCode: '#000000',
            images: index === 0 ? product.images : [],
            inStock: true
          }));
        }
        
        setFormData(product);
        tempIdRef.current = product.id;
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Eroare la încărcarea produsului');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleArrayChange = (field: 'features' | 'materials', index: number, value: string) => {
    const array = [...(formData[field] || [])];
    array[index] = value;
    handleInputChange(field, array);
  };

  const addArrayItem = (field: 'features' | 'materials') => {
    const array = [...(formData[field] || []), ''];
    handleInputChange(field, array);
  };

  const removeArrayItem = (field: 'features' | 'materials', index: number) => {
    const array = (formData[field] || []).filter((_, i) => i !== index);
    handleInputChange(field, array);
  };

  // Color Variants handlers
  const addColorVariant = () => {
    const newVariant: ColorVariant = {
      name: '',
      hexCode: '#000000',
      images: [],
      inStock: true
    };
    handleInputChange('colorVariants', [...(formData.colorVariants || []), newVariant]);
  };

  const updateColorVariant = (index: number, field: keyof ColorVariant, value: any) => {
    const variants = [...(formData.colorVariants || [])];
    variants[index] = { ...variants[index], [field]: value };
    handleInputChange('colorVariants', variants);
  };

  const removeColorVariant = (index: number) => {
    const variants = (formData.colorVariants || []).filter((_, i) => i !== index);
    handleInputChange('colorVariants', variants);
  };

  const handleColorVariantImages = async (variantIndex: number, files: File[]) => {
    const variants = [...(formData.colorVariants || [])];
    const currentImages = variants[variantIndex].images || [];
    
    // Upload images to server as base64
    const uploadPromises = files.map((file, index) => 
      uploadProductImage(file, tempIdRef.current, currentImages.length + index)
    );
    
    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      variants[variantIndex].images = [...currentImages, ...uploadedUrls];
      handleInputChange('colorVariants', variants);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Eroare la încărcarea imaginilor');
    }
  };

  const removeColorVariantImage = (variantIndex: number, imageIndex: number) => {
    const variants = [...(formData.colorVariants || [])];
    variants[variantIndex].images = variants[variantIndex].images.filter((_, i) => i !== imageIndex);
    handleInputChange('colorVariants', variants);
  };

  // Traducere în batch – un singur request (mai puțină încărcare), traducere după context
  const translateProductData = async () => {
    const name = formData.name?.trim() || '';
    const description = formData.description?.trim() || '';
    const features = formData.features?.filter(f => f.trim() !== '') || [];
    const materials = formData.materials?.filter(m => m.trim() !== '') || [];
    const colors = (formData.colorVariants || []).map(c => c.name).filter(c => c.trim() !== '');

    const items: { id: string; text: string; to: 'en' | 'ru' }[] = [];
    if (name) {
      items.push({ id: 'name_en', text: name, to: 'en' }, { id: 'name_ru', text: name, to: 'ru' });
    }
    if (description) {
      items.push({ id: 'desc_en', text: description, to: 'en' }, { id: 'desc_ru', text: description, to: 'ru' });
    }
    features.forEach((f, i) => {
      items.push({ id: `fe${i}_en`, text: f, to: 'en' }, { id: `fe${i}_ru`, text: f, to: 'ru' });
    });
    materials.forEach((m, i) => {
      items.push({ id: `ma${i}_en`, text: m, to: 'en' }, { id: `ma${i}_ru`, text: m, to: 'ru' });
    });
    colors.forEach((c, i) => {
      items.push({ id: `co${i}_en`, text: c, to: 'en' }, { id: `co${i}_ru`, text: c, to: 'ru' });
    });

    const results = items.length > 0 ? await translateBatch(items) : {};
    const featuresEn = features.map((_, i) => results[`fe${i}_en`] || features[i]);
    const featuresRu = features.map((_, i) => results[`fe${i}_ru`] || features[i]);
    const materialsEn = materials.map((_, i) => results[`ma${i}_en`] || materials[i]);
    const materialsRu = materials.map((_, i) => results[`ma${i}_ru`] || materials[i]);
    const colorsEn = colors.map((_, i) => results[`co${i}_en`] || colors[i]);
    const colorsRu = colors.map((_, i) => results[`co${i}_ru`] || colors[i]);

    return {
      translations: {
        en: {
          name: results['name_en'] || name,
          description: results['desc_en'] || description,
          features: featuresEn,
          materials: materialsEn,
          colors: colorsEn,
        },
        ru: {
          name: results['name_ru'] || name,
          description: results['desc_ru'] || description,
          features: featuresRu,
          materials: materialsRu,
          colors: colorsRu,
        },
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate that at least one color variant exists
    if (!formData.colorVariants || formData.colorVariants.length === 0) {
      setError('Trebuie să adaugi cel puțin o culoare! Apasă "Adaugă Culoare".');
      return;
    }
    
    // Validate that each color variant has a name
    if (formData.colorVariants.some(v => !v.name || v.name.trim() === '')) {
      setError('Fiecare culoare trebuie să aibă un nume!');
      return;
    }
    
    setLoading(true);
    try {
      // Auto-translate product data
      const translatedData = await translateProductData();

      // Determină imaginea principală: prioritate la prima culoare dacă există
      let mainImage = formData.image || '';
      let mainImages: string[] = formData.images || [];
      
      if (formData.colorVariants && formData.colorVariants.length > 0) {
        const firstColorImages = formData.colorVariants[0].images;
        if (firstColorImages && firstColorImages.length > 0) {
          mainImage = firstColorImages[0];
          mainImages = firstColorImages;
        }
      }

      const productData = {
        ...formData,
        translations: translatedData.translations,
        features: formData.features?.filter(f => f.trim() !== ''),
        materials: formData.materials?.filter(m => m.trim() !== ''),
        colors: formData.colorVariants?.map(v => v.name) || [],
        colorVariants: (formData.colorVariants || [])
          .filter(v => v.name.trim() !== '')
          .map((variant, index) => ({
            ...variant,
            translations: {
              en: translatedData.translations.en.colors?.[index] || variant.name,
              ru: translatedData.translations.ru.colors?.[index] || variant.name,
            }
          })),
        images: mainImages,
        image: mainImage,
      };

      if (isEditMode && id) {
        await updateProduct(Number(id), productData);
        alert('Produs actualizat cu succes! Vei fi redirecționat la pagina produsului.');
        navigate(`/produs/${id}`);
      } else {
        const newId = await addProduct(productData as Omit<Product, 'id'>);
        alert('Produs adăugat cu succes! Vei fi redirecționat la pagina produsului.');
        navigate(`/produs/${newId}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Eroare la salvarea produsului');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (isEditMode && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-primary-50/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-600">{loading ? 'Se traduc datele automat...' : 'Se încarcă...'}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50/20 pt-32 pb-20">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-dark-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Înapoi la Admin</span>
          </button>
          <h1 className="text-4xl font-serif font-bold text-dark-950 mb-2">
            {isEditMode ? 'Editează Produs' : 'Adaugă Produs Nou'}
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg space-y-6 card-lux-hover">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-dark-950">Informații Generale</h2>
            
            <div>
              <label className="block text-sm font-semibold text-dark-950 mb-2">
                Nume Produs *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="ex: Canapea Elegance Premium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Categorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Preț (MDL) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Previne 0-uri în față
                      const cleanValue = value.replace(/^0+/, '') || '0';
                      handleInputChange('price', Number(cleanValue));
                    }}
                    required
                    min="1"
                    placeholder="12999"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 text-sm">MDL</span>
                </div>
                <p className="text-xs text-dark-500 mt-1">Conversia valutară se face automat pe site</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Preț Original (MDL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={(e) => handleInputChange('originalPrice', e.target.value ? Number(e.target.value) : undefined)}
                    min="0"
                    placeholder="15999"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 text-sm">MDL</span>
                </div>
                <p className="text-xs text-dark-500 mt-1">Pentru afișarea reducerii</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Stoc
                </label>
                <select
                  value={formData.inStock ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('inStock', e.target.value === 'true')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="true">În stoc</option>
                  <option value="false">Stoc epuizat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-950 mb-2">
                Descriere *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors resize-none"
                placeholder="Descrie produsul..."
              />
            </div>

          </div>

          {/* Arrays */}
          {['features', 'materials'].map((field) => (
            <div key={field} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-950 capitalize">
                  {field === 'features' ? 'Caracteristici' : 'Materiale'}
                </h2>
                <button
                  type="button"
                  onClick={() => addArrayItem(field as any)}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  + Adaugă
                </button>
              </div>
              {(formData[field as keyof typeof formData] as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange(field as any, index, e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(field as any, index)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* Color Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-950">Variante de Culoare</h2>
                <p className="text-sm text-gray-500 mt-1">
                  💡 Prima culoare și imaginile ei vor fi automat imaginile principale ale produsului
                </p>
              </div>
              <button
                type="button"
                onClick={addColorVariant}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Adaugă Culoare
              </button>
            </div>
            
            {(formData.colorVariants || []).map((variant, variantIndex) => (
              <div key={variantIndex} className={`border-2 rounded-xl p-6 space-y-4 ${variantIndex === 0 ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-dark-950">Culoare {variantIndex + 1}</h3>
                    {variantIndex === 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        Prioritară
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeColorVariant(variantIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-950 mb-2">
                      Nume Culoare *
                    </label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateColorVariant(variantIndex, 'name', e.target.value)}
                      placeholder="ex: Negru Lucios"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-950 mb-2">
                      Cod Culoare *
                    </label>
                    <input
                      type="color"
                      value={variant.hexCode}
                      onChange={(e) => updateColorVariant(variantIndex, 'hexCode', e.target.value)}
                      className="w-full h-[50px] px-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-950 mb-2">
                    În Stoc
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variant.inStock}
                      onChange={(e) => updateColorVariant(variantIndex, 'inStock', e.target.checked)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-dark-600">Această culoare este în stoc</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-950 mb-2">
                    Imagini pentru această culoare
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {variant.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img
                          src={image}
                          alt={`${variant.name} ${imageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeColorVariantImage(variantIndex, imageIndex)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                      <Upload className="w-8 h-8 text-dark-400 mb-2" />
                      <span className="text-sm text-dark-600">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          await handleColorVariantImages(variantIndex, files);
                          e.target.value = ''; // Reset input pentru a permite același fișier din nou
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {(formData.colorVariants || []).length === 0 && (
              <div className="border-2 border-primary-300 bg-primary-50 rounded-xl p-6 text-center">
                <p className="text-dark-950 font-bold mb-3">⚠️ Nicio culoare adăugată!</p>
                <p className="text-dark-600 mb-4">
                  Produsul trebuie să aibă cel puțin o culoare. Apasă butonul "Adaugă Culoare" de mai sus pentru a continua.
                </p>
                <button
                  type="button"
                  onClick={addColorVariant}
                  className="inline-flex items-center gap-2 px-6 py-3 btn-lux font-bold rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                  Adaugă Prima Culoare
                </button>
              </div>
            )}
          </div>


          {/* Dimensions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-dark-950">Dimensiuni (cm)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Lățime
                </label>
                <input
                  type="number"
                  value={formData.dimensions?.width || ''}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, width: Number(e.target.value) })}
                  min="1"
                  placeholder="200"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Înălțime
                </label>
                <input
                  type="number"
                  value={formData.dimensions?.height || ''}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, height: Number(e.target.value) })}
                  min="1"
                  placeholder="85"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-950 mb-2">
                  Adâncime
                </label>
                <input
                  type="number"
                  value={formData.dimensions?.depth || ''}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, depth: Number(e.target.value) })}
                  min="1"
                  placeholder="95"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-dark-950">Badge-uri</h2>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNew || false}
                  onChange={(e) => handleInputChange('isNew', e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span>Produs Nou</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBestseller || false}
                  onChange={(e) => handleInputChange('isBestseller', e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span>Bestseller</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 btn-lux flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Se salvează...' : (isEditMode ? 'Actualizează' : 'Salvează')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProductPage;
