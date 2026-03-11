// API base: în dev, Vite proxy (/api -> localhost:3001). În prod, Express servește totul.
export const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

// URL-uri /uploads și /images – mereu relative: în dev Vite proxy la 3001, în prod același server.
// Astfel imaginile nu sunt cross-origin și nu sunt blocate de CORS/Helmet.
export const getUploadsBase = (): string => {
  return '';
};
