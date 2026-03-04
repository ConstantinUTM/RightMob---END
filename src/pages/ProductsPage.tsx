import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Star,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllProducts } from '../services/productService';
import { Product } from '../data/products';

const ProductsPage: React.FC = () => {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState('featured');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products from localStorage
  useEffect(() => {
    const loadProducts = async () => {
      const data = await getAllProducts();
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get products by category, sorted
  const getProductsByCategory = (categoryId: string) => {
    return products
      .filter(p => p.category === categoryId)
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'rating':
            return b.rating - a.rating;
          case 'newest':
            return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
          default: // featured
            return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
        }
      });
  };

  const categories = [
    { id: 'living', name: t('products.categories.living'), colorAccent: 'border-blue-300/40' },
    { id: 'dormitor', name: t('products.categories.bedroom'), colorAccent: 'border-blue-400/50' },
    { id: 'bucatarie', name: t('products.categories.dining'), colorAccent: 'border-blue-500/50' },
    { id: 'birou', name: t('products.categories.office'), colorAccent: 'border-blue-300/40' },
    { id: 'hol', name: t('products.categories.hall'), colorAccent: 'border-blue-400/50' },
    { id: 'baie', name: t('products.categories.bathroom'), colorAccent: 'border-blue-500/50' },
    { id: 'copii', name: t('products.categories.kids'), colorAccent: 'border-blue-300/40' },
    { id: 'gradina', name: t('products.categories.garden'), colorAccent: 'border-blue-400/50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/20 via-white to-red-50/20 pt-28 pb-20 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-100 to-red-100 text-transparent bg-clip-text rounded-full text-sm font-semibold mb-4 border border-blue-200/50"
            style={{
              backgroundImage: `linear-gradient(90deg, #1786fc 0%, #a855f7 100%)`
            }}
          >
            {t('collections.title')}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold bg-clip-text text-transparent mb-3 tracking-tight"
            style={{
              backgroundImage: `linear-gradient(90deg, #1786fc 0%, #a855f7 50%, #fc080b 100%)`
            }}
          >
            {t('products.title')}
          </h1>
          <p className="text-lg text-dark-600 max-w-xl mx-auto">
            {t('collections.subtitle')}
          </p>
        </motion.div>

        {/* Sort Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-end mb-10"
        >
          <div className="relative w-full sm:w-72" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-300 focus:border-blue-400 focus:outline-none font-medium text-dark-700 transition-all cursor-pointer shadow-sm"
            >
              <span>
                {sortBy === 'featured' && t('products.sort.recommended')}
                {sortBy === 'newest' && t('products.sort.newest')}
                {sortBy === 'price-asc' && t('products.sort.priceAsc')}
                {sortBy === 'price-desc' && t('products.sort.priceDesc')}
                {sortBy === 'rating' && t('products.sort.rating')}
                {sortBy === 'name' && t('products.sort.name')}
              </span>
              <motion.span
                animate={{ rotate: sortDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-dark-500"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </button>
            <AnimatePresence>
              {sortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 py-2 bg-white rounded-xl border border-blue-200 shadow-xl z-[200] overflow-hidden"
                >
                  {[
                    { value: 'featured', label: t('products.sort.recommended') },
                    { value: 'newest', label: t('products.sort.newest') },
                    { value: 'price-asc', label: t('products.sort.priceAsc') },
                    { value: 'price-desc', label: t('products.sort.priceDesc') },
                    { value: 'rating', label: t('products.sort.rating') },
                    { value: 'name', label: t('products.sort.name') },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 font-medium transition-colors ${
                        sortBy === opt.value
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-dark-700 hover:bg-blue-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Gallery by Categories */}
        <div className="space-y-20">
          {categories.map((category, catIndex) => {
            const categoryProducts = getProductsByCategory(category.id);
            if (categoryProducts.length === 0) return null;

            return (
              <motion.section
                key={category.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                className="group"
              >
                {/* Category Header */}
                <div className={`mb-10 pb-6 border-b-4 border-blue-300/40 group-hover:border-blue-400/60 transition-all duration-300 ${category.colorAccent}`}>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-dark-950 relative inline-block">
                    {category.name}
                    <div 
                      className="absolute -bottom-3 left-0 h-1 w-full transition-all duration-300"
                      style={{
                        backgroundImage: `linear-gradient(90deg, #1786fc 0%, #a855f7 50%, #fc080b 100%)`
                      }}
                    />
                  </h2>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
                  {categoryProducts.map((product, idx) => (
                    <GalleryProductCard
                      key={product.id}
                      product={product}
                      index={idx}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* No products message */}
        {products.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-dark-950 mb-2">
              {t('products.empty.title')}
            </h3>
            <p className="text-dark-600">
              {t('products.empty.subtitle')}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Gallery Product Card Component
interface GalleryProductCardProps {
  product: Product;
  index: number;
}

const GalleryProductCard: React.FC<GalleryProductCardProps> = ({ product, index }) => {
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  const getProductName = (item: Product) => {
    if (language === 'ro') return item.name;
    return item.translations?.[language as 'en' | 'ru']?.name?.trim() || item.name;
  };

  return (
    <Link
      to={`/produs/${product.id}`}
      className="block group"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="bg-white rounded-2xl overflow-hidden border border-blue-200/40 shadow-lg hover:shadow-2xl hover:border-blue-300/60 transition-all duration-300 flex flex-col h-full card-lux-hover"
      >
        {/* Image */}
        <div className="relative h-80 overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-50/50 to-blue-50/30 flex items-center justify-center">
          <img
            src={product.image}
            alt={getProductName(product)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-100 animate-pulse" />
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between h-8 z-10">
            <div className="flex-1">
              {product.isBestseller && (
                <div className="inline-flex bg-gradient-to-r from-neutral-600 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold items-center space-x-1 shadow-lg">
                  <TrendingUp className="w-3 h-3" />
                  <span>{t('products.badges.bestseller')}</span>
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              {product.isNew && (
                <div className="inline-flex bg-gradient-to-r from-neutral-600 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold items-center space-x-1 shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('products.badges.new')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-dark-950 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-neutral-700 group-hover:to-neutral-700 transition-all mb-3 line-clamp-2 min-h-[3rem]">
              {getProductName(product)}
            </h3>

            <div className="flex items-center space-x-1 mb-4">
              <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
              <span className="font-semibold text-sm text-dark-900">{product.rating}</span>
              <span className="text-dark-500 text-sm">({product.reviews})</span>
            </div>

            {/* Color Variants */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.colorVariants.slice(0, 5).map((variant, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md ring-1 ring-blue-200/50 group-hover:ring-blue-400"
                    style={{ backgroundColor: variant.hexCode }}
                    title={variant.name}
                  />
                ))}
                {product.colorVariants.length > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white shadow-md ring-1 ring-blue-200/50 bg-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700 group-hover:ring-blue-400">
                    +{product.colorVariants.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`text-xs px-3 py-1.5 rounded-full inline-block font-semibold transition-all ${
              product.inStock 
                ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200' 
                : 'bg-red-100 text-red-700 group-hover:bg-red-200'
            }`}>
              {product.inStock ? 'În stoc' : 'Stoc epuizat'}
            </div>
          </div>
      </motion.div>
    </Link>
  );
};

export default ProductsPage;
