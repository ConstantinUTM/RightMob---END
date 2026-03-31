import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import galleryService from '../services/galleryService';
import categoriesService, { type Category } from '../services/categoriesService';
import { getAdminToken, useAuth } from '../contexts/AuthContext';
import { getUploadsBase } from '../lib/api';
import { Loader2, Eye, Pencil, Trash2, ImagePlus, EyeOff, Eye as EyeOn, Star } from 'lucide-react';

const ACCENT = '#374151';

const AdminGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin, signIn } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    load();
    categoriesService.getCategories().then((list) => {
      setCategoryList(Array.isArray(list) ? list : []);
    }).catch(() => {
      setCategoryList([]);
    });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await galleryService.getGallery();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      await signIn(adminEmail, adminPassword);
      await load();
      alert('Autentificare reușită.');
    } catch (e: any) {
      alert(e?.message || 'Eroare la autentificare.');
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Ștergi acest element?')) return;
    try {
      const token = getAdminToken() || '';
      await galleryService.deleteImage(id, token);
      await load();
    } catch (error) {
      console.error(error);
      alert('Eroare la ștergere.');
    }
  };

  const onToggleVisible = async (item: any) => {
    const nextVisible = item.visible !== false ? false : true;
    try {
      const token = getAdminToken() || '';
      await galleryService.updateGalleryItem(String(item.id), { visible: nextVisible }, token);
      await load();
    } catch (error) {
      console.error(error);
      alert('Eroare la actualizare.');
    }
  };

  const onTogglePrimary = async (item: any) => {
    const nextPrimary = !item.isPrimary;
    try {
      const token = getAdminToken() || '';
      await galleryService.updateGalleryItem(String(item.id), { isPrimary: nextPrimary }, token);
      await load();
    } catch (error) {
      console.error(error);
      alert('Eroare la actualizarea priorității în categorie.');
    }
  };

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    categoryList.forEach((c) => map.set(String(c.id), c.label));
    return map;
  }, [categoryList]);

  const primaryCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      if (!item?.isPrimary) return;
      const categoryId = String(item.category || '').trim();
      if (!categoryId) return;
      map.set(categoryId, (map.get(categoryId) || 0) + 1);
    });
    return map;
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const priorityDelta = Number(!!b.isPrimary) - Number(!!a.isPrimary);
      if (priorityDelta !== 0) return priorityDelta;
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [items]);

  const categoryButtons = useMemo(() => {
    const idsFromItems = Array.from(new Set(items.map((it) => String(it.category || '').trim()).filter(Boolean)));
    const knownOrder = categoryList.map((c) => String(c.id));
    const unknownIds = idsFromItems
      .filter((id) => !knownOrder.includes(id))
      .sort((a, b) => a.localeCompare(b, 'ro'));
    const ordered = [...knownOrder.filter((id) => idsFromItems.includes(id)), ...unknownIds];
    return ordered.map((id) => ({ id, label: categoryLabelById.get(id) || id }));
  }, [items, categoryList, categoryLabelById]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return sortedItems.filter((item) => {
      const categoryId = String(item.category || '').trim();
      if (activeCategory && categoryId !== activeCategory) return false;

      if (!normalizedSearch) return true;

      const categoryLabel = (categoryLabelById.get(categoryId) || categoryId).toLowerCase();
      const haystack = [
        String(item.description || ''),
        String(item.filename || ''),
        String(item.id || ''),
        categoryLabel,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [sortedItems, activeCategory, searchQuery, categoryLabelById]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Galerie – Administrare</h1>
        <Link
          to="/admin/gallery/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: ACCENT }}
        >
          <ImagePlus className="w-5 h-5" />
          Adaugă element
        </Link>
      </div>

      {!isAdmin && (
        <div className="mb-8 p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="font-semibold text-neutral-900 mb-3">Autentificare Admin</h2>
          <input
            placeholder="Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full p-3 border border-neutral-200 rounded-xl mb-2"
          />
          <input
            placeholder="Parolă"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full p-3 border border-neutral-200 rounded-xl mb-3"
          />
          <button
            onClick={handleAdminSignIn}
            className="px-4 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Autentificare
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Elemente în galerie</h2>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              activeCategory === ''
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            Toate
          </button>
          {categoryButtons.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
                activeCategory === cat.id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-xl px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            placeholder="Caută după nume, categorie sau ID..."
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isHidden = item.visible === false;
            const categoryId = String(item.category || '').trim();
            const categoryLabel = categoryLabelById.get(categoryId) || categoryId || 'Fără categorie';
            const primaryInCategory = primaryCountByCategory.get(categoryId) || 0;
            const reachedCategoryPrimaryLimit = !item.isPrimary && primaryInCategory >= 6;
            return (
              <div
                key={item.id}
                className={`relative rounded-xl overflow-hidden border-2 shadow-sm ${
                  isHidden
                    ? 'bg-neutral-100 border-neutral-300'
                    : item.isPrimary
                      ? 'bg-white border-yellow-400'
                      : 'bg-white border-neutral-200'
                }`}
              >
                {item.isPrimary && (
                  <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-yellow-500 text-neutral-900 px-2.5 py-1 text-[11px] font-semibold">
                    <Star className="w-3.5 h-3.5" />
                    Prioritar
                  </div>
                )}

                <img
                  src={item.url ? `${getUploadsBase()}${item.url}` : ''}
                  alt={item.description || item.filename}
                  className={`w-full h-40 object-cover block ${isHidden ? 'grayscale opacity-75' : ''}`}
                />
                <div className="p-3 space-y-2">
                  <p className="text-sm text-neutral-700 line-clamp-2">{item.description || '—'}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-500 truncate">{categoryLabel}</p>
                    <p className="text-[11px] text-neutral-500 whitespace-nowrap">Prioritare: {primaryInCategory}/6</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleVisible(item)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                      title={item.visible === false ? 'Afișează în galerie' : 'Ascunde din galerie'}
                    >
                      {item.visible === false ? <EyeOn className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {item.visible === false ? 'Afișează' : 'Ascunde'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onTogglePrimary(item)}
                      disabled={reachedCategoryPrimaryLimit}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        item.isPrimary
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                      title={
                        reachedCategoryPrimaryLimit
                          ? 'Categoria are deja 6 elemente prioritare'
                          : item.isPrimary
                            ? 'Elimină prioritatea din categorie'
                            : 'Setează prioritar în categorie'
                      }
                    >
                      <Star className="w-3.5 h-3.5" />
                      {item.isPrimary ? 'Prioritar' : 'Setează prioritar'}
                    </button>

                    <a
                      href={`${window.location.origin}/galerie/${encodeURIComponent(String(item.id))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Vezi
                    </a>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/gallery/edit/${item.id}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editează
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Șterge
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <p className="text-sm text-neutral-500 mt-4">Nu există rezultate pentru filtrarea curentă.</p>
        )}
      </div>
    </div>
  );
};

export default AdminGalleryPage;
