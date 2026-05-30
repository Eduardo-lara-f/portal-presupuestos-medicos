'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

type PortalRightDrawerProps = {
  onLogout: () => void;
};

export default function PortalRightDrawer({
  onLogout,
}: PortalRightDrawerProps) {
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [openEmission, setOpenEmission] = useState(true);
  const [openMaintainers, setOpenMaintainers] = useState(true);

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

  const emissionLinks = [
    { href: '/quotations/new', label: 'Nueva emisión' },
  ];

  const maintainerLinks = [
  { href: '/maintainers/procedures', label: 'Prestaciones' },
  { href: '/maintainers/supplies', label: 'Insumos' },
  { href: '/maintainers/drugs', label: 'Medicamentos' },
  { href: '/maintainers/beds', label: 'Días cama' },
  { href: '/maintainers/prices', label: 'Precios' },
  { href: '/maintainers/baskets', label: 'Canastas' },
  { href: '/maintainers/packages', label: 'Paquetes' },
];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed right-4 top-4 z-50 rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow"
      >
        {open ? 'Cerrar menú' : 'Abrir menú'}
      </button>

      <aside
        className={[
          'fixed right-0 top-0 z-40 h-screen w-80 border-l border-slate-200 bg-white shadow-xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-full flex-col p-4 pt-16">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Navegación</h2>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <DrawerGroup
              title="Emisión"
              open={openEmission}
              onToggle={() => setOpenEmission((prev) => !prev)}
              links={emissionLinks}
              pathname={pathname}
            />

            <DrawerGroup
              title="Mantenedores"
              open={openMaintainers}
              onToggle={() => setOpenMaintainers((prev) => !prev)}
              links={maintainerLinks}
              pathname={pathname}
            />
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 rounded border border-slate-300 px-3 py-2 text-sm"
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
  links: Array<{ href: string; label: string }>;
  pathname: string;
}) {
  return (
    <div className="rounded border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
      >
        <span>{title}</span>
        <span>{open ? '-' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-200 p-2">
          <div className="space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'block rounded border px-3 py-2 text-sm',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 text-slate-700',
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