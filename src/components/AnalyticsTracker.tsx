import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiBase } from '../lib/api';

const VISITOR_ID_STORAGE_KEY = 'rightmob_visitor_id';

const createVisitorId = () => {
  // Keep a stable anonymous ID per browser to estimate unique visitors.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
};

const getVisitorId = () => {
  try {
    const existing = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const generated = createVisitorId();
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return null;
  }
};

const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname || '/';
    const query = location.search || '';
    if (path.startsWith('/admin')) return;
    if (isAdmin) return; // nu număra vizionările când ești logat ca admin
    const dedupePath = `${path}${query}`;
    if (lastPath.current === dedupePath) return;
    lastPath.current = dedupePath;
    const visitorId = getVisitorId();
    const referrer = typeof document !== 'undefined' ? (document.referrer || '') : '';

    fetch(`${getApiBase()}/api/analytics/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, visitorId, referrer, query }),
    }).catch(() => {});
  }, [location.pathname, location.search, isAdmin]);

  return null;
};

export default AnalyticsTracker;
