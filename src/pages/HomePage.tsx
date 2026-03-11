import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { getAllProducts } from '../services/productService';
import { getRecentReviews } from '../services/galleryService';
import { Product } from '../data/products';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import { getUploadsBase } from '../lib/api';
import { CATEGORY_IMAGES, CATEGORY_IMAGE_FALLBACKS } from '../config/categoryImages';
import heroImageFallback from '../../images/IMG_9859.JPG';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { features } = useSiteSettings();

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getAllProducts();
      setProducts(data);
    };
    loadProducts();
  }, []);

  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <VideoSection />
      {features.tryInMyRoomEnabled && <TryRoomSection />}
      <CollectionsSection products={products} />
      <TestimonialsSection />
    </div>
  );
};

const HERO_IMAGE_PUBLIC = '/images/IMG_9859.JPG';

// Hero Section
const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const { getImageOverride } = useSiteContent();
  const heroImage = getImageOverride('home.heroImage', HERO_IMAGE_PUBLIC);
  const [heroSrc, setHeroSrc] = useState(heroImage);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setHeroSrc(heroImage);
    setImageLoaded(false);
  }, [heroImage]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Placeholder (blur/gradient) – se vede imediat */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-neutral-300 via-neutral-200 to-neutral-400"
        aria-hidden
      />
      {/* Background Image – preload din public, fallback la imagine bundlată */}
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <img
          src={heroSrc}
          alt="Luxury furniture"
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          decoding="async"
          fetchpriority="high"
          onLoad={() => setImageLoaded(true)}
          onError={() => setHeroSrc(heroImageFallback)}
        />
        <div className="gradient-overlay" />
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-20 right-10 w-48 h-48 bg-neutral-600/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content direct pe fundal, fără card transparent */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 flex justify-center">
        <div className="w-full max-w-5xl lg:max-w-6xl pt-24 pb-12 px-6 sm:pt-14 sm:pb-14 sm:px-10 md:py-16 md:px-14 lg:px-16 text-center space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="flex flex-col items-center justify-center text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-tight"
        >
          <span className="uppercase" style={{ color: '#2563eb', textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>Right</span>
          <span className="text-[#dc2626] -mt-1 md:-mt-2 uppercase" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>Mob</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed"
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
        >
          <Link
            to="/galerie"
            className="btn-lux flex items-center gap-2"
          >
            <span>{t('hero.cta')}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/despre"
            className="group btn-secondary flex items-center space-x-2 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
          >
            <span>{t('nav.about')}</span>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 md:pt-16"
        >
          {[
            { number: '100+', label: t('hero.stats.products') },
            { number: '7', label: t('hero.stats.experience') },
            { number: '70+', label: t('hero.stats.happyClients') },
          ].map((stat, index) => (
            <div key={index} className="text-white text-center">
              <div className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-br from-white to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                {stat.number}
              </div>
              <div className="text-xs md:text-sm text-white/70 mt-2 uppercase tracking-widest font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

const VideoSection: React.FC = () => {
  const { t } = useLanguage();
  const { getImageOverride } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const videoSrc = getImageOverride('home.videoFile', '/images/video/home.mp4');
  const videoPoster = getImageOverride('home.videoPoster', '/images/IMG_9859.JPG');
  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-[#FAFAF9] overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#2563eb]/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom max-w-7xl mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12 lg:gap-20 items-center">
          {/* Video – portrait, elegant frame */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto lg:mx-0"
          >
            <div className="relative w-[300px] sm:w-[360px] lg:w-[400px]">
              {/* Glow behind video */}
              <div className="absolute -inset-3 bg-gradient-to-br from-[#2563eb]/10 via-transparent to-amber-200/10 rounded-3xl blur-xl pointer-events-none" />
              {/* Gold accent line */}
              <div className="absolute -left-3 top-8 bottom-8 w-[2px] bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />

              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/[0.08] aspect-[9/16]">
                <video
                  ref={(el) => {
                    if (el && isInView) el.play().catch(() => {});
                  }}
                  className="w-full h-full object-cover"
                  src={videoSrc}
                  autoPlay
                  muted
                  controls
                  playsInline
                  loop
                  preload="auto"
                  poster={videoPoster}
                />
              </div>
            </div>
          </motion.div>

          {/* Text – elegant description */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif font-light text-[#0a0a0a] leading-[1.05] tracking-tight whitespace-pre-line mb-8">
              {t('videoSection.title')}
            </h2>

            <div className="w-16 h-[1.5px] bg-gradient-to-r from-[#2563eb]/60 to-amber-400/40 mb-8" />

            <p className="text-base lg:text-[1.1rem] text-neutral-600 leading-[1.75] max-w-xl mb-10">
              {t('videoSection.description')}
            </p>

            {/* Luxury stats */}
            <div className="flex gap-12 mb-12">
              <div>
                <p className="text-4xl lg:text-5xl font-serif font-bold text-[#0a0a0a] tracking-tight">
                  500<span className="text-[#0a0a0a] font-light">+</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-2 font-medium">{t('videoSection.stat1Label')}</p>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-neutral-200 to-transparent" />
              <div>
                <p className="text-4xl lg:text-5xl font-serif font-bold text-[#0a0a0a] tracking-tight">
                  100<span className="text-[#0a0a0a] font-light">%</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-2 font-medium">{t('videoSection.stat2Label')}</p>
              </div>
            </div>

            {/* About + Brand signature */}
            <div className="mt-14 flex items-center gap-4 flex-wrap">
              <Link
                to="/despre"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[#0a0a0a] hover:text-black transition-colors"
              >
                {t('nav.about')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="w-10 h-px bg-neutral-300" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold">
                <span className="text-[#2563eb]">RIGHT</span><span className="text-[#dc2626]">MOB</span>
              </span>
              <div className="w-10 h-px bg-neutral-300" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TryRoomSection: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative py-20 bg-gradient-to-br from-[#0f1110] via-[#161815] to-[#0f1110]">
      <div className="container-custom grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">{t('nav.tryRoom')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
            {t('tryRoom.title')}
          </h2>
          <p className="text-gray-300 text-lg max-w-xl">
            {t('tryRoom.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/try-room"
              className="btn-lux flex items-center gap-2"
            >
              {t('tryRoom.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/galerie"
              className="btn-lux flex items-center gap-2"
            >
              {t('nav.products')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-gradient-to-br from-[#262622] via-[#1d1f1b] to-[#10110f]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-white font-bold">
                  {t('tryRoom.previewBadge')}
                </div>
                <div>
                  <p className="text-white font-semibold">{t('tryRoom.previewTitle')}</p>
                  <p className="text-white/70 text-sm">{t('tryRoom.previewSubtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Collections Section
const CollectionsSection: React.FC<{ products: Product[] }> = ({ products }) => {
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const base = getUploadsBase();

  const toImageUrl = (path: string) =>
    path.startsWith('/uploads/') ? `${base}${path}` : path.startsWith('http') ? path : path;

  const collections = [
    {
      title: t('collections.cards.living.title'),
      description: t('collections.cards.living.description'),
      image: toImageUrl(CATEGORY_IMAGES.living || CATEGORY_IMAGE_FALLBACKS.living),
      category: 'living',
      items: `${products.filter(p => p.category === 'living').length} ${t('collections.itemsLabel')}`,
    },
    {
      title: t('collections.cards.bedroom.title'),
      description: t('collections.cards.bedroom.description'),
      image: toImageUrl(CATEGORY_IMAGES.dormitor || CATEGORY_IMAGE_FALLBACKS.dormitor),
      category: 'dormitor',
      items: `${products.filter(p => p.category === 'dormitor').length} ${t('collections.itemsLabel')}`,
    },
    {
      title: t('collections.cards.kitchen.title'),
      description: t('collections.cards.kitchen.description'),
      image: toImageUrl(CATEGORY_IMAGES.bucatarie || CATEGORY_IMAGE_FALLBACKS.bucatarie),
      category: 'bucatarie',
      items: `${products.filter(p => p.category === 'bucatarie').length} ${t('collections.itemsLabel')}`,
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-gradient-to-b from-white via-blue-50/20 to-white relative">
      {/* Decorative Elements (overflow-hidden doar aici ca border-ul cardurilor să nu se taie) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10 pt-2">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-dark-950 mb-6 leading-tight">
            {t('collections.title')}
          </h2>
          <p className="text-xl md:text-2xl text-dark-600 leading-relaxed">
            {t('collections.subtitle')}
          </p>
        </motion.div>

        {/* Collections Grid - New Design (padding ca border-ul de selecție să nu se taie sus) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              className="pt-1"
            >
              <Link
                to={`/galerie?category=${collection.category}`}
                className="group block relative h-[500px] rounded-3xl overflow-visible shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                {/* Image with Overlay (overflow-hidden doar pe imagine) */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const fallback = CATEGORY_IMAGE_FALLBACKS[collection.category as keyof typeof CATEGORY_IMAGE_FALLBACKS];
                      if (fallback) (e.target as HTMLImageElement).src = fallback;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  
                  {/* Animated Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      index === 0 ? 'bg-gradient-to-t from-blue-500/20 to-transparent' :
                      index === 1 ? 'bg-gradient-to-t from-red-500/20 to-transparent' :
                      'bg-gradient-to-t from-blue-500/15 to-transparent'
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-8 text-white">
                  {/* Top Badge */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="self-start"
                  >
                    <span className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/30">
                      <Sparkles className="w-4 h-4" />
                      <span>{collection.items}</span>
                    </span>
                  </motion.div>

                  {/* Bottom Content */}
                  <motion.div
                    initial={{ y: 20 }}
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <h3 className="text-4xl md:text-5xl font-serif font-bold">
                        {collection.title}
                      </h3>
                      <div className="h-1 w-20 bg-gradient-to-r from-blue-400 via-blue-300 to-red-400 rounded-full" />
                    </div>
                    <p className="text-lg text-gray-200 leading-relaxed">
                      {collection.description}
                    </p>
                    <div className="flex items-center space-x-2 text-blue-300 font-semibold pt-2 group-hover:space-x-4 transition-all">
                      <span>{t('collections.viewDetails')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </motion.div>
                </div>

                {/* Hover Border Effect (overflow-visible pe Link ca border-ul să nu se taie) */}
                <div className={`absolute inset-0 border-4 border-transparent rounded-3xl transition-all duration-300 pointer-events-none z-10 ${
                  index === 0 ? 'group-hover:border-blue-400/50' :
                  index === 1 ? 'group-hover:border-red-400/50' :
                  'group-hover:border-blue-400/40'
                }`} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to="/galerie"
            className="btn-lux inline-flex items-center gap-3 px-10 py-5 text-lg"
          >
            <span>{t('collections.viewAll')}</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Testimonials Section – recenzii recente cu produsul și textul
const TestimonialsSection: React.FC = () => {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [recentReviews, setRecentReviews] = useState<Array<{
    productId: string;
    productName: string;
    productName_en?: string;
    productName_ru?: string;
    productImage: string;
    review: { id?: string; text: string; text_ro?: string; text_en?: string; text_ru?: string; rating?: number; author?: string; date?: string; source?: string };
  }>>([]);

  useEffect(() => {
    getRecentReviews(6).then(setRecentReviews);
  }, []);

  const uploadsBase = getUploadsBase();
  const displayItems = recentReviews.length > 0 ? recentReviews.slice(0, 6) : [];

  return (
    <section ref={ref} className="py-32 bg-gradient-to-b from-blue-50/30 to-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-dark-950 mb-6">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-dark-600 leading-relaxed">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {displayItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayItems.map((item, index) => {
              const imgSrc = item.productImage?.startsWith('http') ? item.productImage : `${uploadsBase}${item.productImage?.startsWith('/') ? '' : '/'}${item.productImage || ''}`;
              return (
                <motion.div
                  key={item.review.id || `${item.productId}-${index}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: index * 0.15 }}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.max(1, Math.min(5, Number(item.review.rating) || 5)) ? 'fill-blue-500 text-blue-500' : 'text-blue-200'}`}
                      />
                    ))}
                  </div>
                  {item.productName && (
                    <p className="text-sm font-semibold text-primary-600 mb-2 truncate" title={item.productName}>
                      {language === 'en' ? (item.productName_en || item.productName) : language === 'ru' ? (item.productName_ru || item.productName) : item.productName}
                    </p>
                  )}
                  <p className="text-dark-700 leading-relaxed mb-6 text-lg italic">
                    "{(language === 'en' ? item.review.text_en : language === 'ru' ? item.review.text_ru : item.review.text_ro) || item.review.text}"
                  </p>
                  <div className="flex items-center space-x-4">
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={item.productName || ''}
                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-100"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <div className="font-bold text-dark-950">
                        {item.review.author || '—'}
                      </div>
                      {item.review.date && (
                        <div className="text-sm text-dark-500">
                          {new Date(item.review.date).toLocaleDateString(language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-GB')}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-dark-500 text-lg">
            {t('testimonials.empty')}
          </p>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Link
            to="/galerie"
            className="btn-lux inline-flex items-center gap-2"
          >
            <span>{t('nav.products')}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HomePage;
