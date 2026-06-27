'use client';

import { FormEvent, useState } from 'react';

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
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('authUser', JSON.stringify(data.user));

      window.location.href = '/quotations/new';
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas o error de conexión con la API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-slate-900">Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
              placeholder="usuario@clinica.cl"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
              placeholder="******"
            />
          </div>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}