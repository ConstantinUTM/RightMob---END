import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, X, ChevronLeft, ChevronRight, MessageSquare, Star } from 'lucide-react';
import galleryService from '../services/galleryService';
import categoriesService from '../services/categoriesService';
import Breadcrumbs from '../components/Breadcrumbs';
import { CATEGORY_LABELS } from '../components/Breadcrumbs';
import { useLanguage } from '../contexts/LanguageContext';
import { getUploadsBase } from '../lib/api';
import { getLocalizedField } from '../lib/localizedContent';
import { getCategoryLabel } from '../lib/translationHelpers';

const toFullUrl = (src: string) => {
  const base = getUploadsBase();
  return src.startsWith('http') ? src : `${base}${src.startsWith('/') ? '' : '/'}${src}`;
};

const GalleryDetailPage: React.FC = () => {
  const { t, getDetailLabel, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [categoryList, setCategoryList] = useState<{ id: string; label: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentIsOwner, setCommentIsOwner] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    categoriesService.getCategories().then((list) => {
      setCategoryList(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    galleryService
      .getGalleryItemById(id)
      .then((data) => {
        if (data) {
          setItem(data);
          return;
        }
        return galleryService.getGallery().then((list) => {
          const found = Array.isArray(list) ? list.find((x: any) => String(x.id) === String(id)) : null;
          setItem(found || null);
        });
      })
      .catch(() => {
        return galleryService.getGallery()
          .then((list) => {
            const found = Array.isArray(list) ? list.find((x: any) => String(x.id) === String(id)) : null;
            setItem(found || null);
          })
          .catch(() => setItem(null));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (item) setSelectedImageIndex(0);
  }, [id, item?.id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50/80 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">{t('gallery.loading')}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50/80 flex items-center justify-center pt-24">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">{t('gallery.notFound')}</h2>
          <p className="text-neutral-500 mb-6">{t('gallery.notFoundHint')}</p>
          <Link
            to="/galerie"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('gallery.backToGallery')}
          </Link>
        </div>
      </div>
    );
  }

  const allImages: string[] = (() => {
    const seen = new Set<string>();
    const add = (src: string) => {
      const full = toFullUrl(src);
      if (!seen.has(full)) {
        seen.add(full);
        return full;
      }
      return null;
    };
    const list: string[] = [];
    if (item.url) {
      const u = add(item.url);
      if (u) list.push(u);
    }
    if (Array.isArray(item.images)) {
      item.images.forEach((img: string | { url?: string }) => {
        const src = typeof img === 'string' ? img : img?.url;
        if (src) {
          const u = add(src);
          if (u) list.push(u);
        }
      });
    }
    if (item.details && Array.isArray(item.details)) {
      item.details.forEach((d: any) => {
        if (Array.isArray(d?.images)) {
          d.images.forEach((img: string | { url?: string }) => {
            const src = typeof img === 'string' ? img : img?.url;
            if (src) {
              const u = add(src);
              if (u) list.push(u);
            }
          });
        }
      });
    }
    if (Array.isArray(item.imageOrderUrls) && item.imageOrderUrls.length > 0) {
      const byFull = new Map(list.map((url) => [url, url]));
      const ordered: string[] = [];
      const used = new Set<string>();
      item.imageOrderUrls.forEach((raw: string) => {
        const full = toFullUrl(raw);
        if (byFull.has(full) && !used.has(full)) {
          used.add(full);
          ordered.push(full);
        }
      });
      list.forEach((full) => {
        if (!used.has(full)) ordered.push(full);
      });
      return ordered.length ? ordered : (item.url ? [toFullUrl(item.url)] : []);
    }
    return list.length ? list : (item.url ? [toFullUrl(item.url)] : []);
  })();
  const currentImageUrl = allImages[selectedImageIndex] || allImages[0] || '';
  const categoryLabelsFallback = Object.fromEntries(categoryList.map((c) => [c.id, c.label]));
  const categoryLabel = item.category
    ? getCategoryLabel(t, item.category, { ...categoryLabelsFallback, ...CATEGORY_LABELS })
    : null;

  // Descriere „Despre proiect” – pe limbă (RO/EN/RU); fallback la aboutDescription sau titlu
  const lang = (language || 'ro') as 'ro' | 'en' | 'ru';
  const aboutRaw = getLocalizedField(item, 'aboutDescription', lang) || (item.aboutDescription != null ? String(item.aboutDescription).trim() : '');
  const aboutText = aboutRaw || getLocalizedField(item, 'description', lang) || (item.description ? String(item.description).trim() : '') || '';
  const hasAboutText = aboutText.length > 0;

  // Tabel doar pentru câmpurile suplimentare din admin (item.details); valoare după limbă (RO/EN/RU)
  const detailsTable: { label: string; value: string }[] = [];
  if (item.details && Array.isArray(item.details)) {
    item.details.forEach((d: any) => {
      if (typeof d !== 'object' || d === null) return;
      const label = (d.label != null ? String(d.label) : d.title != null ? String(d.title) : '').trim();
      const roText = (d.value != null && typeof d.value !== 'object' ? String(d.value) : typeof d.text === 'string' ? d.text.trim() : '').trim();
      const enText = (typeof d.text_en === 'string' ? d.text_en.trim() : '').trim();
      const ruText = (typeof d.text_ru === 'string' ? d.text_ru.trim() : '').trim();
      const value = (lang === 'en' && enText) ? enText : (lang === 'ru' && ruText) ? ruText : roText;
      if (!value) return;
      detailsTable.push({ label: label || '—', value });
    });
  }
  const hasDetailsTable = detailsTable.length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="container-custom py-6 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-5xl mx-auto"
        >
          <Link
            to="/galerie"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-800 font-medium text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('gallery.backToGallery')}
          </Link>

          <Breadcrumbs
            currentLabel={getLocalizedField(item, 'description', lang) || t('gallery.noDescription')}
            categoryId={item.category}
            categoryLabels={categoryLabelsFallback}
          />

          {/* Galerie: imagine mare, fără card de vânzare */}
          <header className="mb-10">
            {categoryLabel && (
              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.2em] mb-2">
                {categoryLabel}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-serif font-light text-neutral-900 leading-[1.15] tracking-tight">
              {getLocalizedField(item, 'description', lang) || t('gallery.noDescription')}
            </h1>
          </header>

          {/* Imagine principală – fără card, doar poza */}
          <div className="mb-6">
            <div
              className="relative flex items-center justify-center cursor-zoom-in"
              style={{ minHeight: 'min(80vh, 700px)' }}
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={currentImageUrl}
                alt={getLocalizedField(item, 'description', lang) || 'Proiect mobilier RightMob'}
                loading="eager"
                decoding="async"
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg pointer-events-none select-none"
                draggable={false}
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
            </div>

            {/* Bandă poze – selectare imagine principală */}
            {allImages.length > 1 && (
              <div className="mt-4 -mx-4 sm:mx-0 overflow-x-auto pb-2 scrollbar-thin overflow-y-hidden">
                <div className="flex gap-3 px-4 sm:px-0 min-w-0">
                  {allImages.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-20 sm:w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 ${
                        selectedImageIndex === idx
                          ? 'border-neutral-700 ring-2 ring-neutral-400/50'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={src}
                        alt={`${getLocalizedField(item, 'description', lang) || 'Proiect mobilier'} - imagine ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
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
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Despre proiect – text galerie, nu cutie de produs */}
          <section className="max-w-2xl mb-14">
            <h2 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.2em] mb-4">
              {t('gallery.aboutProject')}
            </h2>
            {hasAboutText ? (
              <p className="text-lg text-neutral-700 leading-relaxed font-serif whitespace-pre-line">
                {aboutText}
              </p>
            ) : (
              <p className="text-neutral-400 italic">{t('gallery.noDescription')}</p>
            )}
          </section>

          {/* Detalii – listă clară, câte un rând per câmp */}
          {hasDetailsTable && (
            <section className="pt-8 border-t border-neutral-200/80">
              <h2 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.2em] mb-5">
                {t('gallery.details')}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 max-w-3xl">
                {detailsTable.map((row, i) => (
                  <div key={i} className="flex flex-col gap-0.5 py-2 border-b border-neutral-100 last:border-0">
                    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {getDetailLabel(row.label)}
                    </dt>
                    <dd className="text-sm text-neutral-800 leading-snug">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Recenzii – listă + formular (vizibil pentru toți, inclusiv admin) */}
          <section className="pt-8 border-t border-neutral-200/80">
            <h2 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t('gallery.reviewsTitle')}
            </h2>
            {(() => {
              const visibleReviews = (item.reviews || []).filter((r: any) => r.visible !== false && (r.text || '').trim());
              const totalRating = visibleReviews.reduce((sum: number, rev: any) => sum + (Number(rev.rating) || 5), 0);
              const avgRating = visibleReviews.length ? (totalRating / visibleReviews.length).toFixed(1) : null;
              return (
                <>
                  {visibleReviews.length > 0 && (
                    <div className="max-w-2xl mb-6 rounded-2xl border border-neutral-200 bg-white px-4 py-3 sm:px-5 sm:py-4 flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">Scor mediu</p>
                        <p className="text-xl font-semibold text-neutral-900">{avgRating}/5</p>
                      </div>
                      <div className="h-8 w-px bg-neutral-200" aria-hidden />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500">Total recenzii</p>
                        <p className="text-xl font-semibold text-neutral-900">{visibleReviews.length}</p>
                      </div>
                    </div>
                  )}

                  {visibleReviews.length > 0 && (
                    <ul className="space-y-4 max-w-2xl mb-8">
                      {visibleReviews.map((rev: any, i: number) => (
                        <li key={rev.id || i} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-1" aria-label={`Rating ${rev.rating || 5} din 5`}>
                              {Array.from({ length: 5 }, (_, starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`w-4 h-4 ${(starIdx + 1) <= (rev.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`}
                                />
                              ))}
                            </div>
                            {(rev.author || rev.date) && (
                              <p className="text-xs text-neutral-500 text-right">
                                {rev.author}
                                {rev.author && rev.date ? ' · ' : ''}
                                {rev.date ? new Date(rev.date).toLocaleDateString(language === 'ro' ? 'ro-RO' : language === 'ru' ? 'ru-RU' : 'en-GB') : ''}
                              </p>
                            )}
                          </div>
                          <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{(language === 'en' ? rev.text_en : language === 'ru' ? rev.text_ru : rev.text_ro) || rev.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {reviewSent ? (
                    <div className="max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4">
                      <p className="text-emerald-700 font-medium">{t('productDetail.reviewSent')}</p>
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!commentText.trim() || !id) return;
                        setSubmittingReview(true);
                        try {
                          await galleryService.addReview(id, {
                            text: commentText.trim(),
                            rating: commentRating,
                            author: commentAuthor.trim() || undefined,
                            source: commentIsOwner ? 'owner' : 'visitor',
                            lang: language,
                          });
                          setCommentText('');
                          setCommentAuthor('');
                          setCommentRating(5);
                          setReviewSent(true);
                          const updated = await galleryService.getGalleryItemById(id);
                          if (updated) setItem(updated);
                        } catch (err) {
                          console.error(err);
                          alert((err as Error).message);
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                      className="max-w-2xl rounded-3xl border border-neutral-200 bg-white shadow-[0_16px_35px_rgba(0,0,0,0.05)] p-5 sm:p-7 space-y-6"
                    >
                      <div className="pb-4 border-b border-neutral-200/80">
                        <label className="block text-sm font-semibold text-neutral-800 mb-3">{t('productDetail.ratingLabel')}</label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Array.from({ length: 5 }, (_, i) => {
                            const value = i + 1;
                            const active = value <= commentRating;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setCommentRating(value)}
                                className={`p-1.5 rounded-lg transition-all ${active ? 'bg-amber-50' : 'hover:bg-neutral-100'}`}
                                aria-label={`Alege ${value} stele`}
                              >
                                <Star className={`w-6 h-6 ${active ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`} />
                              </button>
                            );
                          })}
                          <span className="text-xs font-medium text-neutral-500 ml-2 px-2 py-1 rounded-full bg-neutral-100">{commentRating}/5</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">{t('productDetail.addComment')}</label>
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={5}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                          placeholder={t('productDetail.addComment')}
                          required
                        />
                        <p className="text-xs text-neutral-500 mt-2">Scrie pe scurt experiența ta cu lucrarea: calitate, finisaje, comunicare, montaj.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
                        <input
                          type="text"
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 bg-white"
                          placeholder={t('productDetail.authorPlaceholder')}
                        />
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-neutral-200 bg-white">
                          <input
                            type="checkbox"
                            checked={commentIsOwner}
                            onChange={(e) => setCommentIsOwner(e.target.checked)}
                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-700 whitespace-nowrap">{t('productDetail.iAmOwner')}</span>
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview || !commentText.trim()}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {submittingReview ? '...' : t('productDetail.submitReview')}
                      </button>
                    </form>
                  )}
                </>
              );
            })()}
          </section>

          <AnimatePresence>
            {lightboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxOpen(false)}
                className="fixed inset-0 z-50 bg-black/95 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
                  aria-label={t('common.close')}
                >
                  <X className="w-6 h-6" />
                </button>
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
                      aria-label="Imagine anterioară"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev >= allImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
                      aria-label="Imagine următoare"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center p-4 pt-14 pb-2 min-h-0 overflow-hidden"
                >
                  <img
                    src={currentImageUrl}
                    alt={item.description || item.filename || 'Galerie'}
                    className="max-w-full max-h-[72vh] sm:max-h-[80vh] w-auto h-auto object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                </div>
                {/* Bandă fixă cu toate pozele jos – mereu vizibilă, click pentru a alege imaginea */}
                {allImages.length > 1 && (
                  <div
                    className="flex-shrink-0 w-full bg-black/80 border-t border-white/10 overflow-x-auto overflow-y-hidden py-3 px-2 flex justify-center gap-2 scrollbar-thin"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allImages.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                          selectedImageIndex === idx
                            ? 'border-white ring-2 ring-white/60 shadow-lg'
                            : 'border-white/25 opacity-75 hover:opacity-100 hover:border-white/50'
                        }`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default GalleryDetailPage;
