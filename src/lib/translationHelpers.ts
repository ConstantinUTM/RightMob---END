/**
 * Helper pentru traducere consistentă în toată aplicația.
 * Folosește t() din LanguageContext și normalizează chei (ex: categorii lowercase).
 */

/** Returnează eticheta tradusă pentru o categorie (id poate fi "office", "Office", "birou" etc.). */
export function getCategoryLabel(
  t: (key: string) => string,
  categoryId: string | null | undefined,
  fallbacks?: Record<string, string>
): string {
  if (!categoryId) return '';
  const key = `gallery.categories.${categoryId}`;
  const keyLower = `gallery.categories.${String(categoryId).toLowerCase()}`;
  let out = t(key);
  if (out && out !== key) return out;
  out = t(keyLower);
  if (out && out !== keyLower) return out;
  return fallbacks?.[categoryId] ?? fallbacks?.[categoryId.toLowerCase()] ?? categoryId;
}
