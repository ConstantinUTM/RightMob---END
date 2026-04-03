import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Truck,
  Shield,
  ArrowLeft,
  Ruler,
  Sparkles,
  TrendingUp,
  Check,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllProducts, getProductById } from '../services/productService';
import { addReview } from '../services/galleryService';
import { Product } from '../data/products';
import type { GalleryReview } from '../services/productService';

const ProductDetailPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentTitle, setCommentTitle] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentIsOwner, setCommentIsOwner] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      const productData = await getProductById(Number(id));
      setProduct(productData);
      
      if (productData) {
        const allProducts = await getAllProducts();
        const related = allProducts
          .filter(p => p.category === productData.category && p.id !== productData.id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-600">{t('productDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-3xl font-bold text-dark-950 mb-4">
            {t('productDetail.notFoundTitle')}
          </h2>
          <Link to="/galerie" className="btn-primary">
            {t('productDetail.backToProducts')}
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabelMap: Record<string, string> = {
    living: t('products.categories.living'),
    dormitor: t('products.categories.bedroom'),
    bucatarie: t('products.categories.dining'),
    birou: t('products.categories.office'),
    hol: t('products.categories.hall'),
    baie: t('products.categories.bathroom'),
    copii: t('products.categories.kids'),
    gradina: t('products.categories.garden'),
  };
  const categoryLabel = categoryLabelMap[product.category] || product.category;
  const getProductName = (item: Product) => {
    if (language === 'ro') return item.name;
    return item.translations?.[language as 'en' | 'ru']?.name?.trim() || item.name;
  };
  const getProductDescription = (item: Product) => {
    if (language === 'ro') return item.description;
    return item.translations?.[language as 'en' | 'ru']?.description?.trim() || item.description;
  };
  const getProductFeatures = (item: Product) => {
    if (language === 'ro') return item.features;
    return item.translations?.[language as 'en' | 'ru']?.features || item.features;
  };
  const getProductMaterials = (item: Product) => {
    if (language === 'ro') return item.materials;
    return item.translations?.[language as 'en' | 'ru']?.materials || item.materials;
  };
  const getColorName = (colorVariant: any) => {
    if (language === 'ro') return colorVariant.name;
    return colorVariant.translations?.[language as 'en' | 'ru'] || colorVariant.name;
  };

  const colorVariants = product.colorVariants || [];
  const hasColorVariants = colorVariants.length > 0;
  const fallbackImages = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const currentVariantImages = hasColorVariants
    ? colorVariants[selectedColorIndex]?.images || []
    : [];
  const currentImages = currentVariantImages.length > 0
    ? currentVariantImages
    : fallbackImages;
  const hasImages = currentImages.length > 0;
  const safeSelectedImage = Math.min(
    selectedImage,
    Math.max(currentImages.length - 1, 0)
  );
  const currentColorInStock = hasColorVariants
    ? colorVariants[selectedColorIndex]?.inStock ?? product.inStock
    : product.inStock;

  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedImage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50/20 pt-32 pb-20">
      <div className="container-custom">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate('/galerie')}
            className="flex items-center space-x-2 text-dark-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t('productDetail.backToProducts')}</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Main Image with Zoom */}
            <div 
              className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {hasImages ? (
                <img
                  src={currentImages[safeSelectedImage]}
                  alt={getProductName(product)}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={
                    isZoomed
                      ? {
                          transform: `scale(2)`,
                          transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        }
                      : {}
                  }
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Fara imagine
                </div>
              )}

              {/* Badges */}
              <div className={`absolute top-6 left-6 right-6 flex items-start justify-between transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}>
                {product.isNew && (
                  <div className="bg-gradient-to-r from-neutral-600 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg">
                    <Sparkles className="w-5 h-5" />
                    <span>{t('productDetail.newBadge')}</span>
                  </div>
                )}
              </div>

              {/* Zoom Indicator */}
              {!isZoomed && (
                <div className="absolute bottom-6 right-6 px-3 py-2 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                  {t('productDetail.zoomHint')}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {currentImages.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                    selectedImage === index
                      ? 'border-primary-600 shadow-lg'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${getProductName(product)} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Category & Badges */}
            <div className="flex items-center flex-wrap gap-3">
              <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold capitalize">
                {categoryLabel}
              </span>
              {product.isBestseller && (
                <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t('productDetail.bestseller')}</span>
                </span>
              )}
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  currentColorInStock
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {currentColorInStock ? t('productDetail.inStock') : t('productDetail.outOfStock')}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-dark-950">
              {getProductName(product)}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-primary-500 text-primary-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{product.rating}</span>
              <span className="text-dark-500">({product.reviews} {t('products.reviews')})</span>
            </div>

            {/* Description */}
            <p className="text-lg text-dark-600 leading-relaxed">
              {getProductDescription(product)}
            </p>

            {/* Colors */}
            {hasColorVariants ? (
              <div>
                <h3 className="font-bold text-dark-950 mb-3">{t('productDetail.colorAvailable')}</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colorVariants!.map((variant, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleColorChange(index)}
                      className={`relative px-6 py-3 rounded-xl border-2 font-medium transition-all flex items-center gap-2 ${
                        selectedColorIndex === index
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      } ${!variant.inStock ? 'opacity-60' : ''}`}
                      disabled={!variant.inStock}
                    >
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-full border-4 border-white shadow-lg ring-2 ring-gray-300"
                          style={{ backgroundColor: variant.hexCode }}
                        />
                        {selectedColorIndex === index && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span>{getColorName(variant)}</span>
                      {!variant.inStock && (
                        <span className="text-xs text-red-600 ml-1">({t('productDetail.soldOut')})</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : product.colors.length > 0 ? (
              <div>
                <h3 className="font-bold text-dark-950 mb-3">{t('productDetail.colorsAvailable')}</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                <div className="p-2 bg-green-500 rounded-full">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-dark-950">{t('productDetail.deliveryTitle')}</div>
                  <div className="text-sm text-dark-600">{t('productDetail.deliverySubtitle')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-dark-950">{t('productDetail.warrantyTitle')}</div>
                  <div className="text-sm text-dark-600">{t('productDetail.warrantySubtitle')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="bg-white rounded-3xl p-8 shadow-lg mb-20 card-lux-hover"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Features */}
            <div>
              <h3 className="text-2xl font-bold text-dark-950 mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-primary-600" />
                {t('productDetail.featuresTitle')}
              </h3>
              <ul className="space-y-3">
                {getProductFeatures(product).map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-dark-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Materials */}
            <div>
              <h3 className="text-2xl font-bold text-dark-950 mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-primary-600" />
                {t('productDetail.materialsTitle')}
              </h3>
              <ul className="space-y-3">
                {getProductMaterials(product).map((material, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-dark-700">{material}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dimensions */}
            <div>
              <h3 className="text-2xl font-bold text-dark-950 mb-6 flex items-center">
                <Ruler className="w-6 h-6 mr-2 text-primary-600" />
                {t('productDetail.dimensionsTitle')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-dark-700">{t('productDetail.widthLabel')}:</span>
                  <span className="font-bold text-dark-950">{product.dimensions.width} cm</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-dark-700">{t('productDetail.heightLabel')}:</span>
                  <span className="font-bold text-dark-950">{product.dimensions.height} cm</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-dark-700">{t('productDetail.depthLabel')}:</span>
                  <span className="font-bold text-dark-950">{product.dimensions.depth} cm</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recenzii / Comentarii */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="bg-white rounded-3xl p-8 shadow-lg mb-20 card-lux-hover"
        >
          <h3 className="text-2xl font-bold text-dark-950 mb-6 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-primary-600" />
            {t('productDetail.reviewsTitle')}
          </h3>
          {(() => {
            const reviewList: GalleryReview[] = ((product as any).reviewList || []).filter(
              (r: GalleryReview) => r.visible !== false
            );
            return (
              <>
                {reviewList.length > 0 ? (
                  <ul className="space-y-4 mb-8">
                    {reviewList.map((r, i) => (
                      <li key={r.id || i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1" aria-label={`Rating: ${r.rating || 5}/5`}>
                            {[...Array(5)].map((_, starIndex) => (
                              <Star
                                key={starIndex}
                                className={`w-4 h-4 ${(r.rating || 5) > starIndex ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                              />
                            ))}
                          </div>
                          {r.source === 'owner' && (
                            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                              Owner
                            </span>
                          )}
                        </div>
                        {r.title ? (
                          <p className="text-dark-900 font-semibold mb-1">{r.title}</p>
                        ) : null}
                        <p className="text-dark-700 leading-relaxed mb-2">{r.text}</p>
                        <div className="flex items-center justify-between text-sm text-dark-500">
                          <span className="font-medium">{r.author || t('productDetail.authorPlaceholder')}</span>
                          {r.date && (
                            <time dateTime={r.date}>
                              {new Date(r.date).toLocaleDateString(language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-GB')}
                            </time>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-dark-500 mb-6">{t('productDetail.noReviews')}</p>
                )}
                {reviewSent ? (
                  <p className="text-green-600 font-medium">{t('productDetail.reviewSent')}</p>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!commentText.trim()) return;
                      setSubmittingReview(true);
                      try {
                        await addReview(String(product.id), {
                          text: commentText.trim(),
                          title: commentTitle.trim() || undefined,
                          rating: commentRating,
                          author: commentAuthor.trim() || undefined,
                          source: commentIsOwner ? 'owner' : 'visitor',
                          lang: language,
                        });
                        setCommentText('');
                        setCommentTitle('');
                        setCommentRating(5);
                        setCommentAuthor('');
                        setReviewSent(true);
                        const all = await getAllProducts();
                        const updated = all.find((p) => String(p.id) === String(product.id));
                        if (updated) setProduct(updated as any);
                      } catch (err) {
                        console.error(err);
                        alert((err as Error).message);
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <p className="block text-sm font-medium text-dark-700 mb-2">{t('productDetail.ratingLabel')}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setCommentRating(value)}
                            className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                            aria-label={`${value} stars`}
                          >
                            <Star
                              className={`w-6 h-6 ${value <= commentRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-dark-600 font-medium">{commentRating}/5</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">{t('productDetail.reviewTitleLabel')}</label>
                      <input
                        type="text"
                        value={commentTitle}
                        onChange={(e) => setCommentTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                        placeholder={t('productDetail.reviewTitlePlaceholder')}
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">{t('productDetail.addComment')}</label>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder={t('productDetail.addComment')}
                        required
                      />
                      <p className="mt-1 text-xs text-dark-500">{t('productDetail.reviewDetailsHint')}</p>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                        placeholder={t('productDetail.authorPlaceholder')}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={commentIsOwner}
                        onChange={(e) => setCommentIsOwner(e.target.checked)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-dark-700">{t('productDetail.iAmOwner')}</span>
                    </label>
                    <button
                      type="submit"
                      disabled={submittingReview || !commentText.trim()}
                      className="btn-primary disabled:opacity-50"
                    >
                      {submittingReview ? '...' : t('productDetail.submitReview')}
                    </button>
                  </form>
                )}
              </>
            );
          })()}
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
          >
            <h2 className="text-4xl font-serif font-bold text-dark-950 mb-8">
              {t('productDetail.relatedTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/produs/${relatedProduct.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg card-lux-hover"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={relatedProduct.image}
                      alt={getProductName(relatedProduct)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-dark-950 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {getProductName(relatedProduct)}
                    </h3>
                    <div className="flex items-center space-x-1 mb-3">
                      <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
                      <span className="font-semibold text-sm">{relatedProduct.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
