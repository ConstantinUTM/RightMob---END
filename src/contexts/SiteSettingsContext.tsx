import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiBase } from '../lib/api';

interface SiteFeatures {
  tryInMyRoomEnabled: boolean;
}

interface SiteSettingsContextType {
  features: SiteFeatures;
  loading: boolean;
  refreshFeatures: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  features: {
    tryInMyRoomEnabled: false,
  },
  loading: true,
  refreshFeatures: async () => {},
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<SiteFeatures>({
    tryInMyRoomEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  const loadFeatures = async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/site/features`);
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      }
    } catch (error) {
      console.error('Eroare la încărcarea setărilor site:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const refreshFeatures = async () => {
    await loadFeatures();
  };

  const value: SiteSettingsContextType = {
    features,
    loading,
    refreshFeatures,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
