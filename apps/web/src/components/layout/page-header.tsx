import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-5 rounded-xl border border-pearl-300 bg-white px-5 py-4 shadow-sm">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Ruta de navegación"
          className="mb-2 flex flex-wrap items-center gap-1 text-sm text-ink-muted"
        >
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              {item.to ? (
                <Link
                  to={item.to}
                  className="rounded hover:text-marcos-red hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-ink" aria-current="page">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
    </div>
  );
}
