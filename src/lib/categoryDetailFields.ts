/**
 * Câmpuri prestabilite pentru secțiunea "Despre proiect", per categorie.
 * La adăugare/editare se afișează aceste etichete cu câmp de completat.
 * Pe site apar doar rândurile completate.
 */
export const CATEGORY_DETAIL_FIELDS: Record<string, string[]> = {
  bucatarie: [
    'Țara de origine',
    'Producător',
    'Tip',
    'Formă bucătărie',
    'Material fațadă',
    'Material carcasă',
    'Culoare',
    'Sistem deschidere',
    'Tip sertare',
    'Balamale',
    'Cornisă',
    'Mânere',
    'Blat',
    'Glisiere',
    'Termen de fabricare',
  ],
  birou: [
    'Producător',
    'Proiect',
    'Materiale fațadă',
    'Tip sertare / glisiere',
    'Material carcasă',
    'Balamale',
    'Mânere',
    'Produs',
    'Dimensiuni',
    'Termen de fabricare',
  ],
  living: [
    'Producător',
    'Tip',
    'Material',
    'Dimensiuni',
    'Termen de fabricare',
  ],
  dormitor: [
    'Producător',
    'Tip',
    'Material',
    'Dimensiuni',
    'Termen de fabricare',
  ],
  hol: [
    'Producător',
    'Tip',
    'Material',
    'Dimensiuni',
  ],
  baie: [
    'Producător',
    'Tip',
    'Material',
    'Dimensiuni',
    'Termen de fabricare',
  ],
  copii: [
    'Producător',
    'Tip',
    'Material',
    'Dimensiuni',
  ],
  gradina: [
    'Producător',
    'Tip',
    'Material',
    'Dimensiuni',
  ],
};

const DEFAULT_FIELDS = ['Producător', 'Tip', 'Material', 'Dimensiuni', 'Termen de fabricare'];

/** Toate câmpurile unice din toate categoriile – utilizatorul alege singur ce completează */
export function getAllDetailFields(): string[] {
  const result: string[] = [];
  Object.values(CATEGORY_DETAIL_FIELDS).forEach((arr) => {
    arr.forEach((label) => {
      if (!result.includes(label)) result.push(label);
    });
  });
  DEFAULT_FIELDS.forEach((label) => {
    if (!result.includes(label)) result.push(label);
  });
  return result.length ? result : DEFAULT_FIELDS;
}

export function getDetailFieldsForCategory(categoryId: string): string[] {
  if (!categoryId) return DEFAULT_FIELDS;
  return CATEGORY_DETAIL_FIELDS[categoryId] ?? DEFAULT_FIELDS;
}

/** Construiește array details din map label -> value (doar cele completate) */
export function detailsFromMap(
  fields: string[],
  values: Record<string, string>
): Array<{ title: string; text: string }> {
  return fields
    .map((label) => ({ title: label, text: (values[label] ?? '').trim() }))
    .filter((d) => d.text !== '');
}

/** Map din array details (titlu, text) pentru afișare în form */
export function detailsToMap(
  details: Array<{ title: string; text: string }>
): Record<string, string> {
  const map: Record<string, string> = {};
  details.forEach((d) => {
    if (d.title) map[d.title] = d.text ?? '';
  });
  return map;
}

export type DetailRow = { title: string; text: string; text_en?: string; text_ru?: string; images?: unknown[] };

/** Map din array details (titlu, text, text_en, text_ru) → trei mape pentru form RO/EN/RU */
export function detailsToMapMultilingual(
  details: Array<{ title?: string; text?: string; text_en?: string; text_ru?: string; images?: unknown[] }>
): { ro: Record<string, string>; en: Record<string, string>; ru: Record<string, string> } {
  const ro: Record<string, string> = {};
  const en: Record<string, string> = {};
  const ru: Record<string, string> = {};
  details.forEach((d) => {
    const title = (d.title ?? '').trim();
    if (!title) return;
    ro[title] = (d.text ?? '').trim();
    en[title] = (d.text_en ?? '').trim();
    ru[title] = (d.text_ru ?? '').trim();
  });
  return { ro, en, ru };
}

/** Array details din trei mape (RO/EN/RU); include doar rândurile cu text RO completat */
export function detailsFromMapMultilingual(
  fields: string[],
  valuesRo: Record<string, string>,
  valuesEn: Record<string, string>,
  valuesRu: Record<string, string>
): DetailRow[] {
  return fields
    .map((label) => ({
      title: label,
      text: (valuesRo[label] ?? '').trim(),
      text_en: (valuesEn[label] ?? '').trim() || undefined,
      text_ru: (valuesRu[label] ?? '').trim() || undefined,
    }))
    .filter((d) => d.text !== '')
    .map(({ title, text, text_en, text_ru }) => ({ title, text, ...(text_en ? { text_en } : {}), ...(text_ru ? { text_ru } : {}) } as DetailRow));
}
