// API base: în dev folosește proxy Vite (/api -> localhost:3001), în prod URL complet
export const getApiBase = (): string => {
  if (import.meta.env.DEV) return '';
  return import.meta.env.VITE_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`;
};

// URL pentru imaginile încărcate (uploads) – mereu de la backend
export const getUploadsBase = (): string => {
  if (import.meta.env.DEV) return 'http://localhost:3001';
  return import.meta.env.VITE_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`;
};
