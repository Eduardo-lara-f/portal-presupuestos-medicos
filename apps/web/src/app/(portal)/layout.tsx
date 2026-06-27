'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PortalRightDrawer from './components/portal-right-drawer';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type UserRole =
  | 'SUPER_ADMIN'
  | 'DIVISION_ADMIN'
  | 'BUDGET_HEAD'
  | 'EXECUTIVE'
  | 'MAINTAINER'
  | 'VIEWER';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  careAccess: CareType;
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

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

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

        const nextAuthUser: AuthUser = await response.json();
        localStorage.setItem('authUser', JSON.stringify(nextAuthUser));

        if (!cancelled) {
          setAuthUser(nextAuthUser);
          setAuthStatus('authenticated');
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');

        if (!cancelled) {
          setAuthUser(null);
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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !authUser) {
      return;
    }

    const canAccessMaintainers =
      authUser.role === 'SUPER_ADMIN' ||
      authUser.role === 'DIVISION_ADMIN' ||
      authUser.role === 'MAINTAINER';

    if (pathname.startsWith('/maintainers') && !canAccessMaintainers) {
      window.location.replace('/quotations/new');
      return;
    }

    if (
      authUser.careAccess === 'AMBULATORY' &&
      pathname.toLowerCase().includes('/surgical')
    ) {
      window.location.replace('/quotations/new');
      return;
    }

    if (
      authUser.careAccess === 'SURGICAL' &&
      pathname.toLowerCase().includes('/ambulatory')
    ) {
      window.location.replace('/quotations/new');
    }
  }, [authStatus, authUser, pathname]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    window.location.replace('/login');
  }

  const divisionBrand = authUser?.division;

  const portalBrandStyle = {
    '--brand-primary': divisionBrand?.brandPrimaryColor ?? '#0F4C81',
    '--brand-secondary': divisionBrand?.brandSecondaryColor ?? '#2C8ED6',
    '--brand-accent': divisionBrand?.brandAccentColor ?? '#22C55E',
    '--brand-primary-soft': `${divisionBrand?.brandPrimaryColor ?? '#0F4C81'}14`,
    '--brand-secondary-soft': `${divisionBrand?.brandSecondaryColor ?? '#2C8ED6'}18`,
    '--brand-accent-soft': `${divisionBrand?.brandAccentColor ?? '#22C55E'}18`,
  } as React.CSSProperties;

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
    <main className="min-h-screen bg-white" style={portalBrandStyle}>
      <section className="min-h-screen">{children}</section>
      <PortalRightDrawer onLogout={handleLogout} />
    </main>
  );
}