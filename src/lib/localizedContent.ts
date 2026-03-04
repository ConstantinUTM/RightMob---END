/**
 * Helper pentru textul introdus în admin – afișat pe toată pagina în limba selectată.
 * Folosește câmpurile _ro, _en, _ru și limba din context.
 */
export type AppLanguage = 'ro' | 'en' | 'ru';

/**
 * Returnează valoarea localizată pentru un câmp (ex: aboutDescription).
 * Caută item[fieldBase_ro], item[fieldBase_en], item[fieldBase_ru] după limbă.
 */
export function getLocalizedField<T extends Record<string, unknown>>(
  item: T | null | undefined,
  fieldBase: string,
  lang: AppLanguage
): string {
  if (!item || typeof item !== 'object') return '';
  const key = `${fieldBase}_${lang}` as keyof T;
  const val = item[key];
  if (typeof val === 'string' && val.trim()) return val.trim();
  const fallRo = item[`${fieldBase}_ro` as keyof T];
  if (typeof fallRo === 'string' && fallRo.trim()) return fallRo.trim();
  const fallBase = item[fieldBase as keyof T];
  if (typeof fallBase === 'string' && fallBase.trim()) return fallBase.trim();
  return '';
}
