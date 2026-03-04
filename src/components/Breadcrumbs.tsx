import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const CATEGORY_LABELS: Record<string, string> = {
  living: 'Cameră de zi',
  dormitor: 'Mobilă în dormitor',
  bucatarie: 'Bucătării',
  birou: 'Mobilier comercial',
  hol: 'Hol',
  baie: 'Mobilă de baie',
  copii: 'Mobilă camera copii',
  gradina: 'Grădină',
};

interface BreadcrumbsProps {
  /** Numele paginii curente (ex: titlu produs sau "Galerie") */
  currentLabel?: string;
  /** Categorie pentru nivelul "Mobilier" -> categorie (ex: dressinguri) */
  categoryId?: string;
  /** Categorii din API (id -> label); dacă lipsește, se folosește CATEGORY_LABELS */
  categoryLabels?: Record<string, string>;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentLabel, categoryId, categoryLabels }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const pathname = location.pathname;
  const labels =
    categoryLabels ||
    Object.fromEntries(
      Object.keys(CATEGORY_LABELS).map((id) => [id, t(`gallery.categories.${id}`)])
    );

  const segments: { path: string; label: string }[] = [
    { path: '/', label: t('nav.home') },
  ];

  if (pathname === '/galerie' || pathname.startsWith('/galerie') || pathname.startsWith('/produs/')) {
    segments.push({ path: '/galerie', label: t('gallery.title') });
  }

  if (categoryId && labels[categoryId]) {
    segments.push({
      path: `/galerie?category=${categoryId}`,
      label: labels[categoryId],
    });
  }

  // Nu duplica: adaugă currentLabel doar dacă e diferit de ultimul segment (ex: categorie vs titlu produs)
  const lastLabel = segments[segments.length - 1]?.label;
  if (currentLabel && currentLabel !== lastLabel) {
    segments.push({ path: pathname, label: currentLabel });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-x-1 text-sm mb-4">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={seg.path + i}>
            {i > 0 && <span className="text-neutral-400 select-none"> / </span>}
            {isLast ? (
              <span className="font-semibold text-black truncate max-w-[200px] sm:max-w-none">
                {seg.label}
              </span>
            ) : (
              <Link
                to={seg.path}
                className="text-neutral-500 hover:text-neutral-700 transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {seg.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
export { CATEGORY_LABELS };
