/**
 * Serviciu de traducere – un singur request (batch) pentru toate textele.
 * Folosit în admin la galerie și produse. Traducere după contextul frazei (server).
 */
import { getApiBase } from './api';

export type TranslateLang = 'en' | 'ru';

export interface BatchItem {
  id: string;
  text: string;
  to: TranslateLang;
}

export interface BatchResult {
  id: string;
  translated: string;
}

const getBase = () => getApiBase();

/**
 * Traduce mai multe texte într-un singur request. Reduce încărcarea față de N request-uri separate.
 */
export async function translateBatch(items: BatchItem[]): Promise<Record<string, string>> {
  const filtered = items.filter((it) => it.text?.trim());
  if (filtered.length === 0) return {};

  try {
    const res = await fetch(`${getBase()}/api/translate/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: filtered }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Traducere eșuată');
    const results: BatchResult[] = data.results || [];
    const out: Record<string, string> = {};
    results.forEach((r) => {
      out[r.id] = r.translated ?? '';
    });
    return out;
  } catch (e) {
    console.error('translateBatch error:', e);
    throw e;
  }
}
