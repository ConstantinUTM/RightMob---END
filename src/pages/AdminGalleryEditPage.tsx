import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import galleryService from '../services/galleryService';
import categoriesService, { type Category } from '../services/categoriesService';
import { getAdminToken } from '../contexts/AuthContext';
import { getUploadsBase } from '../lib/api';
import { translateBatch } from '../lib/translationService';
import { getAllDetailFields, detailsToMapMultilingual, detailsFromMapMultilingual } from '../lib/categoryDetailFields';
import { Loader2, Star, ImagePlus, Trash2, Languages, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';

const ACCENT = '#374151';

const toBase64 = (f: File) =>
  new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(String(reader.result));
    reader.onerror = rej;
    reader.readAsDataURL(f);
  });

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

const safeTranslated = (source: string, translated?: string) => {
  const src = (source || '').trim();
  const tr = (translated || '').trim();
  if (!tr) return src;
  if (src.length >= 3 && tr.length <= 1) return src;
  if (src.length >= 6 && tr.length <= Math.max(1, Math.floor(src.length * 0.2))) return src;
  return tr;
};

const collectImageEntries = (it: any): Array<{ url: string; filename?: string }> => {
  const out: Array<{ url: string; filename?: string }> = [];
  const seen = new Set<string>();
  if (it?.url) {
    out.push({ url: it.url, filename: it.filename || '' });
    seen.add(it.url);
  }
  if (Array.isArray(it?.details)) {
    it.details.forEach((row: any) => {
      if (!Array.isArray(row?.images)) return;
      row.images.forEach((img: any) => {
        if (!img?.url || seen.has(img.url)) return;
        seen.add(img.url);
        out.push({ url: img.url, filename: img.filename || '' });
      });
    });
  }
  return out;
};

const AdminGalleryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutDescription_ro, setAboutDescriptionRo] = useState('');
  const [aboutDescription_en, setAboutDescriptionEn] = useState('');
  const [aboutDescription_ru, setAboutDescriptionRu] = useState('');
  const [category, setCategory] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [editDetailValues, setEditDetailValues] = useState<Record<string, string>>({});
  const [editDetailValuesEn, setEditDetailValuesEn] = useState<Record<string, string>>({});
  const [editDetailValuesRu, setEditDetailValuesRu] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [urlsToRemove, setUrlsToRemove] = useState<string[]>([]);
  const [setMainImageUrl, setSetMainImageUrl] = useState<string | null>(null);
  const [imageOrderUrls, setImageOrderUrls] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [translating, setTranslating] = useState(false);
  const didAutoFillTranslations = useRef<string | null>(null);

  type ReviewEntry = { id?: string; text: string; author: string; date: string; visible: boolean; source?: string };
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  const defaultCategoriesFallback: Category[] = [
    { id: 'living', label: 'Cameră de zi' },
    { id: 'dormitor', label: 'Dormitor' },
    { id: 'bucatarie', label: 'Bucătărie' },
    { id: 'birou', label: 'Birou' },
    { id: 'hol', label: 'Hol' },
    { id: 'baie', label: 'Baie' },
    { id: 'copii', label: 'Cameră Copii' },
    { id: 'gradina', label: 'Grădină' },
  ];

  useEffect(() => {
    setCategoriesLoading(true);
    categoriesService.getCategories()
      .then((list) => setCategoryList(Array.isArray(list) && list.length > 0 ? list : defaultCategoriesFallback))
      .catch(() => setCategoryList(defaultCategoriesFallback))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    let cancelled = false;
    const run = async () => {
      try {
        let data = await galleryService.getGalleryItemById(id);
        if (!data) {
          const list = await galleryService.getGallery();
          const arr = Array.isArray(list) ? list : [];
          data = arr.find((x: any) => String(x.id) === String(id)) ?? null;
        }
        if (cancelled) return;
        if (data) {
          setItem(data);
          setDescription(data.description ?? '');
          setAboutDescription(data.aboutDescription ?? '');
          setAboutDescriptionRo(data.aboutDescription_ro ?? data.aboutDescription ?? '');
          setAboutDescriptionEn(data.aboutDescription_en ?? '');
          setAboutDescriptionRu(data.aboutDescription_ru ?? '');
          setCategory(data.category ?? '');
          setIsPrimary(!!data.isPrimary);
          const details: Array<{ title?: string; text?: string; text_en?: string; text_ru?: string }> = [];
          if (Array.isArray(data.details)) {
            data.details.forEach((d: any) => {
              const title = (typeof d.title === 'string' ? d.title : d.label != null ? String(d.label) : '').trim();
              const text = (typeof d.text === 'string' ? d.text : d.value != null ? String(d.value) : '').trim();
              const text_en = typeof d.text_en === 'string' ? d.text_en.trim() : '';
              const text_ru = typeof d.text_ru === 'string' ? d.text_ru.trim() : '';
              if (title || text || text_en || text_ru) details.push({ title: title || '—', text, text_en, text_ru });
            });
          }
          const { ro, en, ru } = detailsToMapMultilingual(details);
          setEditDetailValues(ro);
          setEditDetailValuesEn(en);
          setEditDetailValuesRu(ru);
          const revs = Array.isArray(data.reviews)
            ? data.reviews.map((r: any) => ({
                id: r.id,
                text: typeof r.text === 'string' ? r.text : '',
                author: r.author != null ? String(r.author) : '',
                date: r.date != null ? String(r.date) : '',
                visible: r.visible !== false,
                source: r.source,
              }))
            : [];
          setReviews(revs);
          const discovered = collectImageEntries(data).map((x) => x.url);
          if (Array.isArray(data.imageOrderUrls) && data.imageOrderUrls.length > 0) {
            const fromSaved = data.imageOrderUrls.filter((u: any) => typeof u === 'string').map((u: string) => u.trim()).filter(Boolean);
            const used = new Set<string>();
            const ordered: string[] = [];
            fromSaved.forEach((u: string) => {
              if (discovered.includes(u) && !used.has(u)) {
                used.add(u);
                ordered.push(u);
              }
            });
            discovered.forEach((u) => {
              if (!used.has(u)) ordered.push(u);
            });
            setImageOrderUrls(ordered);
          } else {
            setImageOrderUrls(discovered);
          }
        } else {
          setItem(null);
        }
      } catch {
        if (!cancelled) setItem(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoomIndex == null) return;
      if (e.key === 'Escape') {
        setZoomIndex(null);
        return;
      }
      const maxIndex = Math.max(imageOrderUrls.length - 1, 0);
      if (e.key === 'ArrowRight') {
        setZoomIndex((prev) => (prev == null ? prev : Math.min(prev + 1, maxIndex)));
      }
      if (e.key === 'ArrowLeft') {
        setZoomIndex((prev) => (prev == null ? prev : Math.max(prev - 1, 0)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIndex, imageOrderUrls.length]);

  useEffect(() => {
    didAutoFillTranslations.current = null;
  }, [id]);

  /** La editare: completează automat EN/RU dacă lipsesc (traducere din RO), ca să editezi doar când vezi defecte. */
  useEffect(() => {
    if (!id || loading || !item) return;
    if (didAutoFillTranslations.current === id) return;
    const ro = (aboutDescription_ro ?? '').trim();
    const needAbout = ro && (!(aboutDescription_en ?? '').trim() || !(aboutDescription_ru ?? '').trim());
    const detailLabels = getAllDetailFields();
    const needDetails = detailLabels.some((label) => {
      const roVal = (editDetailValues[label] ?? '').trim();
      if (!roVal) return false;
      const enVal = (editDetailValuesEn[label] ?? '').trim();
      const ruVal = (editDetailValuesRu[label] ?? '').trim();
      return !enVal || !ruVal;
    });
    if (needAbout || needDetails) {
      didAutoFillTranslations.current = id;
      handleAutoTranslateAll();
    }
  }, [id, loading, item, aboutDescription_ro, aboutDescription_en, aboutDescription_ru, editDetailValues, editDetailValuesEn, editDetailValuesRu]);

  const categoryOptions = [
    { value: '', label: '— Selectează categorie —' },
    ...categoryList.map((c) => ({ value: c.id, label: c.label })),
  ];

  /** Traduce toate câmpurile într-un singur request (batch) – mai puțină încărcare, traducere după context. */
  const handleAutoTranslateAll = async () => {
    const aboutSource = aboutDescription_ro?.trim() || aboutDescription?.trim();
    const detailLabels = getAllDetailFields();
    const detailSources = detailLabels
      .map((label) => ({ label, text: (editDetailValues[label] ?? '').trim() }))
      .filter((x) => x.text.length > 0);
    if (!aboutSource && detailSources.length === 0) {
      alert('Completează mai întâi câmpul „Despre proiect” (Română) și/sau cel puțin un câmp la Detalii, apoi apasă Traduce toate.');
      return;
    }
    setTranslating(true);
    try {
      const items: { id: string; text: string; to: 'en' | 'ru' }[] = [];
      if (aboutSource) {
        items.push({ id: 'about_en', text: aboutSource, to: 'en' }, { id: 'about_ru', text: aboutSource, to: 'ru' });
      }
      detailSources.forEach(({ label, text }) => {
        items.push({ id: `d_${label}_en`, text, to: 'en' }, { id: `d_${label}_ru`, text, to: 'ru' });
      });
      const results = await translateBatch(items);
      if (aboutSource) {
        setAboutDescriptionEn(safeTranslated(aboutSource, results['about_en']));
        setAboutDescriptionRu(safeTranslated(aboutSource, results['about_ru']));
      }
      const newEn: Record<string, string> = {};
      const newRu: Record<string, string> = {};
      detailSources.forEach(({ label, text }) => {
        const en = safeTranslated(text, results[`d_${label}_en`]);
        const ru = safeTranslated(text, results[`d_${label}_ru`]);
        if (en) newEn[label] = en;
        if (ru) newRu[label] = ru;
      });
      if (Object.keys(newEn).length) setEditDetailValuesEn((prev) => ({ ...prev, ...newEn }));
      if (Object.keys(newRu).length) setEditDetailValuesRu((prev) => ({ ...prev, ...newRu }));
    } catch {
      alert('Traducerea automată a eșuat. Verifică că serverul rulează (npm run dev) și încearcă din nou.');
    } finally {
      setTranslating(false);
    }
  };

  const onSave = async () => {
    const idToUse = item?.id ?? id;
    if (!idToUse || !item) return;
    setSaving(true);
    try {
      const token = getAdminToken() || '';
      const fields = getAllDetailFields();
      const detailsToSave = detailsFromMapMultilingual(fields, editDetailValues, editDetailValuesEn, editDetailValuesRu);
      const payload: Parameters<typeof galleryService.updateGalleryItem>[1] = {
        description,
        aboutDescription: typeof aboutDescription === 'string' ? aboutDescription : '',
        aboutDescription_ro: typeof aboutDescription_ro === 'string' ? aboutDescription_ro : '',
        aboutDescription_en: typeof aboutDescription_en === 'string' ? aboutDescription_en : '',
        aboutDescription_ru: typeof aboutDescription_ru === 'string' ? aboutDescription_ru : '',
        category,
        isPrimary,
        details: detailsToSave,
      };
      if (extraFiles.length > 0) {
        payload.newExtraImages = await Promise.all(
          extraFiles.map(async (f) => ({ filename: f.name, data: await toBase64(f) }))
        );
      }
      if (urlsToRemove.length > 0) payload.removeImageUrls = urlsToRemove;
      if (setMainImageUrl) payload.setMainImageUrl = setMainImageUrl;
      const allKnownUrls = collectImageEntries(item).map((x) => x.url);
      const keptKnownUrls = allKnownUrls.filter((url) => !urlsToRemove.includes(url));
      const normalizedOrder = imageOrderUrls.filter((url) => keptKnownUrls.includes(url));
      payload.imageOrderUrls = normalizedOrder.length > 0 ? normalizedOrder : keptKnownUrls;
      payload.reviews = reviews.map((r) => ({ id: r.id, text: r.text, author: r.author, date: r.date, visible: r.visible, source: r.source }));
      await galleryService.updateGalleryItem(String(idToUse), payload, token);
      navigate('/galerie/' + idToUse);
    } catch (e: any) {
      const msg = e?.message || 'Eroare la actualizare.';
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        alert('Sesiune expirată. Te rugăm să te autentifici din nou la admin și să încerci din nou.');
      } else {
        alert(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-neutral-600 mb-4">Elementul nu a fost găsit.</p>
        <Link to="/admin/gallery" className="font-medium" style={{ color: ACCENT }}>← Înapoi la galerie</Link>
      </div>
    );
  }

  const base = getUploadsBase();
  type ImageEntry = { url: string; isMain: boolean };
  const allExistingImages: ImageEntry[] = [];
  if (item.url && !urlsToRemove.includes(item.url)) {
    allExistingImages.push({ url: item.url, isMain: !setMainImageUrl || setMainImageUrl === item.url });
  }
  const seen = new Set<string>(item.url ? [item.url] : []);
  if (Array.isArray(item.details)) {
    for (const row of item.details) {
      if (!Array.isArray(row.images)) continue;
      for (const img of row.images) {
        if (!img?.url || urlsToRemove.includes(img.url) || seen.has(img.url)) continue;
        seen.add(img.url);
        allExistingImages.push({ url: img.url, isMain: setMainImageUrl === img.url });
      }
    }
  }
  const imageByUrl = new Map(allExistingImages.map((img) => [img.url, img]));
  const orderedExistingImages: ImageEntry[] = [];
  imageOrderUrls.forEach((url) => {
    const found = imageByUrl.get(url);
    if (found) orderedExistingImages.push(found);
  });
  allExistingImages.forEach((img) => {
    if (!orderedExistingImages.some((it) => it.url === img.url)) orderedExistingImages.push(img);
  });
  const zoomImages = orderedExistingImages.map(({ url }) => (url.startsWith('http') ? url : `${base}${url.startsWith('/') ? url : '/' + url}`));

  const handleMoveImage = (url: string, direction: -1 | 1) => {
    setImageOrderUrls((prev) => {
      const idx = prev.indexOf(url);
      if (idx === -1) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const clone = [...prev];
      const tmp = clone[idx];
      clone[idx] = clone[nextIdx];
      clone[nextIdx] = tmp;
      return clone;
    });
  };

  const handleDeleteImage = (url: string) => {
    if (!window.confirm('Sigur vrei să ștergi această imagine?')) return;
    setUrlsToRemove((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setImageOrderUrls((prev) => prev.filter((x) => x !== url));
    if (setMainImageUrl === url) setSetMainImageUrl(null);
  };

  const handleSaveWithTranslate = async () => {
    await handleAutoTranslateAll();
    await onSave();
  };

  return (
    <div className="max-w-6xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Editează element</h1>
        <Link to="/admin/gallery" className="text-sm font-medium" style={{ color: ACCENT }}>← Înapoi la listă</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Titlu</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" placeholder="Titlul elementului" />
          </div>
          {/* Secțiune traduceri: un singur buton „Traduce toate” */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">Traduceri (RO → EN, RU)</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Traducere într-un singur request (mai rapid), după contextul frazei. Dacă EN sau RU lipsesc, se completează la deschidere. Poți apăsa <strong>Traduce toate</strong> pentru a regenera.</p>
              </div>
              <button type="button" onClick={handleAutoTranslateAll} disabled={translating} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-neutral-800 border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" style={{ borderColor: translating ? 'transparent' : undefined }}>
                {translating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
                {translating ? 'Se traduce...' : 'Traduce toate'}
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Despre proiect</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Română</label>
                  <textarea value={aboutDescription_ro} onChange={(e) => setAboutDescriptionRo(e.target.value)} rows={3} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-y bg-white" placeholder="Descriere în română" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">English</label>
                  <textarea value={aboutDescription_en} onChange={(e) => setAboutDescriptionEn(e.target.value)} rows={3} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-y bg-white" placeholder="Description in English" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Русский</label>
                  <textarea value={aboutDescription_ru} onChange={(e) => setAboutDescriptionRu(e.target.value)} rows={3} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-y bg-white" placeholder="Описание на русском" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Dacă la o limbă lași gol, pe site se afișează textul în română.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Categorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg" disabled={categoriesLoading}>
              {categoryOptions.map((c) => <option key={c.value || 'empty'} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded border-neutral-300" />
            <span className="text-sm text-neutral-700 flex items-center gap-1"><Star className="w-4 h-4" /> Prioritar în categorie (maxim 6)</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Toate pozele</label>
            <p className="text-xs text-neutral-500 mb-3">Click pe imagine pentru preview mare. Poți schimba ordinea cu săgețile, seta principală sau șterge. Salvează pentru a aplica.</p>
            <div className="flex flex-wrap gap-4 mb-4">
              {orderedExistingImages.map(({ url, isMain }, index) => {
                const fullUrl = url.startsWith('http') ? url : `${base}${url.startsWith('/') ? url : '/' + url}`;
                const canMoveLeft = index > 0;
                const canMoveRight = index < orderedExistingImages.length - 1;
                return (
                  <div key={url} className="flex flex-col rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50 shadow-sm">
                    <button type="button" onClick={() => setZoomIndex(index)} className="w-36 h-36 sm:w-40 sm:h-40 block focus:outline-none focus:ring-2 focus:ring-neutral-400" aria-label="Vezi imaginea mărită">
                      <img src={fullUrl} alt="" className="w-full h-full object-cover block" />
                    </button>
                    <div className="flex flex-col gap-2 p-2.5 bg-neutral-100 border-t border-neutral-200">
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => handleMoveImage(url, -1)} disabled={!canMoveLeft} className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white disabled:opacity-40 inline-flex items-center gap-1" title="Mută la stânga">
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Sus
                        </button>
                        <span className="text-[11px] text-neutral-500">#{index + 1}</span>
                        <button type="button" onClick={() => handleMoveImage(url, 1)} disabled={!canMoveRight} className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white disabled:opacity-40 inline-flex items-center gap-1" title="Mută la dreapta">
                          Jos
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isMain ? (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-2 rounded-lg text-center">Principală</span>
                      ) : (
                        <button type="button" onClick={() => setSetMainImageUrl(url)} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg w-full">Principală</button>
                      )}
                      <button type="button" onClick={() => handleDeleteImage(url)} className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg w-full flex items-center justify-center gap-1.5">
                        <Trash2 className="w-4 h-4" /> Șterge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 text-sm font-medium cursor-pointer hover:bg-neutral-50 bg-white">
              <ImagePlus className="w-5 h-5" />
              Adaugă poze
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const selected = e.target.files ? Array.from(e.target.files) : [];
                  const valid: File[] = [];
                  const rejected: string[] = [];
                  selected.forEach((f) => {
                    if (f.size > MAX_FILE_BYTES) rejected.push(f.name);
                    else valid.push(f);
                  });
                  if (rejected.length > 0) {
                    alert(`Aceste fișiere depășesc 15MB și nu au fost adăugate:\n- ${rejected.join('\n- ')}`);
                  }
                  if (valid.length > 0) {
                    setExtraFiles((prev) => {
                      const keyOf = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;
                      const existing = new Set(prev.map(keyOf));
                      const next = [...prev];
                      let skippedDuplicates = 0;
                      valid.forEach((f) => {
                        const key = keyOf(f);
                        if (existing.has(key)) {
                          skippedDuplicates += 1;
                          return;
                        }
                        existing.add(key);
                        next.push(f);
                      });
                      if (skippedDuplicates > 0) {
                        alert(`${skippedDuplicates} imagine(i) duplicate au fost ignorate.`);
                      }
                      return next;
                    });
                  }
                  e.currentTarget.value = '';
                }}
              />
            </label>
            {extraFiles.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {extraFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 px-2 py-1 bg-neutral-100 rounded text-xs">
                    <span className="truncate max-w-[120px]">{f.name}</span>
                    <button type="button" onClick={() => setExtraFiles((prev) => prev.filter((_, idx) => idx !== i))} className="p-0.5 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Detalii (Producător, Tip, Material etc.)</p>
          <p className="text-xs text-neutral-500 -mt-1">Completează în română; folosește butonul <strong>Traduce toate</strong> de mai sus pentru EN și RU.</p>
          <div>
            <table className="w-full border-collapse text-sm table-fixed">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 pr-3 font-semibold text-neutral-600 w-[140px]">Câmp</th>
                  <th className="text-left py-2 px-2 font-medium text-neutral-600">Română</th>
                  <th className="text-left py-2 px-2 font-medium text-neutral-600">English</th>
                  <th className="text-left py-2 px-2 font-medium text-neutral-600">Русский</th>
                </tr>
              </thead>
              <tbody>
                {getAllDetailFields().map((label) => (
                  <tr key={label} className="border-b border-neutral-100 hover:bg-white/50">
                    <td className="py-1.5 pr-3 font-medium text-neutral-700 align-top pt-2.5">{label}</td>
                    <td className="p-2 align-top">
                      <input type="text" value={editDetailValues[label] ?? ''} onChange={(e) => setEditDetailValues((prev) => ({ ...prev, [label]: e.target.value }))} className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white" placeholder="—" />
                    </td>
                    <td className="p-2 align-top">
                      <input type="text" value={editDetailValuesEn[label] ?? ''} onChange={(e) => setEditDetailValuesEn((prev) => ({ ...prev, [label]: e.target.value }))} className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white" placeholder="—" />
                    </td>
                    <td className="p-2 align-top">
                      <input type="text" value={editDetailValuesRu[label] ?? ''} onChange={(e) => setEditDetailValuesRu((prev) => ({ ...prev, [label]: e.target.value }))} className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-sm bg-white" placeholder="—" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Recenzii
          </p>
          <p className="text-sm text-neutral-600 mt-1">
            Recenziile se creează pe site (de vizitatori, la detaliile produsului). Le gestionezi (afișezi/ascunzi, ștergi) din{' '}
            <Link to="/admin/reviews" className="font-medium underline hover:no-underline" style={{ color: ACCENT }}>
              Admin → Recenzii
            </Link>.
          </p>
          {reviews.length > 0 && (
            <p className="text-xs text-neutral-500 mt-2">
              Acest element are {reviews.length} recenzie{reviews.length !== 1 ? 'i' : ''}. Pentru a le modifica, folosește pagina Recenzii și filtrează după produs.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-neutral-200">
        <button type="button" onClick={handleSaveWithTranslate} disabled={saving || translating} className="px-6 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 inline-flex items-center gap-2" style={{ backgroundColor: ACCENT }}>
          {(saving || translating) ? (translating ? <Loader2 className="w-4 h-4 animate-spin" /> : null) : null}
          {(saving || translating) ? (saving ? 'Se salvează...' : 'Se traduce...') : 'Traduce și salvează'}
        </button>
        <button type="button" onClick={onSave} disabled={saving || translating} className="px-6 py-2.5 border border-neutral-200 rounded-lg font-medium disabled:opacity-50">Doar salvează</button>
        <Link to="/admin/gallery" className="px-6 py-2.5 border border-neutral-200 rounded-lg font-medium inline-block">Anulare</Link>
      </div>
      <p className="text-xs text-neutral-500 mt-2">„Traduce și salvează” traduce automat toate câmpurile RO → EN/RU, apoi salvează.</p>

      {zoomIndex != null && zoomImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomIndex(null)}>
          <button type="button" onClick={() => setZoomIndex(null)} className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10" aria-label="Închide preview">
            <X className="w-6 h-6" />
          </button>
          {zoomImages.length > 1 && zoomIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomIndex((prev) => (prev == null ? prev : Math.max(prev - 1, 0))); }}
              className="absolute left-3 sm:left-6 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Imagine anterioară"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          <img
            src={zoomImages[zoomIndex]}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {zoomImages.length > 1 && zoomIndex < zoomImages.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomIndex((prev) => (prev == null ? prev : Math.min(prev + 1, zoomImages.length - 1))); }}
              className="absolute right-3 sm:right-6 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Imagine următoare"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGalleryEditPage;
