import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, Eye, EyeOff, Filter } from 'lucide-react';
import { getApiBase } from '../lib/api';
import { useAuth, getAdminToken } from '../contexts/AuthContext';

interface ReviewItem {
  productId: string;
  productName: string;
  productImage: string;
  review: { id?: string; text: string; author?: string; date?: string; visible: boolean; source?: string };
}

const AdminReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [list, setList] = useState<ReviewItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoadingList(true);
    setError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/reviews`, {
        headers: { 'x-admin-token': getAdminToken() || '' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Eroare la încărcare');
      }
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setLoadingList(false);
    }
  };

  const toggleVisible = async (productId: string, reviewId: string, currentVisible: boolean) => {
    try {
      const base = getApiBase();
      const res = await fetch(
        `${base}/api/gallery/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() || '' },
          body: JSON.stringify({ visible: !currentVisible }),
        }
      );
      if (!res.ok) throw new Error('Eroare la actualizare');
      setList((prev) =>
        prev.map((x) =>
          x.productId === productId && x.review.id === reviewId
            ? { ...x, review: { ...x.review, visible: !currentVisible } }
            : x
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare');
    }
  };

  const deleteReview = async (productId: string, reviewId: string) => {
    if (!confirm('Sigur vrei să ștergi această recenzie?')) return;
    try {
      const base = getApiBase();
      const res = await fetch(
        `${base}/api/gallery/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
        { method: 'DELETE', headers: { 'x-admin-token': getAdminToken() || '' } }
      );
      if (!res.ok) throw new Error('Eroare la ștergere');
      setList((prev) => prev.filter((x) => !(x.productId === productId && x.review.id === reviewId)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare');
    }
  };

  const productNames = Array.from(new Set(list.map((x) => x.productName).filter(Boolean))).sort();
  const filtered = filterProduct
    ? list.filter((x) => x.productName === filterProduct)
    : list;

  if (loading) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-dark-950">Recenzii produse</h1>
      </div>
      <p className="text-dark-600 mb-6">
        Afișează sau ascunde recenziile pe site; șterge recenziile nedorite. Traducerea în EN/RU se face automat la adăugare.
      </p>

      {/* Filtru produs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-5 h-5 text-dark-500" />
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg bg-white text-dark-800"
        >
          <option value="">Toate produsele</option>
          {productNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {loadingList ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-dark-500 py-8">Nicio recenzie {filterProduct ? 'pentru acest produs' : ''}.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={`${item.productId}-${item.review.id}`}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary-600 mb-1 truncate" title={item.productName}>
                    {item.productName || '(fără nume)'}
                  </p>
                  <p className="text-dark-700 whitespace-pre-wrap mb-2">{item.review.text}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-dark-500">
                    {item.review.author && <span>{item.review.author}</span>}
                    {item.review.date && (
                      <time dateTime={item.review.date}>
                        {new Date(item.review.date).toLocaleString('ro-RO')}
                      </time>
                    )}
                    {item.review.source && (
                      <span className="capitalize">{item.review.source === 'owner' ? 'Proprietar' : 'Vizitator'}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVisible(item.productId, item.review.id!, item.review.visible)}
                    className={`p-2 rounded-lg border transition-colors ${
                      item.review.visible
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                    }`}
                    title={item.review.visible ? 'Ascunde pe site' : 'Afișează pe site'}
                  >
                    {item.review.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(item.productId, item.review.id!)}
                    className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Șterge recenzia"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
