import React, { useState, useEffect, useMemo } from 'react';
import { ImageIcon, BarChart3, ArrowRight, Eye, Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import galleryService from '../services/galleryService';
import { getAdminToken } from '../contexts/AuthContext';
import { getApiBase, getUploadsBase } from '../lib/api';

const API_URL = getApiBase();

interface AnalyticsSummary {
  totalViews: number;
  byPath: Record<string, number>;
  mostViewed: { path: string; count: number } | null;
  recent: { path: string; ts: string; country: string | null; city: string | null }[];
}

const ACCENT = '#374151';

const AdminDashboard: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await galleryService.getGallery();
        setGalleryItems(Array.isArray(list) ? list : []);
      } catch {
        setGalleryItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/summary`, {
          headers: { 'x-admin-token': getAdminToken() || '' },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch {
        setAnalytics(null);
      }
    };
    loadAnalytics();
  }, []);

  const formatPath = (p: string) => (p === '/' ? 'Acasă' : p);
  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return ts;
    }
  };

  const topGalleryByViews = useMemo(() => {
    if (!analytics?.byPath) return null;
    const entries = Object.entries(analytics.byPath)
      .filter(([path]) => path.startsWith('/galerie/') && path !== '/galerie')
      .sort((a, b) => b[1] - a[1]);
    return entries[0] || null;
  }, [analytics?.byPath]);

  const topGalleryId = topGalleryByViews ? topGalleryByViews[0].replace(/^\/galerie\//, '') : null;
  const topGalleryItem = topGalleryId
    ? galleryItems.find((x: any) => String(x.id) === String(topGalleryId))
    : null;

  const uniqueCountries = useMemo(() => {
    if (!analytics?.recent?.length) return 0;
    return new Set(analytics.recent.map((r) => r.country).filter(Boolean)).size;
  }, [analytics?.recent]);

  const uniqueCities = useMemo(() => {
    if (!analytics?.recent?.length) return 0;
    return new Set(analytics.recent.map((r) => r.city).filter(Boolean)).size;
  }, [analytics?.recent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bun venit în panoul de administrare</p>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Galerie</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg" style={{ backgroundColor: `${ACCENT}12` }}>
              <ImageIcon className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{galleryItems.length}</div>
          <div className="text-sm text-gray-600">Elemente în galerie</div>
          <p className="text-xs text-gray-500 mt-2">Adaugi, editezi sau ștergi elemente din galerie.</p>
          <Link
            to="/admin/gallery"
            className="mt-3 inline-flex items-center gap-1 font-medium text-sm"
            style={{ color: ACCENT }}
            title="Deschide pagina de administrare a galeriei"
          >
            Gestionează galeria
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Vizionări și statistici</h2>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" style={{ color: ACCENT }} />
            Vizionări site (rezumat)
          </h3>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            Vezi analize detaliate
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {analytics ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{analytics.totalViews}</div>
                <div className="text-sm text-gray-600">Total vizionări</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-lg font-bold text-gray-900 truncate">
                  {analytics.mostViewed ? formatPath(analytics.mostViewed.path) : '—'}
                </div>
                <div className="text-sm text-gray-600">
                  Cea mai vizionată pagină {analytics.mostViewed ? `(${analytics.mostViewed.count})` : ''}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                {topGalleryByViews ? (
                  <>
                    <div className="text-lg font-bold text-gray-900 truncate">
                      {topGalleryItem?.description || `Element ${topGalleryId}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cel mai vizionat din galerie ({topGalleryByViews[1]} vizionări)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-gray-500">—</div>
                    <div className="text-sm text-gray-600">Cel mai vizionat din galerie</div>
                  </>
                )}
              </div>
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-lg font-bold text-gray-900">{uniqueCities}</div>
                <div className="text-sm text-gray-600">Orașe unice detectate</div>
                <div className="text-xs text-gray-500 mt-1">{uniqueCountries} țări</div>
              </div>
            </div>

            {analytics.recent && analytics.recent.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4" />
                  Vizionări recente (ultimele 8)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Pagină</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Data</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Locație</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analytics.recent.slice(0, 8).map((r, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-gray-900">
                            {r.path.startsWith('/galerie/') ? (
                              <a
                                href={`${window.location.origin}/galerie/${r.path.replace(/^\/galerie\//, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600"
                                style={{ color: ACCENT }}
                              >
                                {formatPath(r.path)}
                              </a>
                            ) : (
                              formatPath(r.path)
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{formatDate(r.ts)}</td>
                          <td className="px-4 py-2 text-gray-600 inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {[r.city, r.country].filter(Boolean).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500">Nu există date de vizionări sau serverul nu răspunde.</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Elemente din galerie</h2>
          <Link
            to="/admin/gallery"
            className="font-medium text-sm"
            style={{ color: ACCENT }}
          >
            Administrează galeria →
          </Link>
        </div>
        <div className="space-y-4">
          {galleryItems.slice(0, 5).map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-lg border-b border-gray-100 last:border-0"
            >
              <img
                src={item.url ? `${getUploadsBase()}${item.url}` : ''}
                alt={item.description || ''}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.description || 'Fără titlu'}</h3>
                <p className="text-sm text-gray-500 capitalize">{item.category || '—'}</p>
              </div>
              <a
                href={`${window.location.origin}/galerie/${encodeURIComponent(String(item.id))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium shrink-0"
                style={{ color: ACCENT }}
              >
                Vezi
              </a>
            </div>
          ))}
          {galleryItems.length === 0 && (
            <p className="text-gray-500 py-4">Nu există încă elemente în galerie. Adaugă din Administrează galeria.</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-600" />
          Unde găsești graficele și calendarul?
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Graficele detaliate, calendarul de vizionări și comparațiile avansate au fost mutate în pagina dedicată de analize.
        </p>
        <Link to="/admin/analytics" className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">
          Deschide Analize detaliate
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
