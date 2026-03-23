import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, PieChart as PieChartIcon, ArrowLeft, Download, Calendar,
  Globe, Clock, Eye, TrendingUp, MapPin, ChevronLeft, ChevronRight,
  FileDown, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { getAdminToken } from '../contexts/AuthContext';
import galleryService from '../services/galleryService';

const API_URL = `http://${window.location.hostname}:3001`;

/* ─── Types ─── */
interface ViewEntry {
  path: string;
  ts: string;
  country: string | null;
  city: string | null;
  device?: string | null;
  ip?: string | null;
}

interface AnalyticsSummary {
  totalViews: number;
  byPath: Record<string, number>;
  byDay: Record<string, number>;
  byHour: Record<string, number>;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  byRegion: Record<string, number>;
  byDevice: Record<string, number>;
  byPathPerDay: Record<string, Record<string, number>>;
  mostViewed: { path: string; count: number } | null;
  recent: ViewEntry[];
}

/* ─── Constants ─── */
const CHART_COLORS = [
  '#3b82f6', '#f43f5e', '#22c55e', '#eab308', '#a855f7',
  '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899',
  '#6366f1', '#10b981',
];

const isUnknownAnalyticsValue = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '' || normalized === 'unknown' || normalized === 'necunoscut' || normalized === 'n/a';
};

const formatDeviceLabel = (value?: string | null) => {
  if (isUnknownAnalyticsValue(value)) return 'Neclasificat';
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'desktop') return 'Calculator';
  if (normalized === 'mobile') return 'Telefon';
  if (normalized === 'tablet') return 'Tableta';
  return String(value || 'Neclasificat');
};
const getColor = (i: number) => CHART_COLORS[i % CHART_COLORS.length];

const MONTHS_RO = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

type ExportPeriod = 'last_month' | 'last_6_months' | 'last_year' | 'all';
type TrendPeriod = 'week' | 'month' | '6months' | 'year';

/* ─── Helpers ─── */
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

const formatDate = (ts: string) => {
  try {
    return new Date(ts).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return ts; }
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const getStartOfWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
};

const getWeekKey = (d: Date) => getDateStr(getStartOfWeek(d));

const monthLabelFromKey = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
};

const weekLabelFromKey = (key: string) => {
  const start = new Date(`${key}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}`;
};

const filterByPeriod = (recent: ViewEntry[], period: ExportPeriod): ViewEntry[] => {
  if (period === 'all') return recent;
  const now = new Date();
  let from: Date;
  if (period === 'last_month') from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  else if (period === 'last_6_months') from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  else from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const fromStr = from.toISOString();
  return recent.filter((v) => v.ts >= fromStr);
};

/* ─── Stat Card ─── */
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: string;
}> = ({ icon, label, value, sub, trend, color = '#3b82f6' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>{icon}</div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

/* ─── Mini bar for hours ─── */
const HoursChart: React.FC<{ byHour: Record<string, number> }> = ({ byHour }) => {
  const vals = Object.values(byHour);
  const max = vals.length > 0 ? Math.max(...vals, 1) : 1;
  const maxBarH = 110; // px
  const tickHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: maxBarH + 6 }}>
        {Array.from({ length: 24 }, (_, h) => {
          const val = byHour[h] || 0;
          const barH = val > 0 ? Math.max(Math.round((val / max) * maxBarH), 12) : 4;
          return (
            <div key={h} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: maxBarH + 6 }}>
              <div
                className="w-full rounded-sm transition-all duration-300 hover:opacity-85"
                style={{
                  height: barH,
                  background: h >= 9 && h <= 18 ? '#3b82f6' : '#94a3b8',
                }}
              />
              <div className="absolute -top-7 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {h}:00 – {val} vizionări
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-12 mt-1 text-[9px] text-gray-400">
        {tickHours.map((hour) => (
          <span key={hour} className="text-center whitespace-nowrap">{hour}</span>
        ))}
      </div>
    </div>
  );
};

/* ─── Day Detail (with fallback computation from byDay) ─── */
const DayDetail: React.FC<{
  selectedDate: string;
  byDay: Record<string, number>;
  byPathPerDay: Record<string, Record<string, number>>;
  galleryItems: any[];
}> = ({ selectedDate, byDay, byPathPerDay, galleryItems }) => {
  const dayTotal = byDay[selectedDate] || 0;
  const perPath = byPathPerDay[selectedDate];
  const hasDetail = perPath && Object.keys(perPath).length > 0;

  return (
    <div className="mt-4 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        <span className="ml-auto text-sm font-normal text-blue-700">
          {dayTotal} vizionări total
        </span>
      </h4>
      {hasDetail ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {Object.entries(perPath)
            .sort((a, b) => b[1] - a[1])
            .map(([path, cnt]) => (
              <div key={path} className="flex items-center gap-2 text-sm">
                <span className="text-blue-800 font-medium w-8 text-right">{cnt}</span>
                <div className="flex-1 h-4 bg-blue-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded"
                    style={{ width: `${(cnt / (dayTotal || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-blue-700 text-xs truncate max-w-[200px]" title={formatPathLabel(path, galleryItems)}>
                  {formatPathLabel(path, galleryItems)}
                </span>
              </div>
            ))}
        </div>
      ) : dayTotal > 0 ? (
        <p className="text-sm text-blue-600">Detalii per pagină vor fi disponibile după repornirea serverului. Total: {dayTotal} vizionări.</p>
      ) : (
        <p className="text-sm text-blue-600">Nicio vizionare în această zi.</p>
      )}
    </div>
  );
};

/* ─── Calendar Heatmap ─── */
const CalendarView: React.FC<{
  byDay: Record<string, number>;
  byPathPerDay: Record<string, Record<string, number>>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  calendarMonth: Date;
  onChangeMonth: (dir: -1 | 1) => void;
  galleryItems: any[];
}> = ({ byDay, byPathPerDay, selectedDate, onSelectDate, calendarMonth, onChangeMonth, galleryItems }) => {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const maxViews = Math.max(...Object.values(byDay), 1);

  const getHeatColor = (count: number) => {
    if (count === 0) return '#f3f4f6';
    const intensity = Math.min(count / maxViews, 1);
    if (intensity < 0.25) return '#dbeafe';
    if (intensity < 0.5) return '#93c5fd';
    if (intensity < 0.75) return '#3b82f6';
    return '#1d4ed8';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onChangeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-gray-800">
          {MONTHS_RO[month]} {year}
        </h3>
        <button onClick={() => onChangeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_RO.map((d) => (
          <div key={d} className="text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = byDay[dateStr] || 0;
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'}
              `}
              style={{ background: getHeatColor(count) }}
              title={`${dateStr}: ${count} vizionări`}
            >
              <span className={`font-medium ${count > 0 && !isSelected ? (count / maxViews > 0.5 ? 'text-white' : 'text-gray-700') : 'text-gray-600'} ${isSelected ? 'text-blue-900 font-bold' : ''}`}>
                {day}
              </span>
              {count > 0 && (
                <span className={`text-[8px] ${count / maxViews > 0.5 ? 'text-white/80' : 'text-gray-500'} ${isSelected ? 'text-blue-800' : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {selectedDate && (
        <DayDetail
          selectedDate={selectedDate}
          byDay={byDay}
          byPathPerDay={byPathPerDay}
          galleryItems={galleryItems}
        />
      )}
    </div>
  );
};

/* ─── Location Panel ─── */
const LocationsPanel: React.FC<{
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  recent: ViewEntry[];
}> = ({ byCountry, byCity, recent }) => {
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const recentLocations = recent
    .filter((v) => v.city || v.country)
    .slice(0, 20);
  const totalGeo = Object.values(byCountry).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" /> Top țări
        </h4>
        {topCountries.length === 0 ? (
          <p className="text-xs text-gray-400">Datele de locație nu sunt disponibile pentru vizitele locale.</p>
        ) : (
          <div className="space-y-2">
            {topCountries.map(([country, count], i) => {
              const pct = totalGeo > 0 ? Math.round((count / totalGeo) * 100) : 0;
              return (
                <div key={country} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-28 truncate">{country}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%`, background: getColor(i) }} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
                  <span className="text-[10px] text-gray-400">({count})</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" /> Top orașe
        </h4>
        {topCities.length === 0 ? (
          <p className="text-xs text-gray-400">Datele de locație nu sunt disponibile pentru vizitele locale.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topCities.map(([city, count]) => (
              <span key={city} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                {city} <span className="font-semibold text-gray-900">{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" /> Ultimele locații (live)
        </h4>
        {recentLocations.length === 0 ? (
          <p className="text-xs text-gray-400">Nicio locație detectată recent.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {recentLocations.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 w-24 shrink-0">{formatDate(v.ts)}</span>
                <span className="font-medium text-gray-700">{[v.city, v.country].filter(Boolean).join(', ')}</span>
                <span className="ml-auto text-gray-400 truncate max-w-[120px]">{v.path}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Unified flexible trend chart ─── */
type TrendBar = { key: string; count: number; label: string; isToday?: boolean };

const FlexTrendChart: React.FC<{ byDay: Record<string, number>; period: TrendPeriod }> = ({ byDay, period }) => {
  const bars = useMemo<TrendBar[]>(() => {
    const today = new Date();
    const todayStr = getDateStr(today);

    if (period === 'week' || period === 'month') {
      const daysCount = period === 'week' ? 7 : 30;
      const result: TrendBar[] = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = getDateStr(d);
        result.push({
          key: ds,
          count: byDay[ds] || 0,
          label: `${d.getDate()} ${MONTHS_RO[d.getMonth()]}`,
          isToday: ds === todayStr,
        });
      }
      return result;
    }

    if (period === '6months') {
      const weekMap: Record<string, { count: number; label: string }> = {};
      const ordered: string[] = [];
      for (let i = 179; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const wk = getWeekKey(d);
        if (!weekMap[wk]) {
          weekMap[wk] = { count: 0, label: `${d.getDate()} ${MONTHS_RO[d.getMonth()]}` };
          ordered.push(wk);
        }
        weekMap[wk].count += byDay[getDateStr(d)] || 0;
      }
      return ordered.map((wk, i) => ({
        key: wk,
        count: weekMap[wk].count,
        label: `Săpt. ${weekMap[wk].label}`,
        isToday: i === ordered.length - 1,
      }));
    }

    // year: group by month
    const monthMap: Record<string, { count: number; label: string }> = {};
    const orderedM: string[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const mk = getMonthKey(d);
      if (!monthMap[mk]) {
        monthMap[mk] = { count: 0, label: `${MONTHS_RO[d.getMonth()]} ${d.getFullYear()}` };
        orderedM.push(mk);
      }
      monthMap[mk].count += byDay[getDateStr(d)] || 0;
    }
    return orderedM.map((mk, i) => ({
      key: mk,
      count: monthMap[mk].count,
      label: monthMap[mk].label,
      isToday: i === orderedM.length - 1,
    }));
  }, [byDay, period]);

  const max = Math.max(...bars.map((b) => b.count), 1);
  const maxBarH = 120;
  const total = bars.reduce((s, b) => s + b.count, 0);
  const avgPerBar = bars.length > 0 ? (total / bars.length).toFixed(1) : '0';
  const tickCount = 6;
  const tickIndexes = bars.length <= tickCount
    ? bars.map((_, i) => i)
    : Array.from({ length: tickCount }, (_, i) => Math.round((i / (tickCount - 1)) * (bars.length - 1)));

  return (
    <div>
      <div className="flex gap-2 mb-3 text-xs">
        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
          Total: {total}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
          Medie/{period === 'year' ? 'lună' : period === '6months' ? 'săpt.' : 'zi'}: {avgPerBar}
        </span>
      </div>
      <div className="flex items-end gap-[3px]" style={{ height: maxBarH + 20 }}>
        {bars.map((b) => {
          const barH = b.count > 0 ? Math.max(Math.round((b.count / max) * maxBarH), 8) : 3;
          return (
            <div key={b.key} className="flex-1 flex flex-col items-end justify-end group relative" style={{ height: maxBarH + 20 }}>
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${b.isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                style={{ height: barH, background: b.isToday ? '#2563eb' : b.count > 0 ? '#3b82f6' : '#e5e7eb' }}
              />
              <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {b.label}: {b.count} vizionări
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-gray-400 px-0.5">
        {tickIndexes.map((idx, ti) => (
          <span key={idx} className={ti === 0 ? 'text-left' : ti === tickIndexes.length - 1 ? 'text-right' : 'text-center'}>
            {bars[idx]?.isToday ? 'Azi' : bars[idx]?.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── Per-page analytics ─── */
const PerPageAnalytics: React.FC<{
  byPath: Record<string, number>;
  byPathPerDay: Record<string, Record<string, number>>;
  recent: ViewEntry[];
  total: number;
  galleryItems: any[];
}> = ({ byPath, byPathPerDay, recent, total, galleryItems }) => {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');

  const filteredRecent = useMemo(() => {
    if (period === 'all') return recent;
    const now = new Date();
    const from = new Date(now);
    if (period === 'day') from.setDate(now.getDate() - 1);
    if (period === 'week') from.setDate(now.getDate() - 7);
    if (period === 'month') from.setDate(now.getDate() - 30);
    if (period === 'year') from.setDate(now.getDate() - 365);
    const fromTs = from.toISOString();
    return recent.filter((v) => v.ts >= fromTs);
  }, [recent, period]);

  const byPathFiltered = useMemo(() => {
    const out: Record<string, number> = {};
    filteredRecent.forEach((v) => {
      const p = v.path || '/';
      out[p] = (out[p] || 0) + 1;
    });
    return out;
  }, [filteredRecent]);

  const totalFiltered = useMemo(() => {
    const sum = Object.values(byPathFiltered).reduce((acc, x) => acc + x, 0);
    return sum > 0 ? sum : total;
  }, [byPathFiltered, total]);

  const sortedPages = useMemo(() => {
    const source = Object.keys(byPathFiltered).length > 0 ? byPathFiltered : byPath;
    return Object.entries(source).sort((a, b) => b[1] - a[1]);
  }, [byPathFiltered, byPath]);

  const pageDailyData = useMemo(() => {
    if (!selectedPage) return [];
    const daysToShow = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 30;
    const days: { date: string; count: number; label: string }[] = [];
    const today = new Date();
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = getDateStr(d);
      days.push({
        date: ds,
        count: byPathPerDay[ds]?.[selectedPage] || 0,
        label: `${d.getDate()} ${MONTHS_RO[d.getMonth()]}`,
      });
    }
    return days;
  }, [selectedPage, byPathPerDay, period]);

  const pageHourly = useMemo(() => {
    if (!selectedPage) return {};
    const hourMap: Record<number, number> = {};
    filteredRecent.filter((v) => v.path === selectedPage).forEach((v) => {
      try {
        const h = new Date(v.ts).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      } catch {}
    });
    return hourMap;
  }, [selectedPage, filteredRecent]);

  const pageLocations = useMemo(() => {
    if (!selectedPage) return [];
    return filteredRecent
      .filter((v) => v.path === selectedPage && (v.city || v.country))
      .slice(0, 10);
  }, [selectedPage, filteredRecent]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { key: 'day' as const, label: 'Zi' },
          { key: 'week' as const, label: 'Săptămână' },
          { key: 'month' as const, label: 'Lună' },
          { key: 'year' as const, label: 'An' },
          { key: 'all' as const, label: 'Tot' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              period === opt.key
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
        {sortedPages.map(([path, count], i) => {
          const pct = Math.round((count / (totalFiltered || 1)) * 100);
          const isActive = selectedPage === path;
          return (
            <button
              key={path}
              onClick={() => setSelectedPage(isActive ? null : path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all border
                ${isActive ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}
              `}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getColor(i) }} />
              <span className="truncate flex-1 text-gray-700">{formatPathLabel(path, galleryItems)}</span>
              <span className="text-xs font-semibold text-gray-500">{count}</span>
              <span className="text-[10px] text-gray-400">{pct}%</span>
            </button>
          );
        })}
      </div>

      {selectedPage && (
        <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-100 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {formatPathLabel(selectedPage, galleryItems)}
            </h4>
            <span className="text-sm text-blue-700 font-medium">{byPathFiltered[selectedPage] || 0} vizionări</span>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Trend pe perioada selectată</p>
            <div className="flex items-end gap-[2px] h-24 rounded-lg border border-indigo-100 bg-white/75 px-2 py-2">
              {pageDailyData.map((d) => {
                const max = Math.max(...pageDailyData.map((x) => x.count), 1);
                const pct = Math.sqrt(d.count / max) * 100;
                return (
                  <div key={d.date} className="flex-1 group relative">
                    <div
                      className="w-full rounded-t min-h-[3px]"
                      style={{ height: `${Math.max(pct, 4)}%`, background: d.count > 0 ? '#6366f1' : '#e5e7eb' }}
                    />
                    <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                      {d.label}: {d.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] text-gray-400">
              <span>{pageDailyData[0]?.label}</span>
              <span>Astăzi</span>
            </div>
          </div>

          {Object.keys(pageHourly).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Distribuție pe ore</p>
              <div className="flex items-end gap-[2px] h-20 rounded-lg border border-violet-100 bg-white/75 px-2 py-2">
                {Array.from({ length: 24 }, (_, h) => {
                  const val = pageHourly[h] || 0;
                  const mx = Math.max(...Object.values(pageHourly), 1);
                  const scaled = Math.sqrt(val / mx) * 100;
                  return (
                    <div key={h} className="flex-1 group relative">
                      <div className="w-full rounded-t min-h-[2px]" style={{ height: `${Math.max(scaled, 4)}%`, background: val > 0 ? '#8b5cf6' : '#e5e7eb' }} />
                      <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                        {h}:00 – {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pageLocations.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Ultimele locații (perioada selectată)</p>
              <div className="flex flex-wrap gap-1.5">
                {pageLocations.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 rounded text-[11px] text-gray-600 border border-gray-100">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {[v.city, v.country].filter(Boolean).join(', ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Export Panel ─── */
const ExportPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [period, setPeriod] = useState<ExportPeriod>('last_month');
  const [format, setFormat] = useState<'csv' | 'json' | 'json_graphs'>('csv');
  const [exporting, setExporting] = useState(false);

  const doExport = async () => {
    setExporting(true);
    try {
      const token = getAdminToken() || '';
      const res = await fetch(
        `${API_URL}/api/analytics/export?period=${encodeURIComponent(period)}&format=${encodeURIComponent(format)}`,
        { headers: { 'x-admin-token': token } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch?.[1] || `analytics_${period}.${format}`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Eroare la export. Reporniți serverul și încercați din nou.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileDown className="w-5 h-5 text-blue-500" />
          Export rapoarte
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Perioadă</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'last_month' as const, label: 'Ultima lună' },
              { value: 'last_6_months' as const, label: 'Ultimele 6 luni' },
              { value: 'last_year' as const, label: 'Ultimul an' },
              { value: 'all' as const, label: 'Tot istoricul' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all
                  ${period === opt.value
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Format</label>
          <div className="flex gap-2">
            {[
              { value: 'csv' as const, label: 'CSV (Excel)' },
              { value: 'json' as const, label: 'JSON' },
              { value: 'json_graphs' as const, label: 'JSON + Grafice' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all
                  ${format === opt.value
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JSON simplu este util pentru integrare în BI/Power BI. Varianta JSON + Grafice include și seturi gata pentru chart-uri (zile, ore, pagini, țări).
          </p>
        </div>

        <button
          onClick={doExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Se exportă...' : 'Descarcă raport'}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'locations' | 'recent'>('overview');
  const [recentFilter, setRecentFilter] = useState<ExportPeriod>('all');
  const [recentLimit, setRecentLimit] = useState(50);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('month');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/summary`, {
          headers: { 'x-admin-token': getAdminToken() || '' },
        });
        if (res.ok) setAnalytics(await res.json());
      } catch { setAnalytics(null); }
    };
    load();
  }, []);

  useEffect(() => {
    galleryService.getGallery()
      .then((list) => setGalleryItems(Array.isArray(list) ? list : []))
      .catch(() => setGalleryItems([]));
  }, []);

  const changeMonth = useCallback((dir: -1 | 1) => {
    setCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, []);

  const stats = useMemo(() => {
    if (!analytics) return null;
    const bd = analytics.byDay || {};
    const total = analytics.totalViews;
    const now = new Date();

    const sumRange = (daysBack: number, length: number) => {
      let s = 0;
      for (let i = daysBack; i < daysBack + length; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        s += bd[getDateStr(d)] || 0;
      }
      return s;
    };

    const calcTrend = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

    // Săptămâna curentă vs anterioară
    const thisWeek = sumRange(0, 7);
    const lastWeek = sumRange(7, 7);
    const weekTrend = calcTrend(thisWeek, lastWeek);

    // Luna curentă vs anterioară
    const thisMonth = sumRange(0, 30);
    const lastMonth = sumRange(30, 30);
    const monthTrend = calcTrend(thisMonth, lastMonth);

    // 6 luni curente vs anterioare
    const this6m = sumRange(0, 180);
    const last6m = sumRange(180, 180);
    const sixMonthTrend = calcTrend(this6m, last6m);

    const uniqueCountries = Object.keys(analytics.byCountry || {}).length;
    const uniqueCities = Object.keys(analytics.byCity || {}).length;
    const activeDays = Math.max(1, Object.keys(analytics.byDay || {}).length);
    const regionEntries = Object.entries(analytics.byRegion || {}).sort((a, b) => b[1] - a[1]);
    const deviceEntries = Object.entries(analytics.byDevice || {}).sort((a, b) => b[1] - a[1]);
    const knownRegionEntries = regionEntries.filter(([region]) => !isUnknownAnalyticsValue(region));
    const knownDeviceEntries = deviceEntries.filter(([device]) => !isUnknownAnalyticsValue(device));
    const unknownRegionViews = regionEntries
      .filter(([region]) => isUnknownAnalyticsValue(region))
      .reduce((sum, [, count]) => sum + count, 0);
    const unknownDeviceViews = deviceEntries
      .filter(([device]) => isUnknownAnalyticsValue(device))
      .reduce((sum, [, count]) => sum + count, 0);
    const uniqueRegions = knownRegionEntries.length;
    const uniqueDevices = knownDeviceEntries.length;
    const uniquePages = Object.keys(analytics.byPath || {}).length;
    const peakHour = Object.entries(analytics.byHour || {}).sort((a, b) => b[1] - a[1])[0];
    const topRegion = knownRegionEntries[0] || null;
    const topDevice = knownDeviceEntries[0] || null;
    const knownRegionViews = knownRegionEntries.reduce((sum, [, count]) => sum + count, 0);
    const knownDeviceViews = knownDeviceEntries.reduce((sum, [, count]) => sum + count, 0);
    const totalDeviceViews = knownDeviceViews + unknownDeviceViews;
    const geoCoveragePct = total > 0 ? Math.round((knownRegionViews / total) * 100) : 0;
    const classifiedDevicePct = total > 0 ? Math.round((knownDeviceViews / total) * 100) : 0;
    const deviceTypeCount = knownDeviceEntries.length + (unknownDeviceViews > 0 ? 1 : 0);
    const avgViewsPerDeviceType = deviceTypeCount > 0 ? Math.round(totalDeviceViews / deviceTypeCount) : 0;
    const deviceBreakdown = [
      ...knownDeviceEntries.map(([device, count]) => ({
      device: formatDeviceLabel(device),
      count,
      share: total > 0 ? Math.round((count / total) * 100) : 0,
      avgPerDay: Number((count / activeDays).toFixed(1)),
      })),
      ...(unknownDeviceViews > 0 ? [{
        device: 'Neclasificat',
        count: unknownDeviceViews,
        share: total > 0 ? Math.round((unknownDeviceViews / total) * 100) : 0,
        avgPerDay: Number((unknownDeviceViews / activeDays).toFixed(1)),
      }] : []),
    ];

    return {
      total,
      thisWeek,
      lastWeek,
      weekTrend,
      thisMonth,
      lastMonth,
      monthTrend,
      this6m,
      last6m,
      sixMonthTrend,
      uniqueCountries,
      uniqueCities,
      uniqueRegions,
      uniqueDevices,
      uniquePages,
      peakHour,
      topRegion,
      topDevice,
      unknownRegionViews,
      unknownDeviceViews,
      knownRegionViews,
      knownDeviceViews,
      totalDeviceViews,
      geoCoveragePct,
      classifiedDevicePct,
      avgViewsPerDeviceType,
      deviceBreakdown
    };
  }, [analytics]);

  const filteredRecent = useMemo(() => {
    if (!analytics) return [];
    return filterByPeriod(analytics.recent || [], recentFilter);
  }, [analytics, recentFilter]);

  const hourlyStats = useMemo(() => {
    if (!analytics) return null;
    const entries = Object.entries(analytics.byHour || {})
      .map(([hour, views]) => ({ hour: Number(hour), views }))
      .filter((x) => !Number.isNaN(x.hour));
    const total = entries.reduce((sum, e) => sum + e.views, 0);
    const activeHours = entries.filter((e) => e.views > 0).length;
    const avg = activeHours > 0 ? (total / activeHours).toFixed(1) : '0';
    const peak = entries.sort((a, b) => b.views - a.views)[0] || { hour: 0, views: 0 };
    return { avg, peak };
  }, [analytics]);

  const comparativeStats = useMemo(() => {
    if (!analytics) return null;

    const monthCounts: Record<string, number> = {};
    const weekCounts: Record<string, number> = {};
    const monthBestDay: Record<string, { day: string; count: number }> = {};
    const weekBestDay: Record<string, { day: string; count: number }> = {};

    Object.entries(analytics.byDay || {}).forEach(([date, count]) => {
      const d = new Date(`${date}T00:00:00`);
      const mk = getMonthKey(d);
      const wk = getWeekKey(d);

      monthCounts[mk] = (monthCounts[mk] || 0) + count;
      weekCounts[wk] = (weekCounts[wk] || 0) + count;

      if (!monthBestDay[mk] || monthBestDay[mk].count < count) {
        monthBestDay[mk] = { day: date, count };
      }
      if (!weekBestDay[wk] || weekBestDay[wk].count < count) {
        weekBestDay[wk] = { day: date, count };
      }
    });

    const monthSeries = Object.keys(monthCounts)
      .sort()
      .map((key) => ({ key, count: monthCounts[key], label: monthLabelFromKey(key), bestDay: monthBestDay[key] || null }));

    const weekSeries = Object.keys(weekCounts)
      .sort()
      .map((key) => ({ key, count: weekCounts[key], label: weekLabelFromKey(key), bestDay: weekBestDay[key] || null }));

    const bestMonth = monthSeries.reduce<{ key: string; count: number; label: string } | null>((acc, x) => {
      if (!acc || x.count > acc.count) return { key: x.key, count: x.count, label: x.label };
      return acc;
    }, null);

    const bestWeek = weekSeries.reduce<{ key: string; count: number; label: string } | null>((acc, x) => {
      if (!acc || x.count > acc.count) return { key: x.key, count: x.count, label: x.label };
      return acc;
    }, null);

    return { monthSeries, weekSeries, bestMonth, bestWeek };
  }, [analytics]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
          <p>Se încarcă datele de vizionări…</p>
        </div>
      </div>
    );
  }

  const total = analytics.totalViews || 1;
  const byPathEntries = Object.entries(analytics.byPath || {}).sort((a, b) => b[1] - a[1]);
  const topGallery = byPathEntries.filter(([p]) => p.startsWith('/galerie/') && p !== '/galerie').slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900" aria-label="Înapoi">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analize & Rapoarte</h1>
            <p className="text-sm text-gray-500">Dashboard complet de vizionări, locații și export</p>
          </div>
        </div>
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export rapoarte
        </button>
      </div>

      {/* Export panel */}
      {showExport && (
        <div className="mb-6">
          <ExportPanel onClose={() => setShowExport(false)} />
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {([
          { key: 'overview', label: 'Vizualizare generală', icon: BarChart3 },
          { key: 'pages', label: 'Pe pagini', icon: Eye },
          { key: 'locations', label: 'Locații', icon: Globe },
          { key: 'recent', label: 'Vizionări recente', icon: Clock },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: Overview ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Eye className="w-5 h-5 text-blue-600" />}
                label="Total vizionări"
                value={stats.total.toLocaleString('ro-RO')}
                sub={`${stats.uniquePages} pagini unice`}
                color="#3b82f6"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                label="Săptămâna aceasta"
                value={stats.thisWeek}
                trend={stats.weekTrend}
                sub={`săpt. trecută: ${stats.lastWeek}`}
                color="#10b981"
              />
              <StatCard
                icon={<Activity className="w-5 h-5 text-purple-600" />}
                label="Ultima lună (30z)"
                value={stats.thisMonth}
                trend={stats.monthTrend}
                sub={`luna anterioară: ${stats.lastMonth}`}
                color="#8b5cf6"
              />
              <StatCard
                icon={<Calendar className="w-5 h-5 text-rose-600" />}
                label="Ultimele 6 luni"
                value={stats.this6m}
                trend={stats.sixMonthTrend}
                sub={`6 luni anterioare: ${stats.last6m}`}
                color="#f43f5e"
              />
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Distribuție pe dispozitive</h2>
                    <p className="text-sm text-gray-500">Procente, volum și medie zilnică din totalul vizionărilor, inclusiv cele neclasificate.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total dispozitive</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.totalDeviceViews}</p>
                  </div>
                </div>

                {stats.deviceBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {stats.deviceBreakdown.map((item) => (
                      <div key={item.device} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.device}</p>
                            <p className="text-xs text-gray-500">{item.count} vizionări · medie {item.avgPerDay}/zi</p>
                          </div>
                          <span className="text-sm font-semibold text-violet-700">{item.share}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-violet-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${item.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    Nu există încă suficiente date clasificate pe dispozitive.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalii locație</h2>
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Vizionări localizate</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.knownRegionViews}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.geoCoveragePct}% din total au locație detectată.</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Țări detectate</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.uniqueCountries}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Orașe detectate</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.uniqueCities}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Regiuni valide</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.uniqueRegions}</p>
                    <p className="text-xs text-gray-500 mt-1">{stats.topRegion ? `Cea mai activă: ${stats.topRegion[0]} (${stats.topRegion[1]})` : 'Fără regiuni detectate încă'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">Vizionări fără geolocalizare</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.unknownRegionViews}</p>
                    <p className="text-xs text-gray-500 mt-1">Acestea nu au IP geolocalizabil sau provin din medii locale/proxy.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {comparativeStats && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Trend vizionări
                </h2>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  {(['week', 'month', '6months', 'year'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTrendPeriod(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all
                        ${trendPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      {p === 'week' ? 'Săpt.' : p === 'month' ? 'Lună' : p === '6months' ? '6 luni' : 'An'}
                    </button>
                  ))}
                </div>
              </div>

              <FlexTrendChart byDay={analytics.byDay} period={trendPeriod} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Cea mai bună lună</p>
                  <p className="text-sm font-semibold text-gray-900">{comparativeStats.bestMonth?.label || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">{comparativeStats.bestMonth?.count || 0} vizionări</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Cea mai bună săptămână</p>
                  <p className="text-sm font-semibold text-gray-900">{comparativeStats.bestWeek?.label || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">{comparativeStats.bestWeek?.count || 0} vizionări</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Lună curentă vs anterioară</p>
                  {(() => {
                    const ms = comparativeStats.monthSeries;
                    const last = ms[ms.length - 1];
                    const prev = ms[ms.length - 2];
                    const trend = last && prev && prev.count > 0
                      ? Math.round(((last.count - prev.count) / prev.count) * 100)
                      : (last?.count || 0) > 0 ? 100 : 0;
                    return (
                      <>
                        <p className={`text-sm font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {trend >= 0 ? '+' : ''}{trend}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{last?.count || 0} vs {prev?.count || 0} vizionări</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar heatmap */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Calendar vizionări
              </h2>
              <p className="text-xs text-gray-400 mb-3">Click pe o zi pentru detalii</p>
              <CalendarView
                byDay={analytics.byDay}
                byPathPerDay={analytics.byPathPerDay || {}}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                calendarMonth={calendarMonth}
                onChangeMonth={changeMonth}
                galleryItems={galleryItems}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Distribuție pe ore
              </h2>
              <p className="text-xs text-gray-400 mb-3">Albastru = ore de program (09–18). Hover pentru detalii.</p>
              {hourlyStats && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    Vârf: {hourlyStats.peak.hour}:00 ({hourlyStats.peak.views})
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                    Medie/oră activă: {hourlyStats.avg}
                  </span>
                </div>
              )}
              <HoursChart byHour={analytics.byHour || {}} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                Distribuție vizionări pe pagini
              </h2>
              <div className="space-y-3">
                {byPathEntries.slice(0, 8).map(([path, count], i) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={path} className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)_56px_64px] md:items-center gap-2 md:gap-3">
                      <div className="text-sm text-gray-600 truncate" title={formatPathLabel(path, galleryItems)}>
                        {formatPathLabel(path, galleryItems)}
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500 min-w-[2px]" style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: getColor(i) }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 text-right">{pct}%</span>
                      <span className="text-xs text-gray-400 text-right">({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top gallery items */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-rose-600" />
                Top elemente galerie
              </h2>
              {topGallery.length === 0 ? (
                <p className="text-gray-500 text-sm">Nicio vizionare pe elemente din galerie.</p>
              ) : (
                <div className="space-y-3">
                  {topGallery.map(([path, count], i) => {
                    const id = path.replace(/^\/galerie\//, '');
                    const item = galleryItems.find((x: any) => String(x.id) === String(id));
                    const label = item?.description || `ID: ${id}`;
                    const maxCount = Math.max(...topGallery.map(([, c]) => c), 1);
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={path} className="flex items-center gap-3">
                        <div className="w-32 sm:w-40 text-sm text-gray-700 truncate shrink-0" title={label}>{label}</div>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${pct}%`, minWidth: count ? '2rem' : 0, backgroundColor: getColor(i) }}>
                            <span className="text-xs font-medium text-white">{count}</span>
                          </div>
                        </div>
                        <a href={`${window.location.origin}/galerie/${encodeURIComponent(id)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">
                          Vezi
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Vizionări recente (rezumat)
              </h2>
              <p className="text-sm text-gray-500 mb-3">Un rezumat rapid al ultimelor accesări, direct în tab-ul de vizionări.</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(analytics.recent || []).slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 w-24 shrink-0">{formatDate(v.ts)}</span>
                    <span className="text-gray-700 truncate">{formatPathLabel(v.path, galleryItems)}</span>
                    <span className="ml-auto text-gray-400 truncate max-w-[140px]">{[v.city, v.country].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: Per Page ═══ */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Analize per pagină
          </h2>
          <p className="text-xs text-gray-400 mb-4">Selectează perioada (zi/săptămână/lună/an/tot), apoi pagina pentru trend, ore și locații</p>
          <PerPageAnalytics
            byPath={analytics.byPath}
            byPathPerDay={analytics.byPathPerDay || {}}
            recent={analytics.recent}
            total={total}
            galleryItems={galleryItems}
          />
        </div>
      )}

      {/* ═══ TAB: Locations ═══ */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Locații vizitatori
          </h2>
          <LocationsPanel
            byCountry={analytics.byCountry || {}}
            byCity={analytics.byCity || {}}
            recent={analytics.recent}
          />
        </div>
      )}

      {/* ═══ TAB: Recent views ═══ */}
      {activeTab === 'recent' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Vizionări recente
            </h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {([
                { value: 'all' as const, label: 'Toate' },
                { value: 'last_month' as const, label: 'Ultima lună' },
                { value: 'last_6_months' as const, label: '6 luni' },
                { value: 'last_year' as const, label: '1 an' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setRecentFilter(opt.value); setRecentLimit(50); }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all
                    ${recentFilter === opt.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Pagină</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Ora</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Locație</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecent.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nicio vizionare în această perioadă.</td></tr>
                ) : (
                filteredRecent.slice(0, recentLimit).map((r, i) => {
                    const d = new Date(r.ts);
                    const dateStr = d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeStr = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
                    const isGallery = r.path.startsWith('/galerie/');
                    const galleryId = isGallery ? r.path.replace(/^\/galerie\//, '') : '';
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-900 max-w-[200px] truncate">
                          {isGallery ? (
                            <a href={`${window.location.origin}/galerie/${encodeURIComponent(galleryId)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {formatPathLabel(r.path, galleryItems)}
                            </a>
                          ) : (
                            formatPathLabel(r.path, galleryItems)
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{dateStr}</td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{timeStr}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {[r.city, r.country].filter(Boolean).join(', ') || <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {filteredRecent.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Afișate {Math.min(recentLimit, filteredRecent.length)} din {filteredRecent.length} vizionări</span>
                  <button
                    onClick={() => { setShowExport(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Download className="w-3 h-3" /> Exportă
                  </button>
                </div>
                {filteredRecent.length > recentLimit && (
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={() => setRecentLimit((prev) => Math.min(prev + 100, filteredRecent.length))}
                      className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      Arată mai multe ({Math.min(100, filteredRecent.length - recentLimit)} din {filteredRecent.length - recentLimit} rămase)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
