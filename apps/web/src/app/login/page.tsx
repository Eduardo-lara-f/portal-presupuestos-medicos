'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type LoginResponse = {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: boolean;
    divisionId: number | null;
    division: {
      id: number;
      name: string;
      code: string;
      corporationId: number | null;
      brandPrimaryColor: string;
      brandSecondaryColor: string;
      brandAccentColor: string;
      brandLogoKey: string;
    } | null;
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  function persistAuthSession(data: LoginResponse) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    window.location.href = '/quotations/new';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo iniciar sesión.');
      }

      const data: LoginResponse = await response.json();

      persistAuthSession(data);
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas o error de conexión con la API.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/auth/google/url`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo iniciar sesión con Google.');
      }

      const data: { url: string } = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError('No se pudo iniciar sesión con Google.');
      setGoogleLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      return;
    }

    async function completeGoogleLogin() {
      try {
        setGoogleLoading(true);
        setError('');

        const response = await fetch(`${API_URL}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'No se pudo completar el inicio con Google.');
        }

        const data: LoginResponse = await response.json();
        persistAuthSession(data);
      } catch (err) {
        console.error(err);
        window.history.replaceState({}, document.title, '/login');
        setError('Tu cuenta de Google no está habilitada para ingresar al portal.');
        setGoogleLoading(false);
      }
    }

    completeGoogleLogin();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden bg-[#0F4C81] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(44,142,214,0.35),_transparent_34%)]" />
          <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative flex min-h-screen flex-col justify-between p-14 text-white">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                Portal de Presupuestos Médicos
              </div>

              <div className="mt-16 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">
                  Presupuestos Médicos
                </p>
                <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight xl:text-6xl">
                  Crea presupuestos médicos completos en un solo flujo.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-blue-50/90">
                  Selecciona paciente, cobertura y modalidad; agrega prestaciones, insumos,
                  medicamentos, días cama y honorarios; emite el PDF final para el paciente.
                </p>
              </div>
            </div>

            <div className="grid max-w-2xl gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-3xl font-black">1</div>
                <p className="mt-2 text-sm leading-6 text-blue-50/85">Cotización con detalle por sección y valores consolidados.</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-3xl font-black">2</div>
                <p className="mt-2 text-sm leading-6 text-blue-50/85">Soporte para paquetes, canastas y reglas de cálculo por sección.</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-3xl font-black">3</div>
                <p className="mt-2 text-sm leading-6 text-blue-50/85">Precios configurados por división, cobertura, isapre o particular.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-[#0F4C81] shadow-sm">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Portal de Presupuestos Médicos
              </div>
              <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
                Presupuestos Médicos
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ingresa para crear cotizaciones, revisar precios y emitir presupuestos en PDF.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,76,129,0.12)]">
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-[#0F4C81] px-4 py-3 text-white shadow-lg shadow-blue-900/20">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-black">
                    MT
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-black">MedTech</p>
                    <p className="text-xs font-medium text-blue-100">Powered By</p>
                  </div>
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                  Iniciar sesión
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Usa tu correo y contraseña asignados para operar en tu división.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Correo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2C8ED6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="usuario@clinica.cl"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2C8ED6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="******"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full rounded-2xl bg-[#0F4C81] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Ingresando...' : 'Ingresar con correo'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  o
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-xs font-black text-[#0F4C81]">
                  G
                </span>
                {googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Acceso restringido a usuarios habilitados por división.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}