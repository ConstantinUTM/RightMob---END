// Același API base ca galleryService ca să meargă și fără proxy Vite
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
};

export interface Category {
  id: string;
  label: string;
}

export async function getCategories(): Promise<Category[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/categories`);
  if (!res.ok) throw new Error('Nu s-au putut încărca categoriile');
  return res.json();
}

export async function addCategory(id: string, label: string, token: string): Promise<Category> {
  const res = await fetch(`${getApiBaseUrl()}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ id, label }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Eroare la adăugare');
  }
  return res.json();
}

export async function updateCategory(id: string, label: string, token: string): Promise<Category> {
  const res = await fetch(`${getApiBaseUrl()}/api/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Eroare la actualizare');
  }
  return res.json();
}

export async function deleteCategory(id: string, token: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': token },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Eroare la ștergere');
  }
}

export default {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
