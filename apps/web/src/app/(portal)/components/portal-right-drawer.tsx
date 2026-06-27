'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

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
  } | null;
};

type DrawerLink = {
  href: string;
  label: string;
};

type PortalRightDrawerProps = {
  onLogout: () => void;
};

export default function PortalRightDrawer({
  onLogout,
}: PortalRightDrawerProps) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [openEmission, setOpenEmission] = useState(false);
  const [openMaintainers, setOpenMaintainers] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedOpen = localStorage.getItem('portal_drawer_open');
    const savedEmission = localStorage.getItem('portal_drawer_emission_open');
    const savedMaintainers = localStorage.getItem(
      'portal_drawer_maintainers_open',
    );

    if (savedOpen !== null) {
      setOpen(savedOpen === 'true');
    }

    if (savedEmission !== null) {
      setOpenEmission(savedEmission === 'true');
    }

    if (savedMaintainers !== null) {
      setOpenMaintainers(savedMaintainers === 'true');
    }

    const rawAuthUser = localStorage.getItem('authUser');
    if (rawAuthUser) {
      try {
        const parsedAuthUser = JSON.parse(rawAuthUser) as AuthUser;
        setAuthUser(parsedAuthUser);
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('portal_drawer_open', String(open));
  }, [open]);

  useEffect(() => {
    localStorage.setItem('portal_drawer_emission_open', String(openEmission));
  }, [openEmission]);

  useEffect(() => {
    localStorage.setItem(
      'portal_drawer_maintainers_open',
      String(openMaintainers),
    );
  }, [openMaintainers]);

  const emissionLinks: DrawerLink[] = [
    { href: '/quotations', label: 'Presupuestos' },
    { href: '/quotations/new', label: 'Nueva emisión' },
  ];

  const canSeeMaintainers =
    authUser?.role === 'SUPER_ADMIN' ||
    authUser?.role === 'DIVISION_ADMIN' ||
    authUser?.role === 'MAINTAINER';

  const canManageUsers =
    authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'DIVISION_ADMIN';

  const canSeePackages = authUser?.careAccess !== 'AMBULATORY';

  const maintainerLinks: DrawerLink[] = [
    { href: '/maintainers/procedures', label: 'Prestaciones' },
    { href: '/maintainers/supplies', label: 'Insumos' },
    { href: '/maintainers/drugs', label: 'Medicamentos' },
    { href: '/maintainers/beds', label: 'Días cama' },
    { href: '/maintainers/prices', label: 'Precios' },
    { href: '/maintainers/baskets', label: 'Canastas' },
    ...(canSeePackages
      ? [{ href: '/maintainers/packages', label: 'Paquetes' }]
      : []),
    ...(canManageUsers
      ? [{ href: '/maintainers/users', label: 'Usuarios' }]
      : []),
  ];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#0F4C81] shadow-[0_12px_30px_-12px_rgba(15,76,129,0.45)] backdrop-blur transition hover:border-sky-300 hover:bg-sky-50"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
          {open ? '×' : '≡'}
        </span>
        <span>{open ? 'Cerrar menú' : 'Abrir menú'}</span>
      </button>

      <aside
        className={[
          'fixed left-0 top-0 z-40 h-screen w-[320px] border-r border-sky-100 bg-gradient-to-b from-white via-sky-50/40 to-cyan-50/50 shadow-[0_20px_60px_-25px_rgba(15,76,129,0.35)] backdrop-blur transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-full flex-col p-4 pt-20">
          <div className="mb-4 rounded-[24px] border border-sky-100 bg-white/90 px-4 py-4 shadow-[0_12px_30px_-24px_rgba(15,76,129,0.45)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
              Portal clínico
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#0F4C81]">Navegación</h2>
            <p className="mt-1 text-sm text-slate-600">
              Accesos rápidos para emisión y mantenedores.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <DrawerGroup
              title="Emisión"
              open={openEmission}
              onToggle={() => setOpenEmission((prev) => !prev)}
              links={emissionLinks}
              pathname={pathname}
            />

            {canSeeMaintainers && (
              <DrawerGroup
                title="Mantenedores"
                open={openMaintainers}
                onToggle={() => setOpenMaintainers((prev) => !prev)}
                links={maintainerLinks}
                pathname={pathname}
              />
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

function DrawerGroup({
  title,
  open,
  onToggle,
  links,
  pathname,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  links: DrawerLink[];
  pathname: string;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-sky-100 bg-white/90 shadow-[0_12px_24px_-20px_rgba(15,76,129,0.35)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#0F4C81] transition hover:bg-sky-50"
      >
        <span>{title}</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="border-t border-sky-100 bg-sky-50/50 p-3">
          <div className="space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'block rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-[#0F4C81] bg-[#0F4C81] text-white shadow-sm'
                      : 'border-sky-100 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}