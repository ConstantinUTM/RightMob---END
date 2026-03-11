import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Image as ImageIcon, Save, RefreshCw, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getAdminToken } from '../contexts/AuthContext';
import { getApiBase } from '../lib/api';
import { useSiteContent } from '../contexts/SiteContentContext';
import { getStaticTranslation } from '../contexts/LanguageContext';

type Language = 'ro' | 'en' | 'ru';

type SiteContentResponse = {
  translations?: Record<Language, Record<string, string>>;
  images?: Record<string, string>;
};

const TEXT_KEYS: Array<{ page: string; key: string; label: string; multiline?: boolean }> = [
  { page: 'Home', key: 'hero.subtitle', label: 'Subtitlu hero (text principal sub logo)' },
  { page: 'Home', key: 'hero.cta', label: 'Text buton „Explorează colecția"' },
  { page: 'Home', key: 'videoSection.title', label: 'Titlu secțiune video' },
  { page: 'Home', key: 'videoSection.description', label: 'Descriere secțiune video', multiline: true },
  { page: 'Home', key: 'collections.title', label: 'Titlu secțiune colecții' },
  { page: 'Home', key: 'collections.subtitle', label: 'Subtitlu secțiune colecții' },
  { page: 'Home', key: 'testimonials.title', label: 'Titlu secțiune recenzii clienți' },
  { page: 'Home', key: 'testimonials.subtitle', label: 'Subtitlu recenzii clienți' },

  { page: 'Despre', key: 'about.title', label: 'Titlu pagină „Despre noi"' },
  { page: 'Despre', key: 'about.subtitle', label: 'Subtitlu / descriere scurtă', multiline: true },
  { page: 'Despre', key: 'about.whoWeAre', label: 'Etichetă „Cine suntem"' },
  { page: 'Despre', key: 'about.customFurnitureTitle', label: 'Titlu secțiune mobilier la comandă' },
  { page: 'Despre', key: 'about.ctaText', label: 'Text îndemn (deasupra butonului CTA)', multiline: true },
  { page: 'Despre', key: 'about.ctaButton', label: 'Text buton CTA' },
  { page: 'Despre', key: 'about.deliveryTitle', label: 'Titlu secțiune „Livrare & montare"' },
  { page: 'Despre', key: 'about.deliverySteps.step1.title', label: 'Livrare pas 1 - titlu' },
  { page: 'Despre', key: 'about.deliverySteps.step1.desc', label: 'Livrare pas 1 - descriere' },
  { page: 'Despre', key: 'about.deliverySteps.step2.title', label: 'Livrare pas 2 - titlu' },
  { page: 'Despre', key: 'about.deliverySteps.step2.desc', label: 'Livrare pas 2 - descriere' },
  { page: 'Despre', key: 'about.deliverySteps.step3.title', label: 'Livrare pas 3 - titlu' },
  { page: 'Despre', key: 'about.deliverySteps.step3.desc', label: 'Livrare pas 3 - descriere' },
  { page: 'Despre', key: 'about.deliverySteps.step4.title', label: 'Livrare pas 4 - titlu' },
  { page: 'Despre', key: 'about.deliverySteps.step4.desc', label: 'Livrare pas 4 - descriere' },

  { page: 'Contact', key: 'contact.title', label: 'Titlu pagină Contact' },
  { page: 'Contact', key: 'contact.subtitle', label: 'Subtitlu pagină Contact', multiline: true },
  { page: 'Contact', key: 'contact.formTitle', label: 'Titlu formular de contact' },
  { page: 'Contact', key: 'contact.formSubtitle', label: 'Descriere sub titlul formularului', multiline: true },
  { page: 'Contact', key: 'contact.send', label: 'Text buton „Trimite"' },
];

const IMAGE_KEYS: Array<{ page: string; key: string; label: string; placeholder: string; accept: string }> = [
  { page: 'Home', key: 'home.heroImage', label: 'Imagine fundal hero (pagina principală)', placeholder: '/images/IMG_9859.JPG', accept: 'image/*' },
  { page: 'Home', key: 'home.videoFile', label: 'Fișier video principal', placeholder: '/images/video/home.mp4', accept: 'video/*' },
  { page: 'Home', key: 'home.videoPoster', label: 'Imagine previzualizare video (înainte de play)', placeholder: '/images/IMG_9859.JPG', accept: 'image/*' },
  { page: 'Despre', key: 'about.heroImage', label: 'Imagine fundal hero (pagina Despre noi)', placeholder: '/images/about/about-2.jpg', accept: 'image/*' },
  { page: 'Despre', key: 'about.mainImage', label: 'Imagine secțiune principală (Despre noi)', placeholder: '/images/IMG_9872.JPG', accept: 'image/*' },
  { page: 'Contact', key: 'contact.heroImage', label: 'Imagine fundal hero (pagina Contact)', placeholder: '', accept: 'image/*' },
  { page: 'Contact', key: 'contact.sideImage', label: 'Imagine laterală lângă formular', placeholder: '', accept: 'image/*' },
];

const AdminContentPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { refresh } = useSiteContent();

  const [activeTab, setActiveTab] = useState<'text' | 'images'>('text');
  const [lang, setLang] = useState<Language>('ro');
  const [texts, setTexts] = useState<Record<Language, Record<string, string>>>({ ro: {}, en: {}, ru: {} });
  const [images, setImages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [loading, isAdmin, navigate]);

  const load = async () => {
    setLoadingData(true);
    setMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/site-content`);
      const data: SiteContentResponse = res.ok ? await res.json() : {};
      const overrides = {
        ro: { ...(data.translations?.ro || {}) },
        en: { ...(data.translations?.en || {}) },
        ru: { ...(data.translations?.ru || {}) },
      };
      // Pre-fill cu valorile din cod acolo unde nu există override salvat
      const enriched: Record<Language, Record<string, string>> = { ro: {}, en: {}, ru: {} };
      for (const l of ['ro', 'en', 'ru'] as const) {
        for (const { key } of TEXT_KEYS) {
          enriched[l][key] = overrides[l][key] !== undefined
            ? overrides[l][key]
            : getStaticTranslation(l, key);
        }
      }
      setTexts(enriched);
      setImages({ ...(data.images || {}) });
    } catch {
      setMessage('Nu s-a putut încărca conținutul.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { load(); }, []);

  const groupedText = useMemo(() =>
    TEXT_KEYS.reduce<Record<string, Array<{ key: string; label: string; multiline?: boolean }>>>((acc, item) => {
      if (!acc[item.page]) acc[item.page] = [];
      acc[item.page].push({ key: item.key, label: item.label, multiline: item.multiline });
      return acc;
    }, {}),
  []);

  const groupedImages = useMemo(() =>
    IMAGE_KEYS.reduce<Record<string, Array<{ key: string; label: string; placeholder: string; accept: string }>>>((acc, item) => {
      if (!acc[item.page]) acc[item.page] = [];
      acc[item.page].push({ key: item.key, label: item.label, placeholder: item.placeholder, accept: item.accept });
      return acc;
    }, {}),
  []);

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = getAdminToken() || '';
      if (!token) throw new Error('Sesiunea de admin a expirat. Reautentifică-te și încearcă din nou.');
      const res = await fetch(`${getApiBase()}/api/admin/site-content/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ filename: file.name, data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Sesiunea de admin a expirat. Reautentifică-te și încearcă din nou.');
        throw new Error(err.error || 'Upload eșuat');
      }
      const result = await res.json();
      setImages(prev => ({ ...prev, [key]: result.url }));
    } catch (err: any) {
      setMessage(err?.message || 'Eroare la încărcarea fișierului.');
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = getAdminToken() || '';
      if (!token) throw new Error('Sesiunea de admin a expirat. Reautentifică-te și încearcă din nou.');
      // Salvăm doar valorile care diferă față de textul implicit ('' = șterge override)
      const saveBatch: Record<string, string> = {};
      for (const { key } of TEXT_KEYS) {
        const val = texts[lang]?.[key] ?? '';
        const staticVal = getStaticTranslation(lang, key);
        if (val !== staticVal) saveBatch[key] = val;
      }
      const res = await fetch(`${getApiBase()}/api/admin/site-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ translations: { [lang]: saveBatch }, images }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('Sesiunea de admin a expirat. Reautentifică-te și încearcă din nou.');
      if (!res.ok) throw new Error(responseData.error || 'Eroare la salvare');
      await refresh();
      setMessage('Conținut salvat cu succes.');
    } catch (e: any) {
      setMessage(e?.message || 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">Editor conținut site</h1>
          <p className="text-sm text-gray-500">Editează textele și imaginile afișate pe site, per limbă. Golește un câmp pentru a reveni la textul implicit.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reîncarcă
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 rounded-lg inline-flex items-center gap-2 ${activeTab === 'text' ? 'bg-neutral-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
        >
          <FileText className="w-4 h-4" /> Texte
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 rounded-lg inline-flex items-center gap-2 ${activeTab === 'images' ? 'bg-neutral-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
        >
          <ImageIcon className="w-4 h-4" /> Imagini & Video
        </button>

        {activeTab === 'text' && (
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="ml-auto px-3 py-2 rounded-lg border border-gray-200"
          >
            <option value="ro">Română</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        )}
      </div>

      {loadingData ? (
        <div className="py-8 text-gray-500">Se încarcă...</div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'text' && Object.entries(groupedText).map(([page, rows]) => (
            <section key={page} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{page}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map((row) => (
                  <label key={row.key} className="block">
                    <span className="text-sm font-medium text-gray-700">{row.label}</span>
                    <span className="text-xs text-gray-400 block mb-1">{row.key}</span>
                    {row.multiline ? (
                      <textarea
                        value={texts[lang]?.[row.key] ?? ''}
                        onChange={(e) => setTexts(prev => ({
                          ...prev,
                          [lang]: { ...(prev[lang] || {}), [row.key]: e.target.value },
                        }))}
                        rows={3}
                        placeholder="Lasă gol pentru textul implicit"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      />
                    ) : (
                      <input
                        type="text"
                        value={texts[lang]?.[row.key] ?? ''}
                        onChange={(e) => setTexts(prev => ({
                          ...prev,
                          [lang]: { ...(prev[lang] || {}), [row.key]: e.target.value },
                        }))}
                        placeholder="Lasă gol pentru textul implicit"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}

          {activeTab === 'images' && Object.entries(groupedImages).map(([page, rows]) => (
            <section key={page} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{page}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rows.map((row) => {
                  const currentUrl = images[row.key] || '';
                  const isVideo = row.accept.startsWith('video') || /\.(mp4|webm|mov|ogg)$/i.test(currentUrl);
                  return (
                    <div key={row.key} className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-gray-700">{row.label}</span>
                      <span className="text-xs text-gray-400">{row.key}</span>

                      {/* Previzualizare */}
                      {currentUrl ? (
                        isVideo ? (
                          <video
                            src={currentUrl}
                            className="w-full max-w-[240px] h-32 object-cover rounded-lg border border-gray-200"
                            muted
                          />
                        ) : (
                          <img
                            src={currentUrl}
                            alt=""
                            className="w-full max-w-[240px] h-32 object-cover rounded-lg border border-gray-200"
                          />
                        )
                      ) : (
                        <div className="w-full max-w-[240px] h-32 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                          {row.placeholder ? 'implicit (din cod)' : 'fără fișier'}
                        </div>
                      )}

                      {currentUrl && (
                        <p className="text-xs text-gray-500 truncate max-w-[240px]" title={currentUrl}>{currentUrl}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <label
                          className={`cursor-pointer px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 inline-flex items-center gap-2 transition-colors ${uploading[row.key] ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <Upload className="w-4 h-4" />
                          {uploading[row.key] ? 'Se încarcă...' : (currentUrl ? 'Schimbă fișierul' : 'Încarcă fișier')}
                          <input
                            type="file"
                            accept={row.accept}
                            className="hidden"
                            onChange={(e) => handleImageUpload(row.key, e)}
                          />
                        </label>

                        {currentUrl && (
                          <button
                            type="button"
                            onClick={() => setImages(prev => ({ ...prev, [row.key]: '' }))}
                            className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Șterge (revenire la implicit)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-neutral-700 text-white hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? 'Se salvează...' : 'Salvează'}
        </button>
        {message && (
          <p className={`text-sm font-medium ${message.includes('succes') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminContentPage;
