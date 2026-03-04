/**
 * Imagini pentru cardurile de categorii de pe pagina principală.
 * Poți schimba căile pentru a seta ce poză apare la fiecare categorie.
 *
 * Formate acceptate:
 * - /uploads/... → se completează automat cu URL-ul serverului (imagini din galerie)
 * - /images/...  → din folderul public (ex: /images/categories/living.jpg)
 *
 * Imagini disponibile în uploads (din gallery.json):
 * - living: /uploads/living/liing-2026/1771536299102-IMG_9859.JPG
 * - baie:   /uploads/1771368519323-Photo__13_of_38_.jpg, ...Photo__14, 15, 16
 * - bucatarie: /uploads/1771366598610-2026-02-16_20.35.51.jpg, ...8611, 8613, etc.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  living: '/images/categories/living.jpg',
  dormitor: '/images/categories/bedroom.jpg',
  bucatarie: '/uploads/1771366598610-2026-02-16_20.35.51.jpg',
};

export const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  living: '/images/categories/living.jpg',
  dormitor: '/images/categories/bedroom.jpg',
  bucatarie: '/images/about/about-3.jpg',
};
