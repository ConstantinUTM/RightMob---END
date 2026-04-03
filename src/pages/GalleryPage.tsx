import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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

const CARD_SPAN_PATTERN = [
  'md:row-span-2 lg:row-span-2',
  'md:col-span-2 lg:col-span-2',
  'md:row-span-2 lg:row-span-2',
  '',
  '',
  'md:col-span-2 lg:col-span-2',
  '',
  '',
] as const;

const CARD_SPAN_PATTERN_COMPACT = [
  '',
  'md:col-span-2 lg:col-span-2',
  '',
  'md:col-span-2 lg:col-span-2',
  '',
  '',
] as const;

const GalleryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId: routeCategoryId } = useParams<{ categoryId?: string }>();
  const params = new URLSearchParams(location.search);
  const routeFilterCategory = (routeCategoryId || '').trim().toLowerCase();
  const queryFilterCategory = (params.get('category') || '').trim().toLowerCase();
  const filterCategory = routeFilterCategory || queryFilterCategory;
  const base = getUploadsBase();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
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
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoadError('Nu se poate încărca galeria acum. Verifică serverul API și încearcă din nou.');
        }
      })
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
    const normalizedCategory = (category || '').trim().toLowerCase();
    if (routeFilterCategory) {
      if (normalizedCategory) {
        navigate(`/mobilier/${encodeURIComponent(normalizedCategory)}`);
      } else {
        navigate('/galerie');
      }
      return;
    }

    const next = new URLSearchParams(location.search);
    if (normalizedCategory) next.set('category', normalizedCategory);
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

  const balancedItems = useMemo(() => {
    if (sortedItems.length <= 2) return sortedItems;

    const buckets = new Map<string, any[]>();
    sortedItems.forEach((item) => {
      const key = String(item.category || 'uncategorized').toLowerCase();
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(item);
    });

    const result: any[] = [];
    let lastKey = '';

    while (result.length < sortedItems.length) {
      const availableKeys = Array.from(buckets.keys()).filter((key) => (buckets.get(key)?.length || 0) > 0);
      if (!availableKeys.length) break;

      availableKeys.sort((a, b) => {
        const aCount = buckets.get(a)?.length || 0;
        const bCount = buckets.get(b)?.length || 0;
        const aPenalty = a === lastKey ? 1 : 0;
        const bPenalty = b === lastKey ? 1 : 0;
        if (aPenalty !== bPenalty) return aPenalty - bPenalty;
        return bCount - aCount;
      });

      const pickedKey = availableKeys[0];
      const bucket = buckets.get(pickedKey);
      if (!bucket || !bucket.length) break;

      const nextItem = bucket.shift();
      if (!nextItem) break;
      result.push(nextItem);
      lastKey = pickedKey;
    }

    return result.length === sortedItems.length ? result : sortedItems;
  }, [sortedItems]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)
    ? t(SORT_OPTIONS.find((o) => o.value === sortBy)!.labelKey)
    : t('gallery.sortBy');
  const categoryLabel = (catId: string) =>
    catId ? getCategoryLabel(t, catId, { ...categoryLabelsMap, ...CATEGORY_LABELS }) : t('gallery.all');
  const isSingleItem = balancedItems.length === 1;

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
              alt={filterCategory ? `${categoryLabel(filterCategory)} - proiecte RightMob` : 'Galerie proiecte mobilier RightMob'}
              decoding="async"
              loading="eager"
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

      {/* Grid galerie – neuniform (portrait + landscape) fără goluri în layout */}
      <div className="container-custom px-4 sm:px-6 pb-16">
        {loadError && !loading && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
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
          <div className={isSingleItem
            ? 'grid grid-cols-1 place-items-center'
            : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 grid-flow-dense auto-rows-[160px] sm:auto-rows-[190px] md:auto-rows-[220px] lg:auto-rows-[240px]'}>
            {balancedItems.map((item, idx) => (
              <GalleryCard
                key={item.id}
                item={item}
                idx={idx}
                total={balancedItems.length}
                singleMode={isSingleItem}
                toUrl={toUrl}
                categoryLabel={categoryLabel}
                language={language}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

type GalleryCardProps = {
  item: any; idx: number; total: number;
  singleMode?: boolean;
  toUrl: (u: string) => string; categoryLabel: (c: string) => string;
  language: string; t: (k: string) => string;
};
const GalleryCard = React.memo(({ item, idx, total, singleMode = false, toUrl, categoryLabel, language, t }: GalleryCardProps) => {

  const url = toUrl(item.url || '');
  const compactMode = total <= 8 && !singleMode;
  const pattern = compactMode ? CARD_SPAN_PATTERN_COMPACT : CARD_SPAN_PATTERN;
  const spanClass = singleMode ? '' : pattern[idx % pattern.length];

  let tailFillClass = '';
  const isLast = idx === total - 1;
  const lgRest = total % 4;
  const mdRest = total % 3;
  const smRest = total % 2;

  if (compactMode && isLast) {
    if (lgRest === 1) tailFillClass += ' lg:col-span-4';
    else if (lgRest === 3) tailFillClass += ' lg:col-span-2';
    if (mdRest === 1) tailFillClass += ' md:col-span-3';
    else if (mdRest === 2) tailFillClass += ' md:col-span-2';
    if (smRest === 1) tailFillClass += ' col-span-2';
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <article
      className={`${singleMode ? 'w-full max-w-[820px] aspect-[4/5] sm:aspect-[5/4] md:aspect-[4/3]' : 'h-full'} rounded-2xl overflow-hidden bg-neutral-900 shadow-md transition-all duration-300 hover:shadow-[0_18px_45px_rgba(220,38,38,0.24)] hover:-translate-y-0.5 ${spanClass} ${tailFillClass}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '360px' }}
    >
      <Link
        to={item.id ? `/galerie/${item.id}` : '/galerie'}
        className="block h-full group relative"
        onMouseMove={handleMouseMove}
      >
        <div className="relative w-full h-full">
          <img
            src={url}
            alt={item.description || item.filename || ''}
            loading={idx < 4 ? 'eager' : 'lazy'}
            decoding="async"
            width={1200}
            height={1500}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              if (el.dataset.fallbackApplied === '1') {
                el.src = '/images/about/about-2.jpg';
                return;
              }
              el.dataset.fallbackApplied = '1';
              el.src = '/images/IMG_9859.JPG';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
            style={{
              background:
                'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(37,99,235,0.28), transparent 42%), radial-gradient(190px circle at calc(var(--mx, 50%) + 32px) calc(var(--my, 50%) - 18px), rgba(220,38,38,0.24), transparent 45%)',
              mixBlendMode: 'screen',
            }}
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
    </article>
  );
});
GalleryCard.displayName = 'GalleryCard';

export default GalleryPage;
