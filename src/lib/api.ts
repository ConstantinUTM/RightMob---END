// API base: în dev, Vite proxy (/api -> localhost:3001). În prod, Express servește totul.
export const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

// URL-uri /uploads și /images – relative, funcționează pe același origin (Express servește totul).
export const getUploadsBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};
