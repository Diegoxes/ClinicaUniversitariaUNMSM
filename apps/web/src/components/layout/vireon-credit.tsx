const VIREON_URL = 'https://vireon-page.vercel.app/';

interface VireonCreditProps {
  className?: string;
}

export function VireonCredit({ className = '' }: VireonCreditProps) {
  return (
    <div
      className={`w-full text-center text-xs leading-relaxed ${className}`}
      aria-label="Créditos del desarrollador"
    >
      <p className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-ink-muted">
        <span>Desarrollado por</span>
        <a
          href={VIREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-marcos-red-dark transition-colors hover:text-marcos-red hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
        >
          Vireon Technologies
        </a>
        <span className="text-pearl-400" aria-hidden>
          ·
        </span>
        <a
          href={VIREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-marcos-red/80 transition-colors hover:text-marcos-red hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
        >
          Potencia digital
        </a>
      </p>
    </div>
  );
}
