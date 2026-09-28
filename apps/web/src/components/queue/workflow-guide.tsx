import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const steps = [
  { number: 1, text: 'Busque y agregue pacientes a la cola', badge: null },
  {
    number: 2,
    text: 'Pulse',
    action: 'Iniciar atención',
    badge: 'En espera',
    badgeClass: 'bg-marcos-red-light text-marcos-red',
  },
  {
    number: 3,
    text: 'Registre la',
    action: 'Sesión',
    badge: 'En atención',
    badgeClass: 'bg-marcos-red text-white',
  },
  {
    number: 4,
    text: 'Marque',
    action: 'Finalizar atención',
    badge: 'Atendido',
    badgeClass: 'bg-pearl-200 text-ink-muted',
  },
];

export function WorkflowGuide() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-marcos-red/20 bg-marcos-red-light">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-marcos-red-dark">
          <HelpCircle className="h-4 w-4 text-marcos-red" aria-hidden />
          ¿Cómo funciona la cola del día?
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
        )}
      </button>
      {!collapsed && (
        <ol className="space-y-2 border-t border-marcos-red/15 bg-white px-4 pb-4 pt-3">
          {steps.map((step) => (
            <li key={step.number} className="flex items-start gap-3 text-sm text-ink-muted">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marcos-red text-xs font-bold text-white">
                {step.number}
              </span>
              <span className="pt-0.5">
                {step.text}
                {step.action && (
                  <>
                    {' '}
                    <strong className="text-ink">{step.action}</strong>
                  </>
                )}
                {step.badge && (
                  <>
                    {' '}
                    cuando el estado sea{' '}
                    <Badge className={step.badgeClass}>{step.badge}</Badge>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
