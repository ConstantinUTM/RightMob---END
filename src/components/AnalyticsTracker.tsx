import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiBase } from '../lib/api';

const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname || '/';
    if (path.startsWith('/admin')) return;
    if (isAdmin) return; // nu număra vizionările când ești logat ca admin
    if (lastPath.current === path) return;
    lastPath.current = path;

    fetch(`${getApiBase()}/api/analytics/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [location.pathname, isAdmin]);

  return null;
};

export default AnalyticsTracker;
