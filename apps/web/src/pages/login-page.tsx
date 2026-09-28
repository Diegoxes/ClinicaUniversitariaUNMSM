import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { getStoredUser } from '@/lib/api';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      navigate('/queue', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/queue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1">
      {/* Panel institucional — rojo + dorado */}
      <div className="relative hidden w-[45%] overflow-hidden bg-marcos-red lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-marcos-red-dark via-marcos-red to-marcos-red-dark" />
        <div className="absolute left-0 top-0 h-full w-1.5 bg-marcos-gold" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-marcos-gold/40 bg-white/10 backdrop-blur-sm">
            <Activity className="h-7 w-7 text-marcos-gold-light" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-marcos-gold-light">
            Universidad Nacional Mayor de San Marcos
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-pearl-50 xl:text-5xl">
            Clínica Universitaria <br />Unidad de Fisioterapia y Rehabilitación
          </h1>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-px w-12 bg-marcos-gold" />
            <div className="h-1.5 w-1.5 rotate-45 bg-marcos-gold" />
            <div className="h-px w-8 bg-marcos-gold/50" />
          </div>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-pearl-200/90">
            Sistema de gestión clínica para el seguimiento de pacientes, cola de atención y
            rehabilitación.
          </p>
        </div>
        <div className="relative z-10 border-t border-marcos-gold/20 px-12 py-6 xl:px-16">
          <p className="text-xs text-pearl-300/80">
            Ciudad Universitaria · Lima, Perú
          </p>
        </div>
      </div>

      {/* Formulario — perla con acentos rojo y dorado */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-pearl px-6 py-12">
        {/* Franja decorativa superior */}
        <div className="absolute inset-x-0 top-0 flex h-1.5">
          <div className="flex-1 bg-marcos-red" />
          <div className="w-24 bg-marcos-gold" />
          <div className="flex-1 bg-marcos-red" />
        </div>

        {/* Marca móvil */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-marcos-gold" />
            <p className="text-xs font-semibold uppercase tracking-widest text-marcos-red">
              UNMSM
            </p>
            <div className="h-px w-8 bg-marcos-gold" />
          </div>
          <h1 className="font-display text-2xl text-ink">Clínica de Fisioterapia</h1>
        </div>

        <div className="w-full max-w-md">
          {/* Tarjeta del formulario */}
          <div className="overflow-hidden rounded-2xl border border-pearl-300 bg-white shadow-lg">
            {/* Cabecera con acento rojo-dorado */}
            <div className="relative border-b border-pearl-200 bg-gradient-to-r from-marcos-red-light via-white to-marcos-gold-light px-8 py-6">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-marcos-red via-marcos-gold to-marcos-red" />
              <p className="text-xs font-semibold uppercase tracking-widest text-marcos-red">
                UNMSM · San Marcos
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                Bienvenido
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Ingrese sus credenciales para acceder
              </p>
              <div className="mt-3 flex gap-1">
                <div className="h-0.5 w-8 rounded-full bg-marcos-red" />
                <div className="h-0.5 w-4 rounded-full bg-marcos-gold" />
                <div className="h-0.5 w-2 rounded-full bg-marcos-red/40" />
              </div>
            </div>

            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Su nombre de usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div
                    className="rounded-lg border border-marcos-red/30 bg-marcos-red-light px-3 py-2 text-sm text-marcos-red"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <Button type="submit" className="h-11 w-full text-base shadow-sm" disabled={loading}>
                  {loading ? 'Ingresando…' : 'Ingresar al sistema'}
                </Button>
              </form>
            </div>

            {/* Pie con borde dorado */}
            <div className="border-t-2 border-marcos-gold/30 bg-marcos-gold-light/40 px-8 py-4">
              <p className="text-center text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-marcos-red-dark">Acceso demo</span>
                <br />
                fisio / jefatura / admin — contraseña: demo1234
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted/70">
            Clínica Universitaria · Fisioterapia y Rehabilitación
          </p>
        </div>
      </div>
    </div>
  );
}
