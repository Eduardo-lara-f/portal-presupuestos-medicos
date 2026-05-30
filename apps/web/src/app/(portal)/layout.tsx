'use client';

import React, { useEffect, useState } from 'react';
import PortalRightDrawer from './components/portal-right-drawer';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          if (!cancelled) {
            setAuthStatus('unauthenticated');
          }
          window.location.replace('/login');
          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('authUser');

          if (!cancelled) {
            setAuthStatus('unauthenticated');
          }

          window.location.replace('/login');
          return;
        }

        if (!cancelled) {
          setAuthStatus('authenticated');
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');

        if (!cancelled) {
          setAuthStatus('unauthenticated');
        }

        window.location.replace('/login');
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    window.location.replace('/login');
  }

  if (authStatus === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm text-slate-600">Validando sesión...</div>
      </main>
    );
  }

  if (authStatus !== 'authenticated') {
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="min-h-screen">{children}</section>
      <PortalRightDrawer onLogout={handleLogout} />
    </main>
  );
}