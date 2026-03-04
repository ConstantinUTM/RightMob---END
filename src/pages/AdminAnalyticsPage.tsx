import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, PieChart as PieChartIcon, ArrowLeft } from 'lucide-react';
import { getAdminToken } from '../contexts/AuthContext';
import galleryService from '../services/galleryService';

const API_URL = `http://${window.location.hostname}:3001`;

interface AnalyticsSummary {
  totalViews: number;
  byPath: Record<string, number>;
  mostViewed: { path: string; count: number } | null;
  recent: { path: string; ts: string; country: string | null; city: string | null }[];
}

const CHART_COLORS = [
  '#3b82f6', '#f43f5e', '#22c55e', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899',
];
const getChartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const formatPathLabel = (path: string, galleryItems: any[] = []): string => {
  if (path === '/') return 'Acasă';
  if (path === '/galerie') return 'Galerie (listă)';
  if (path.startsWith('/galerie/')) {
    const id = path.replace(/^\/galerie\//, '').replace(/\/$/, '');
    const item = galleryItems.find((x: any) => String(x.id) === String(id));
    const name = item?.description || item?.filename || id;
    return name ? `Galerie – ${name}` : 'Galerie – element';
  }
  if (path === '/contact') return 'Contact';
  if (path === '/despre') return 'Despre';
  if (path === '/try-room' || path === '/try-room/') return 'Try in my room';
  return path;
};

const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/summary`, {
          headers: { 'x-admin-token': getAdminToken() || '' },
        });
        if (res.ok) setAnalytics(await res.json());
      } catch {
        setAnalytics(null);
      }
    };
    load();
  }, []);

  useEffect(() => {
    galleryService.getGallery().then((list) => {
      setGalleryItems(Array.isArray(list) ? list : []);
    }).catch(() => setGalleryItems([]));
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Se încarcă datele de vizionări…</p>
        </div>
      </div>
    );
  }

  const total = analytics.totalViews || 1;
  const byPathEntries = Object.entries(analytics.byPath || {}).sort((a, b) => b[1] - a[1]);
  const galleryEntries = byPathEntries.filter(([p]) => p.startsWith('/galerie/') && p !== '/galerie');
  const topGallery = galleryEntries.slice(0, 10);
  const pathLabels: Record<string, string> = {};
  byPathEntries.forEach(([path]) => { pathLabels[path] = formatPathLabel(path, galleryItems); });

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          aria-label="Înapoi"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vizionări și analize</h1>
          <p className="text-sm text-gray-600">Distribuție pe pagini și cel mai vizionat din galerie</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie-style: distribuție pe tipuri de pagini */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm card-lux-hover">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-primary-600" />
            Distribuție vizionări pe pagini
          </h2>
          <div className="space-y-3">
            {byPathEntries.slice(0, 12).map(([path, count], i) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={path} className="flex items-center gap-3">
                  <div className="min-w-[6rem] max-w-[12rem] sm:max-w-[14rem] text-sm text-gray-600 truncate shrink-0" title={pathLabels[path] || path}>
                    {pathLabels[path] || path}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 min-w-[2px]"
                      style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: getChartColor(i) }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">{pct}%</span>
                  <span className="text-xs text-gray-400">({count})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar: top elemente galerie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm card-lux-hover">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Top elemente galerie (vizionări)
          </h2>
          {topGallery.length === 0 ? (
            <p className="text-gray-500 text-sm">Nicio vizionare încă pe elemente din galerie.</p>
          ) : (
            <div className="space-y-3">
              {topGallery.map(([path, count], i) => {
                const id = path.replace(/^\/galerie\//, '');
                const item = galleryItems.find((x: any) => String(x.id) === String(id));
                const label = item?.description || `ID: ${id}`;
                const maxCount = Math.max(...topGallery.map(([, c]) => c), 1);
                const pct = Math.round((count / maxCount) * 100);
                const barColor = getChartColor(i);
                return (
                  <div key={path} className="flex items-center gap-3">
                    <div className="w-32 sm:w-40 text-sm text-gray-700 truncate shrink-0" title={label}>
                      {label}
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${pct}%`, minWidth: count ? '2rem' : 0, backgroundColor: barColor }}
                      >
                        <span className="text-xs font-medium text-white">{count}</span>
                      </div>
                    </div>
                    <a
                      href={`${window.location.origin}/galerie/${encodeURIComponent(id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline shrink-0"
                    >
                      Vezi
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vizionări recente (toate, până la 100) */}
      {analytics.recent && analytics.recent.length > 0 && (
        <div id="recent" className="mt-8 scroll-mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vizionări recente (ultimele 100)</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Pagină</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Data</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Locație</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recent.slice(0, 100).map((r, i) => {
                  const formatDate = (ts: string) => {
                    try {
                      return new Date(ts).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' });
                    } catch {
                      return ts;
                    }
                  };
                  const isGallery = r.path.startsWith('/galerie/');
                  const galleryId = isGallery ? r.path.replace(/^\/galerie\//, '') : '';
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">
                        {isGallery ? (
                          <a
                            href={`${window.location.origin}/galerie/${encodeURIComponent(galleryId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            {pathLabels[r.path] || r.path}
                          </a>
                        ) : (
                          pathLabels[r.path] || r.path
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{formatDate(r.ts)}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {[r.city, r.country].filter(Boolean).join(', ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
