import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import galleryService from '../services/galleryService';
import categoriesService, { type Category } from '../services/categoriesService';
import { getAdminToken, useAuth } from '../contexts/AuthContext';
import { getAllDetailFields, detailsFromMap } from '../lib/categoryDetailFields';
import { translateBatch } from '../lib/translationService';
import { Upload, ImagePlus, Loader2, Languages } from 'lucide-react';

const ACCENT = '#374151';

const safeTranslated = (source: string, translated?: string) => {
  const src = (source || '').trim();
  const tr = (translated || '').trim();
  if (!tr) return src;
  if (src.length >= 3 && tr.length <= 1) return src;
  if (src.length >= 6 && tr.length <= Math.max(1, Math.floor(src.length * 0.2))) return src;
  return tr;
};

const AdminGalleryAddPage: React.FC = () => {
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [aboutDescriptionRo, setAboutDescriptionRo] = useState('');
  const [project, setProject] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const { isAdmin, signIn } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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

  const toBase64 = (f: File) => new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(String(reader.result));
    reader.onerror = rej;
    reader.readAsDataURL(f);
  });

  const categoryOptions = [
    { value: '', label: '— Selectează categorie —' },
    ...categoryList.map((c) => ({ value: c.id, label: c.label })),
  ];
  const mainImageMissing = !mainFile;
  const categoryMissing = !category;

  const onUpload = async () => {
    if (!isAdmin) return alert('Autentifică-te ca admin.');
    if (!mainFile) return alert('Alege imaginea principală.');
    if (!category) return alert('Selectează categoria.');
    setUploading(true);
    try {
      const mainData = await toBase64(mainFile);
      const fields = getAllDetailFields();
      const detailRows = detailsFromMap(fields, detailValues);
      const aboutRo = (aboutDescriptionRo || '').trim();

      let aboutEn = '';
      let aboutRu = '';
      const detailsWithTranslations: Array<{ title: string; text: string; text_en?: string; text_ru?: string; images: Array<{ filename: string; data: string }> }> = [];

      if (aboutRo || detailRows.length > 0) {
        const items: { id: string; text: string; to: 'en' | 'ru' }[] = [];
        if (aboutRo) {
          items.push({ id: 'about_en', text: aboutRo, to: 'en' }, { id: 'about_ru', text: aboutRo, to: 'ru' });
        }
        detailRows.forEach((d, i) => {
          const textRo = (d.text || '').trim();
          if (textRo) {
            items.push({ id: `d${i}_en`, text: textRo, to: 'en' }, { id: `d${i}_ru`, text: textRo, to: 'ru' });
          }
        });
        let results: Record<string, string> = {};
        if (items.length > 0) {
          results = await translateBatch(items);
          aboutEn = safeTranslated(aboutRo, results['about_en']);
          aboutRu = safeTranslated(aboutRo, results['about_ru']);
        }
        detailRows.forEach((d, i) => {
          const textRo = (d.text || '').trim();
          detailsWithTranslations.push({
            title: d.title,
            text: textRo,
            text_en: textRo ? safeTranslated(textRo, results[`d${i}_en`]) : undefined,
            text_ru: textRo ? safeTranslated(textRo, results[`d${i}_ru`]) : undefined,
            images: [],
          });
        });
      }
      if (extraFiles.length > 0) {
        const images = await Promise.all(extraFiles.map((f) => toBase64(f).then((data) => ({ filename: f.name, data }))));
        detailsWithTranslations.push({ title: '', text: '', images });
      }

      const token = getAdminToken() || '';
      await galleryService.uploadImage({
        filename: mainFile.name,
        data: mainData,
        category,
        description,
        isPrimary,
        details: detailsWithTranslations,
        project: project.trim() || undefined,
        aboutDescription_ro: aboutRo || undefined,
        aboutDescription_en: aboutEn || undefined,
        aboutDescription_ru: aboutRu || undefined,
        token,
      });
      setMainFile(null);
      setExtraFiles([]);
      setCategory('');
      setDescription('');
      setAboutDescriptionRo('');
      setProject('');
      setIsPrimary(false);
      setDetailValues({});
      alert('Salvat cu succes. Traducerile EN/RU au fost generate automat.');
      window.location.href = '/admin/gallery';
    } catch (error: any) {
      alert(error?.message || 'Eroare la salvare.');
    } finally {
      setUploading(false);
    }
  };

  const onExtraFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setExtraFiles((prev) => {
      const keyOf = (f: File) => `${f.name}__${f.size}__${f.lastModified}`;
      const existing = new Set(prev.map(keyOf));
      const next = [...prev];
      let skipped = 0;
      files.forEach((f) => {
        const key = keyOf(f);
        if (existing.has(key)) {
          skipped += 1;
          return;
        }
        existing.add(key);
        next.push(f);
      });
      if (skipped > 0) {
        alert(`${skipped} imagine(i) duplicate au fost ignorate.`);
      }
      return next;
    });
    e.target.value = '';
  };
  const removeExtraFile = (i: number) => setExtraFiles((prev) => prev.filter((_, idx) => idx !== i));

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Adaugă element</h1>
        <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <input placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full p-3 border rounded-lg mb-2" />
          <input placeholder="Parolă" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
          <button onClick={async () => { await signIn(adminEmail, adminPassword); }} className="w-full py-2 rounded-lg text-white font-medium" style={{ backgroundColor: ACCENT }}>Autentificare</button>
        </div>
        <Link to="/admin/gallery" className="mt-4 inline-block text-sm" style={{ color: ACCENT }}>← Înapoi la galerie</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Adaugă element în galerie</h1>
        <Link to="/admin/gallery" className="text-sm font-medium" style={{ color: ACCENT }}>← Înapoi la listă</Link>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="font-semibold text-neutral-900 mb-4">Categorii prestabilite</h2>
          {categoriesLoading ? <p className="text-sm text-neutral-500">Se încarcă…</p> : (
            <div className="flex flex-wrap gap-2">
              {categoryList.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${category === c.id ? 'text-white border-neutral-600' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}
                  style={category === c.id ? { backgroundColor: ACCENT } : undefined}>{c.label}</button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2"><ImagePlus className="w-5 h-5" /> Imagine și informații</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${mainImageMissing ? 'text-red-600' : 'text-neutral-700'}`}>Imagine principală *</label>
              <div className={`rounded-lg border px-3 py-2 ${mainImageMissing ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'}`}>
                <input type="file" accept="image/*" onChange={(e) => setMainFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
              </div>
              {mainFile && <p className="mt-1 text-sm text-neutral-500">{mainFile.name}</p>}
              {mainImageMissing && <p className="mt-1 text-xs text-red-600">Câmp obligatoriu.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Titlu produs</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-neutral-200 rounded-lg" rows={2} placeholder="Ex: Dulap dormitor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Descriere produs (română)</label>
              <textarea value={aboutDescriptionRo} onChange={(e) => setAboutDescriptionRo(e.target.value)} className="w-full p-3 border border-neutral-200 rounded-lg" rows={3} placeholder="Descriere detaliată a produsului. EN/RU se traduc automat la salvare." />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Lucrare / proiect (opțional)</label>
              <input type="text" value={project} onChange={(e) => setProject(e.target.value)} className="w-full p-3 border border-neutral-200 rounded-lg" placeholder="Ex: Rezidență 2024" />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${categoryMissing ? 'text-red-600' : 'text-neutral-700'}`}>Categorie *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full p-3 border rounded-lg ${categoryMissing ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'}`} disabled={categoriesLoading}>
                {categoryOptions.map((c) => <option key={c.value || 'empty'} value={c.value}>{c.label}</option>)}
              </select>
              {categoryMissing && <p className="mt-1 text-xs text-red-600">Câmp obligatoriu.</p>}
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded border-neutral-300" />
              <span className="text-sm text-neutral-700">Evidențiat în categorie (maxim 6/categorie)</span>
            </label>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2"><Upload className="w-5 h-5" /> Mai multe poze (opțional)</h2>
          <input type="file" accept="image/*" multiple onChange={onExtraFilesChange} className="block w-full text-sm" />
          {extraFiles.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {extraFiles.map((f, i) => (
                <li key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg text-sm">
                  <span className="truncate max-w-[180px]">{f.name}</span>
                  <button type="button" onClick={() => removeExtraFile(i)} className="p-1 text-red-600 rounded">Șterge</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2"><Languages className="w-5 h-5" /> Detalii (traducere automată EN/RU la salvare)</h2>
          <p className="text-sm text-neutral-500 mb-4">Completează doar în română. La salvare, EN și RU se generează automat; le poți corecta ulterior la editare.</p>
          <div className="space-y-3">
            {getAllDetailFields().map((label) => (
              <div key={label}>
                <label className="block text-sm font-medium text-neutral-600 mb-1">{label}</label>
                <input type="text" value={detailValues[label] ?? ''} onChange={(e) => setDetailValues((prev) => ({ ...prev, [label]: e.target.value }))} placeholder={`${label}...`} className="w-full p-2 border border-neutral-200 rounded-lg text-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onUpload} disabled={uploading || !mainFile || !category} className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: ACCENT }}>
            {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Se traduc și salvează...</> : <><Upload className="w-5 h-5" /> Traduce automat și salvează</>}
          </button>
          <Link to="/admin/gallery" className="px-6 py-3 border border-neutral-200 rounded-lg font-medium">Anulare</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminGalleryAddPage;
