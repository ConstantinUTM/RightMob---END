import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getApiBase } from '../lib/api';

type Language = 'ro' | 'en' | 'ru';

type SiteContent = {
  translations: Record<Language, Record<string, string>>;
  images: Record<string, string>;
};

interface SiteContentContextType {
  content: SiteContent;
  loading: boolean;
  refresh: () => Promise<void>;
  getTextOverride: (lang: Language, key: string) => string | undefined;
  getImageOverride: (key: string, fallback?: string) => string;
}

const defaultContent: SiteContent = {
  translations: { ro: {}, en: {}, ru: {} },
  images: {},
};

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/site-content`);
      if (!res.ok) throw new Error('Failed loading site content');
      const data = await res.json();
      const merged: SiteContent = {
        translations: {
          ro: { ...(data?.translations?.ro || {}) },
          en: { ...(data?.translations?.en || {}) },
          ru: { ...(data?.translations?.ru || {}) },
        },
        images: { ...(data?.images || {}) },
      };
      setContent(merged);
    } catch {
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<SiteContentContextType>(() => ({
    content,
    loading,
    refresh,
    getTextOverride: (lang: Language, key: string) => {
      const v = content.translations?.[lang]?.[key];
      if (typeof v === 'string' && v.trim()) return v;
      return undefined;
    },
    getImageOverride: (key: string, fallback = '') => {
      const v = content.images?.[key];
      if (typeof v === 'string' && v.trim()) return v;
      return fallback;
    },
  }), [content, loading]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
};

export const useSiteContent = (): SiteContentContextType => {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
};
