import { Product } from '../data/products';

// Proxy product APIs to gallery so legacy calls continue to work
const getGalleryApiUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:3001/api/gallery`;
};

const GALLERY_API = getGalleryApiUrl();

type GalleryItem = {
  id: string;
  filename?: string;
  url?: string;
  category?: string;
  description?: string;
  isPrimary?: boolean;
  details?: any[];
};

export type GalleryReview = { id?: string; text: string; author?: string; date?: string; visible?: boolean; source?: 'owner' | 'visitor' };

const mapGalleryToProduct = (item: GalleryItem & { reviews?: GalleryReview[] }): Product & { reviews?: GalleryReview[] } => {
  return {
    id: item.id,
    name: item.description || 'Galerie item',
    category: item.category || '',
    price: 0,
    originalPrice: undefined,
    image: item.url || '',
    images: item.url ? [item.url] : [],
    description: item.description || '',
    features: [],
    materials: [],
    dimensions: { width: 0, height: 0, depth: 0 },
    colors: [],
    colorVariants: [],
    inStock: true,
    rating: 5,
    reviews: Array.isArray((item as any).reviews) ? (item as any).reviews.filter((r: any) => r.visible !== false).length : 0,
    isNew: false,
    isBestseller: false,
    specificFeatures: {},
    reviewList: (item as any).reviews || []
  } as Product & { reviewList?: GalleryReview[] };
};

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch(GALLERY_API);
    if (!res.ok) return [];
    const data = (await res.json()) as GalleryItem[];
    return data.map(mapGalleryToProduct);
  } catch (e) {
    console.error('Error fetching gallery as products', e);
    return [];
  }
};

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const items = await getAllProducts();
    const found = items.find(p => p.id === id);
    return found || null;
  } catch (e) {
    console.error('Error getting product by id from gallery', e);
    return null;
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const all = await getAllProducts();
  return all.filter(p => p.category === category);
};

export const uploadProductImage = async (file: File, _productId: number, _index: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Keep add/update/delete as no-ops or simple proxies to gallery admin if needed
export const addProduct = async (_productData: Omit<Product, 'id'>): Promise<string> => {
  throw new Error('Add product is disabled. Use Gallery admin.');
};

export const updateProduct = async (_id: number, _productData: Partial<Product>): Promise<void> => {
  throw new Error('Update product is disabled. Use Gallery admin.');
};

export const deleteProduct = async (_id: number): Promise<void> => {
  throw new Error('Delete product is disabled. Use Gallery admin.');
};

export const deleteProductImage = async (_imageUrl: string): Promise<void> => {
  return Promise.resolve();
};
