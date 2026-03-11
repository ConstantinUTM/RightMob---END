import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import galleryService from '../services/galleryService';
import categoriesService from '../services/categoriesService';
import { CATEGORY_LABELS } from '../components/Breadcrumbs';
import { useLanguage } from '../contexts/LanguageContext';
import { getUploadsBase } from '../lib/api';
import { getCategoryLabel } from '../lib/translationHelpers';
import { getLocalizedField, type AppLanguage } from '../lib/localizedContent';

const SORT_VALUES = ['recent', 'name-asc', 'name-desc', 'category'] as const;
type SortValue = (typeof SORT_VALUES)[number];

const GalleryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortValue>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const filterCategory = params.get('category') || '';
  const base = getUploadsBase();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      galleryService.getGallery(),
      categoriesService.getCategories().catch(() => []),
    ])
      .then(([galleryData, cats]) => {
        if (cancelled) return;
        setCategoryList(Array.isArray(cats) ? cats : []);
        let data = Array.isArray(galleryData) ? galleryData : [];
        if (filterCategory) {
          data = data.filter((it: any) => it.category === filterCategory);
        }
        data = data.filter((it: any) => it.visible !== false);
        setItems(data);
      })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filterCategory]);

  const SORT_OPTIONS: { value: SortValue; labelKey: string }[] = [
    { value: 'recent', labelKey: 'gallery.sortNewest' },
    { value: 'name-asc', labelKey: 'gallery.sortNameAsc' },
    { value: 'name-desc', labelKey: 'gallery.sortNameDesc' },
    { value: 'category', labelKey: 'gallery.sortCategory' },
  ];

  const setCategory = (category: string) => {
    const next = new URLSearchParams(location.search);
    if (category) next.set('category', category);
    else next.delete('category');
    navigate({ pathname: '/galerie', search: next.toString() });
  };

  const categoryLabelsMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    categoryList.forEach((c) => {
      const label = getCategoryLabel(t, c.id, { [c.id]: c.label });
      map[c.id] = label;
      map[String(c.id).toLowerCase()] = label;
    });
    return map;
  }, [categoryList, t, language]);

  const sortedItems = useMemo(() => {
    const list = [...items];
    switch (sortBy) {
      case 'recent':
        return list.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
      case 'name-asc':
        return list.sort((a, b) =>
          (a.description || '').localeCompare(b.description || '')
        );
      case 'name-desc':
        return list.sort((a, b) =>
          (b.description || '').localeCompare(a.description || '')
        );
      case 'category':
        return list.sort((a, b) =>
          (getCategoryLabel(t, a.category, { ...categoryLabelsMap, ...CATEGORY_LABELS }) || a.category || '').localeCompare(
            getCategoryLabel(t, b.category, { ...categoryLabelsMap, ...CATEGORY_LABELS }) || b.category || ''
          )
        );
      default:
        return list;
    }
  }, [items, sortBy, categoryLabelsMap, t]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)
    ? t(SORT_OPTIONS.find((o) => o.value === sortBy)!.labelKey)
    : t('gallery.sortBy');
  const categoryLabel = (catId: string) =>
    catId ? getCategoryLabel(t, catId, { ...categoryLabelsMap, ...CATEGORY_LABELS }) : t('gallery.all');

  const categories = [
    { id: '', label: t('gallery.all') },
    ...categoryList.map((c) => ({ id: c.id, label: getCategoryLabel(t, c.id, { [c.id]: c.label }) || c.label })),
  ];

  const toUrl = (url: string) => (url && url.startsWith('http') ? url : base + (url.startsWith('/') ? url : '/' + url));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero full-width – ca în referință */}
      <section className="relative min-h-[50vh] flex flex-col justify-end bg-neutral-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          {items.length > 0 && items[0].url && (
            <img
              src={toUrl(items[0].url)}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="container-custom relative z-10 pb-16 pt-32">
          <p className="text-xs text-white/70 uppercase tracking-[0.2em] mb-3">
            {t('nav.home')} / {t('nav.products')}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-tight">
            {filterCategory ? categoryLabel(filterCategory) : t('gallery.title')}
          </h1>
        </div>
      </section>

      {/* Titlu + filtre – container restrâns */}
      <div className="container-custom px-4 sm:px-6 py-10 md:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-light text-neutral-900">
            {items.length > 0 ? (filterCategory ? categoryLabel(filterCategory) : t('gallery.fromOurGallery')) : t('gallery.title')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = filterCategory ? cat.id === filterCategory : !cat.id;
              return (
                <button
                  key={cat.id || 'all'}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
            <div className="relative border-l border-neutral-200 pl-2 ml-1">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
              >
                {sortLabel}
                <ChevronDown className={`w-4 h-4 ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden onClick={() => setSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-2 py-2 bg-white rounded-lg border border-neutral-200 shadow-xl z-20 min-w-[160px]"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm ${sortBy === opt.value ? 'bg-neutral-100 text-neutral-900 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Grid galerie – container restrâns (nu full-bleed), cu mărimi neuniforme */}
      <div className="container-custom px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-neutral-100 animate-pulse rounded-xl overflow-hidden">
                <div className="aspect-[4/3] min-h-[220px] sm:min-h-[260px]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 container-custom"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">{t('gallery.noProducts')}</h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
              {filterCategory
                ? t('gallery.noProductsInCategory').replace('{category}', categoryLabel(filterCategory))
                : t('gallery.noProductsHint')}
            </p>
            {filterCategory && (
              <button type="button" onClick={() => setCategory('')} className="text-neutral-700 font-medium underline hover:no-underline">
                {t('gallery.showAllCategories')}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 auto-rows-[200px] sm:auto-rows-[240px] md:auto-rows-[280px] lg:auto-rows-[320px] grid-flow-dense">
            <AnimatePresence mode="popLayout">
              {sortedItems.map((item, idx) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  total={sortedItems.length}
                  toUrl={toUrl}
                  categoryLabel={categoryLabel}
                  language={language}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

type GalleryCardProps = {
  item: any; idx: number; total: number;
  toUrl: (u: string) => string; categoryLabel: (c: string) => string;
  language: string; t: (k: string) => string;
};
const GalleryCard = React.forwardRef<HTMLDivElement, GalleryCardProps>(
  ({ item, idx, total, toUrl, categoryLabel, language, t }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isBlue = idx % 2 === 0;
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [ref]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current || !glowRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.opacity = '1';
    glowRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, ${isBlue ? 'rgba(37,99,235,0.25)' : 'rgba(220,38,38,0.25)'}, transparent 70%)`;
  }, [isBlue]);

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
  }, []);

  const url = toUrl(item.url || '');
  const cols = 4;
  const remainder = total % cols || (total ? cols : 0);
  const noSingleLast = remainder !== 1;
  const spanRow = noSingleLast && (idx % 3 === 0 || idx % 4 === 2) && idx < total - cols;
  const spanCol = noSingleLast && idx % 4 === 1 && total > idx + 1;

  return (
    <motion.div
      ref={setRefs}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.25) }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`rounded-2xl overflow-hidden bg-neutral-900 shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${spanRow ? 'row-span-2' : ''} ${spanCol && !spanRow ? 'col-span-2' : ''}`}
    >
      <Link to={item.id ? `/galerie/${item.id}` : '/galerie'} className="block h-full group relative">
        <div className="relative w-full h-full min-h-[200px] sm:min-h-[240px] md:min-h-[280px]">
          <img
            src={url}
            alt={item.description || item.filename || ''}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div
            ref={glowRef}
            className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
          />

          {item.category && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium rounded-full border border-white/20">
              {categoryLabel(item.category)}
            </span>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <p className="text-white text-sm sm:text-base font-semibold line-clamp-2 drop-shadow-lg">
              {getLocalizedField(item, 'description', language as AppLanguage) || t('gallery.noDescription')}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
GalleryCard.displayName = 'GalleryCard';

export default GalleryPage;
