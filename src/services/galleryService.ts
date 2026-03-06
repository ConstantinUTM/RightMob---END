import { getApiBase } from '../lib/api';

const getGalleryApiBase = () => getApiBase();

export async function getGallery() {
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/gallery`);
  if (!res.ok) throw new Error('Failed to load gallery');
  return res.json();
}

export async function getGalleryItemById(id: string) {
  if (!id) return null;
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/gallery/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to load item');
  }
  return res.json();
}

export async function uploadImage({
  filename,
  data,
  category,
  description,
  isPrimary,
  details,
  project,
  aboutDescription_ro,
  aboutDescription_en,
  aboutDescription_ru,
  token,
}: {
  filename: string;
  data: string;
  category?: string;
  description?: string;
  isPrimary?: boolean;
  details?: any[];
  project?: string;
  aboutDescription_ro?: string;
  aboutDescription_en?: string;
  aboutDescription_ru?: string;
  token?: string;
}) {
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/gallery/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token || ''
    },
    body: JSON.stringify({
      filename,
      data,
      category,
      description,
      isPrimary,
      details,
      project,
      aboutDescription_ro: aboutDescription_ro ?? '',
      aboutDescription_en: aboutDescription_en ?? '',
      aboutDescription_ru: aboutDescription_ru ?? '',
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

export async function updateGalleryItem(
  id: string,
  data: {
    description?: string;
    category?: string;
    aboutDescription?: string;
    aboutDescription_ro?: string;
    aboutDescription_en?: string;
    aboutDescription_ru?: string;
    isPrimary?: boolean;
    details?: Array<{ title: string; text: string }>;
    mainImage?: { filename: string; data: string };
    newExtraImages?: Array<{ filename: string; data: string }>;
    setMainImageUrl?: string;
    removeImageUrls?: string[];
    visible?: boolean;
    reviews?: Array<{ text: string; author?: string; date?: string; visible: boolean }>;
  },
  token?: string
) {
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/gallery/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token || ''
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Update failed');
  }
  return res.json();
}

export async function deleteImage(id: string, token?: string) {
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/gallery/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'x-admin-token': token || ''
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Delete failed');
  }

  return res.json();
}

/** Adaugă un comentariu/recenzie la un item (vizitator sau proprietar). */
export async function addReview(
  itemId: string,
  data: { text: string; author?: string; source?: 'owner' | 'visitor'; lang?: string }
) {
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/gallery/${encodeURIComponent(String(itemId))}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nu s-a putut adăuga recenzia');
  }
  return res.json();
}

/** Recenzii recente pentru homepage – cu produsul și textul. */
export async function getRecentReviews(limit = 6): Promise<Array<{
  productId: string;
  productName: string;
  productImage: string;
  review: { id?: string; text: string; author?: string; date?: string; source?: string };
}>> {
  const base = getGalleryApiBase();
  const res = await fetch(`${base}/api/reviews/recent?limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

export default { getGallery, getGalleryItemById, uploadImage, updateGalleryItem, deleteImage, addReview, getRecentReviews };
