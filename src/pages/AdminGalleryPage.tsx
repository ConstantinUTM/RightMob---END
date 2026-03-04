import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import galleryService from '../services/galleryService';
import { getAdminToken, useAuth } from '../contexts/AuthContext';
import { getUploadsBase } from '../lib/api';
import { Loader2, Eye, Pencil, Trash2, ImagePlus, EyeOff, Eye as EyeOn } from 'lucide-react';

const ACCENT = '#374151';

const AdminGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, signIn } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    load();
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const isHidden = item.visible === false;
            return (
            <div
              key={item.id}
              className={`relative rounded-xl overflow-hidden border-2 shadow-sm ${
                isHidden
                  ? 'bg-neutral-100 border-amber-400/80 opacity-90'
                  : 'bg-white border-neutral-200'
              }`}
            >
              {isHidden && (
                <div className="absolute top-0 left-0 right-0 py-1.5 bg-amber-500 text-white text-center text-xs font-semibold uppercase tracking-wider z-10">
                  Ascuns din galerie
                </div>
              )}
              <img
                src={item.url ? `${getUploadsBase()}${item.url}` : ''}
                alt={item.description || item.filename}
                className={`w-full h-40 object-cover block ${isHidden ? 'opacity-80' : ''}`}
              />
              <div className="p-3 space-y-2">
                <p className="text-sm text-neutral-700 line-clamp-2">{item.description || '—'}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleVisible(item)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      item.visible === false
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                    title={item.visible === false ? 'Afișează în galerie' : 'Ascunde din galerie'}
                  >
                    {item.visible === false ? <EyeOn className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {item.visible === false ? 'Afișează' : 'Ascunde'}
                  </button>
                  <a
                    href={`${window.location.origin}/galerie/${encodeURIComponent(String(item.id))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50"
                    style={{ color: ACCENT }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Vezi
                  </a>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/gallery/edit/${item.id}`)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-xs font-medium"
                    style={{ color: ACCENT }}
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
      </div>
    </div>
  );
};

export default AdminGalleryPage;
