import React, { useState, useEffect, useMemo } from 'react';
import {
  ImageIcon,
  MapPin,
  BarChart3,
  ArrowRight,
  PieChart as PieChartIcon,
  Globe,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import galleryService from '../services/galleryService';
import { getAdminToken } from '../contexts/AuthContext';
import { getApiBase, getUploadsBase } from '../lib/api';

const API_URL = getApiBase();

interface AnalyticsSummary {
  totalViews: number;
  byPath: Record<string, number>;
  byDay?: Record<string, number>;
  mostViewed: { path: string; count: number } | null;
  recent: { path: string; ts: string; country: string | null; city: string | null }[];
}

const ACCENT = '#374151';

// Culori aprinse pentru grafice (pie/bar)
const CHART_COLORS = [
  '#3b82f6', // albastru aprins
  '#f43f5e', // roz aprins
  '#22c55e', // verde aprins
  '#eab308', // galben
  '#a855f7', // violet aprins
  '#06b6d4', // cyan
  '#f97316', // portocaliu
  '#8b5cf6', // mov
  '#14b8a6', // teal aprins
  '#ec4899', // pink
];
const getChartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const AdminDashboard: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });

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

  // Date pentru pie chart și top: elemente galerie din byPath
  const galleryPathEntriesSorted = useMemo(() => {
    if (!analytics?.byPath) return [];
    return Object.entries(analytics.byPath)
      .filter(([path]) => path.startsWith('/galerie/') && path !== '/galerie')
      .sort((a, b) => b[1] - a[1]);
  }, [analytics?.byPath]);

  const topGalleryByViews = galleryPathEntriesSorted.length ? galleryPathEntriesSorted[0] : null;
  const topGalleryId = topGalleryByViews ? topGalleryByViews[0].replace(/^\/galerie\//, '') : null;
  const topGalleryItem = topGalleryId ? galleryItems.find((x: any) => String(x.id) === String(topGalleryId)) : null;

  const galleryPieData = useMemo(() => {
    if (galleryPathEntriesSorted.length === 0) return [];
    const total = galleryPathEntriesSorted.reduce((s, [, c]) => s + c, 0);
    if (total === 0) return [];
    let acc = 0;
    return galleryPathEntriesSorted.map(([path, count], i) => {
      const id = path.replace(/^\/galerie\//, '');
      const item = galleryItems.find((x: any) => String(x.id) === String(id));
      const label = item?.description || `Element ${id.slice(-6)}`;
      const pct = (count / total) * 100;
      const start = acc;
      acc += pct;
      return {
        id,
        path,
        count,
        label,
        pct,
        startDeg: (start / 100) * 360,
        endDeg: (acc / 100) * 360,
        color: getChartColor(i),
      };
    });
  }, [galleryPathEntriesSorted, galleryItems]);

  // conic-gradient pentru pie: fiecare felie după unghi
  const pieConic = useMemo(() => {
    if (galleryPieData.length === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';
    const parts = galleryPieData.map(
      (s) => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`
    );
    return `conic-gradient(${parts.join(', ')})`;
  }, [galleryPieData]);

  // Luni disponibile pentru calendar (doar trecut + luna curentă)
  const calendarMonthOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push({
        value,
        label: d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
      });
    }
    return options;
  }, []);

  // Zile pentru luna selectată: toate zilele lunii până la azi (doar trecut + azi)
  const { calendarDays, calendarPad } = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const year = y || new Date().getFullYear();
    const month = (m || 1) - 1;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: string; label: string; count: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (d > today) break;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = analytics?.byDay?.[dateStr] ?? 0;
      days.push({ date: dateStr, label: String(day), count });
    }
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const pad = (firstDayOfMonth + 6) % 7;
    return { calendarDays: days, calendarPad: pad };
  }, [calendarMonth, analytics?.byDay]);

  // Vizionări per lună (din byDay), ultimele 6 luni
  const byMonth = useMemo(() => {
    if (!analytics?.byDay) return [];
    const map: Record<string, number> = {};
    Object.entries(analytics.byDay).forEach(([date, count]) => {
      const month = date.slice(0, 7);
      map[month] = (map[month] || 0) + count;
    });
    const now = new Date();
    const months: { label: string; key: string; count: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
        count: map[key] || 0,
      });
    }
    return months;
  }, [analytics?.byDay]);

  // Agregare locații din vizionări recente (țară, oraș)
  const locationCounts = useMemo(() => {
    if (!analytics?.recent?.length) return [];
    const byKey: Record<string, number> = {};
    analytics.recent.forEach((r) => {
      const key = [r.country || 'Necunoscut', r.city].filter(Boolean).join(' – ') || 'Locație necunoscută';
      byKey[key] = (byKey[key] || 0) + 1;
    });
    return Object.entries(byKey)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [analytics?.recent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bun venit în panoul de administrare</p>
      </div>

      {/* Galerie – prima secțiune */}
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

      {/* Vizionări site + grafice */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Vizionări și statistici</h2>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6" style={{ color: ACCENT }} />
          Vizionări site
        </h3>
        {analytics ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{analytics.totalViews}</div>
                <div className="text-sm text-gray-600">Total vizionări</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
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
                    <Link to={`/galerie/${topGalleryId}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs"
            style={{ color: ACCENT }}>
                      Vezi în galerie →
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-gray-500">—</div>
                    <div className="text-sm text-gray-600">Cel mai vizionat din galerie</div>
                  </>
                )}
              </div>
            </div>

            {/* Vizionări per lună */}
            {byMonth.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  Vizionări per lună (ultimele 6 luni)
                </h3>
                <div className="space-y-2">
                  {byMonth.map((m, i) => {
                    const maxM = Math.max(...byMonth.map((x) => x.count), 1);
                    const pct = (m.count / maxM) * 100;
                    return (
                      <div key={m.key} className="flex items-center gap-3">
                        <span className="w-28 text-sm text-gray-700 capitalize shrink-0">{m.label}</span>
                        <div className="flex-1 h-6 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full rounded flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: ACCENT }}
                          >
                            <span className="text-xs font-medium text-white">{m.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vizionări per zi – doar trecut, cu selector de lună */}
            <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 max-w-[280px]">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-gray-600" />
                Vizionări per zi (doar trecut)
              </h3>
              <div className="mb-2">
                <label className="sr-only">Lună</label>
                <select
                  value={calendarMonth}
                  onChange={(e) => setCalendarMonth(e.target.value)}
                  className="w-full text-xs p-1.5 border border-gray-200 rounded-lg bg-white text-gray-700"
                >
                  {calendarMonthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((d) => (
                  <div key={d} className="text-[10px] font-medium text-gray-500 py-0.5">{d}</div>
                ))}
                {Array.from({ length: calendarPad }, (_, i) => (
                  <div key={`pad-${i}`} className="rounded p-0.5 min-h-[1.5rem]" />
                ))}
                {calendarDays.map((day) => {
                  const maxCount = Math.max(...calendarDays.map((x) => x.count), 1);
                  const intensity = day.count ? Math.max(0.2, day.count / maxCount) : 0;
                  return (
                    <div
                      key={day.date}
                      className="rounded p-0.5 min-h-[1.5rem] flex flex-col items-center justify-center border border-gray-200 bg-white"
                      title={`${day.date}: ${day.count} vizionări`}
                    >
                      <span className="text-[10px] text-gray-600">{day.label}</span>
                      <span
                        className={`text-[9px] font-semibold ${day.count ? 'text-gray-900' : 'text-gray-300'}`}
                        style={day.count ? { opacity: 0.7 + intensity * 0.3 } : undefined}
                      >
                        {day.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grafice: Pie (o felie per element galerie) + Bar top elemente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-lg border border-gray-200 p-6 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" style={{ color: ACCENT }} />
                  Vizionări per element din galerie (pie)
                </h3>
                {galleryPieData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div
                      className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-white flex-shrink-0"
                      style={{ background: pieConic }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      {galleryPieData.slice(0, 8).map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate text-gray-700" title={s.label}>{s.label}</span>
                          <span className="text-gray-500 font-medium">{s.count}</span>
                        </div>
                      ))}
                      {galleryPieData.length > 8 && (
                        <p className="text-xs text-gray-500">+ {galleryPieData.length - 8} elemente</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm py-4">Nicio vizionare încă pe elemente din galerie.</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-6 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: ACCENT }} />
                  Top elemente galerie (vizionări)
                </h3>
                {galleryPathEntriesSorted.length > 0 ? (
                  <div className="space-y-3">
                    {galleryPathEntriesSorted
                      .slice(0, 8)
                      .map(([path, count], i) => {
                        const id = path.replace(/^\/galerie\//, '');
                        const item = galleryItems.find((x: any) => String(x.id) === String(id));
                        const label = item?.description || `ID ${id.slice(-6)}`;
                        const maxC = Math.max(...galleryPathEntriesSorted.map(([, c]) => c), 1);
                        const pct = (count / maxC) * 100;
                        return (
                          <div key={path} className="flex items-center gap-3">
                            <div className="w-28 sm:w-36 text-sm text-gray-700 truncate" title={label}>{label}</div>
                            <div className="flex-1 h-7 bg-gray-200 rounded-lg overflow-hidden">
                              <div
                                className="h-full rounded-lg flex items-center justify-end pr-2"
                                style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: getChartColor(i) }}
                              >
                                <span className="text-xs font-medium text-white">{count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm py-4">Nicio vizionare încă pe elemente din galerie.</p>
                )}
              </div>
            </div>

            {/* Locații: vizitatori pe țară/oras */}
            {locationCounts.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-6 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" style={{ color: ACCENT }} />
                  Locații vizitatori (țară / oraș)
                </h3>
                <div className="flex flex-wrap gap-4">
                  {locationCounts.map(({ name, count }) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 shadow-sm"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">{name}</span>
                      <span className="text-sm text-gray-500">({count})</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Bazat pe ultimele vizionări. Locația se completează automat când vizitatorul nu e pe rețea locală.
                </p>
              </div>
            )}

            {analytics.recent && analytics.recent.length > 0 && (
              <div>
                <div className="flex flex-col gap-2 mb-2">
                  <Link
                    to="/admin/analytics#recent"
                    className="text-sm font-medium shrink-0 w-fit"
            style={{ color: ACCENT }}
                  >
                    Vezi mai multe →
                  </Link>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Vizionări recente (ultimele 15)
                  </h3>
                </div>
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
                      {analytics.recent.slice(0, 15).map((r, i) => (
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
                          <td className="px-4 py-2 text-gray-600">
                            {[r.city, r.country].filter(Boolean).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Nu există date de vizionări sau serverul nu răspunde.</p>
        )}
      </div>

      {/* Elemente recente din galerie */}
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
    </div>
  );
};

export default AdminDashboard;
