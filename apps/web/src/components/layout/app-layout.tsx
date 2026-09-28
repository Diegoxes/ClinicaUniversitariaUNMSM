import { useAuth } from '@/context/auth-context';
import { GlobalRole } from '@clinica/shared';
import { BarChart3, ListOrdered, Settings, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ToastViewport } from '../ui/toast';

const navItems = [
  { to: '/queue', label: 'Cola del día', icon: ListOrdered },
  { to: '/patients', label: 'Pacientes', icon: Users },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  {
    to: '/admin',
    label: 'Administración',
    icon: Settings,
    adminOnly: true,
  },
];

export function AppLayout() {
  const { user, logout, unitId } = useAuth();
  const navigate = useNavigate();
  const unit = user?.units.find((u) => u.id === unitId);
  const isAdmin = user?.globalRole === GlobalRole.ADMIN;

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b-2 border-marcos-gold/40 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 rounded-full bg-marcos-red" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-marcos-red">
                UNMSM
              </p>
              <h1 className="text-base font-semibold text-ink md:text-lg">
                {unit?.name ?? 'Fisioterapia'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{user?.fullName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <nav
        className="border-b border-pearl-300 bg-white"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-2 md:px-6">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to !== '/patients'}
                title={item.label}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red',
                    isActive
                      ? 'bg-marcos-red text-white shadow-sm'
                      : 'border border-transparent text-ink hover:border-marcos-red/20 hover:bg-marcos-red-light hover:text-marcos-red',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
        <Outlet />
      </main>

      <ToastViewport />
    </div>
  );
}
