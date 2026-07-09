'use client';

import React, { useEffect, useMemo, useState } from 'react';

type UserRole =
  | 'SUPER_ADMIN'
  | 'DIVISION_ADMIN'
  | 'BUDGET_HEAD'
  | 'EXECUTIVE'
  | 'MAINTAINER'
  | 'VIEWER';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  divisionId: number | null;
  division?: {
    id: number;
    name: string;
    code: string;
  } | null;
};

type PackageTypeFilter = 'ALL' | 'PAD' | 'CONVENTIONAL';

type ReportSummary = {
  filters: {
    divisionId: number;
    fromDate: string | null;
    toDate: string | null;
    executiveId: number | null;
    packageType: PackageTypeFilter;
  };
  totals: {
    totalQuotes: number;
    createdQuotes: number;
    issuedQuotes: number;
    finalizedQuotes: number;
    sentQuotes: number;
    draftQuotes: number;
    unfinishedQuotes: number;
    packageItems: number;
    basketItems: number;
    totalAmount: number;
    totalCreatedAmount: number;
    totalIssuedAmount: number;
    averageIssuedAmount: number;
    completionRate: number;
  };
  executiveBreakdown: Array<{
    executiveId: number | null;
    executiveName: string;
    executiveEmail: string | null;
    totalQuotes: number;
    totalAmount: number;
  }>;
  packageBreakdown: Array<{
    packageId: number | null;
    packageName: string;
    packageType: string | null;
    padCoverageMode: string | null;
    totalItems: number;
    totalAmount: number;
  }>;
  recentQuotes: Array<{
    id: number;
    status: string;
    total: string | number;
    createdAt: string;
    createdByUserId: number | null;
    patient: {
      firstName: string;
      lastName: string;
    } | null;
    createdByUser: {
      id: number;
      name: string;
      email: string;
    } | null;
  }>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

const ALLOWED_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'DIVISION_ADMIN',
  'BUDGET_HEAD',
];

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CL');

function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0));
}

function formatNumber(value: number | string | null | undefined) {
  return numberFormatter.format(Number(value ?? 0));
}

function formatPercent(value: number | string | null | undefined) {
  return `${numberFormatter.format(Number(value ?? 0) * 100)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Borrador',
    FINALIZED: 'Finalizado',
    SENT: 'Enviado',
    CANCELLED: 'Cancelado',
  };

  return labels[status] ?? status;
}

export default function ReportsPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [executiveId, setExecutiveId] = useState('');
  const [packageType, setPackageType] = useState<PackageTypeFilter>('ALL');

  const canSeeReports = authUser ? ALLOWED_ROLES.includes(authUser.role) : false;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (fromDate) {
      params.set('fromDate', fromDate);
    }

    if (toDate) {
      params.set('toDate', toDate);
    }

    if (executiveId) {
      params.set('executiveId', executiveId);
    }

    if (packageType !== 'ALL') {
      params.set('packageType', packageType);
    }

    return params.toString();
  }, [fromDate, toDate, executiveId, packageType]);

  useEffect(() => {
    const rawAuthUser = localStorage.getItem('authUser');

    if (!rawAuthUser) {
      setLoading(false);
      setError('No se encontró el usuario autenticado.');
      return;
    }

    try {
      const parsedAuthUser = JSON.parse(rawAuthUser) as AuthUser;
      setAuthUser(parsedAuthUser);
    } catch (parseError) {
      console.error(parseError);
      setLoading(false);
      setError('No se pudo leer la sesión del usuario.');
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    if (!ALLOWED_ROLES.includes(authUser.role)) {
      setLoading(false);
      setError('No tienes permiso para ver reportería.');
      return;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      setLoading(false);
      setError('No se encontró el token de sesión.');
      return;
    }

    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/reports/summary${queryString ? `?${queryString}` : ''}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.message ?? 'No se pudo cargar la reportería.',
          );
        }

        const data = (await response.json()) as ReportSummary;
        setSummary(data);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar la reportería.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadSummary();

    return () => controller.abort();
  }, [authUser, queryString]);

  const executives = summary?.executiveBreakdown ?? [];

  const createdQuotes = summary?.totals.createdQuotes ?? summary?.totals.totalQuotes ?? 0;
  const issuedQuotes = summary?.totals.issuedQuotes ?? 0;
  const unfinishedQuotes = summary?.totals.unfinishedQuotes ?? summary?.totals.draftQuotes ?? 0;
  const totalIssuedAmount = summary?.totals.totalIssuedAmount ?? 0;
  const averageIssuedAmount = summary?.totals.averageIssuedAmount ?? 0;
  const completionRate = summary?.totals.completionRate ?? 0;

  if (!loading && authUser && !canSeeReports) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-500">
            Acceso restringido
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            No tienes permiso para ver reportería
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Esta sección está disponible sólo para jefes de presupuesto y
            administradores.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#0F4C81] via-sky-700 to-cyan-600 px-6 py-7 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
              Reportería
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Resumen general</h1>
                <p className="mt-2 max-w-2xl text-sm text-sky-100">
                  Indicadores de presupuestos, paquetes, canastas y montos
                  emitidos para la división activa.
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">
                  División
                </p>
                <p className="mt-1 font-semibold">
                  {authUser?.division?.name ?? 'División actual'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-sky-100 bg-sky-50/60 px-6 py-5 md:grid-cols-4">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Desde</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0F4C81] focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Hasta</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0F4C81] focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Ejecutivo</span>
              <select
                value={executiveId}
                onChange={(event) => setExecutiveId(event.target.value)}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0F4C81] focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Todos</option>
                {executives.map((executive) => (
                  <option
                    key={executive.executiveId ?? 'without-executive'}
                    value={executive.executiveId ?? ''}
                  >
                    {executive.executiveName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Tipo de paquete</span>
              <select
                value={packageType}
                onChange={(event) =>
                  setPackageType(event.target.value as PackageTypeFilter)
                }
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0F4C81] focus:ring-2 focus:ring-sky-100"
              >
                <option value="ALL">Todos</option>
                <option value="PAD">PAD</option>
                <option value="CONVENTIONAL">No PAD</option>
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-sky-100 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
            Cargando reportería...
          </div>
        )}

        {summary && !loading && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Presupuestos creados"
                value={formatNumber(createdQuotes)}
                detail={`${formatNumber(issuedQuotes)} emitidos · ${formatNumber(unfinishedQuotes)} sin finalizar`}
              />
              <MetricCard
                title="Valor total emitido"
                value={formatCurrency(totalIssuedAmount)}
                detail="Suma sólo presupuestos finalizados o enviados"
              />
              <MetricCard
                title="Ticket promedio emitido"
                value={formatCurrency(averageIssuedAmount)}
                detail="Promedio sobre presupuestos finalizados o enviados"
              />
              <MetricCard
                title="Tasa de finalización"
                value={formatPercent(completionRate)}
                detail="Emitidos sobre presupuestos creados"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Paquetes incluidos"
                value={formatNumber(summary.totals.packageItems)}
                detail="Items de tipo paquete incluidos en presupuestos"
              />
              <MetricCard
                title="Canastas incluidas"
                value={formatNumber(summary.totals.basketItems)}
                detail="Items de tipo canasta incluidos en presupuestos"
              />
              <MetricCard
                title="Finalizados"
                value={formatNumber(summary.totals.finalizedQuotes)}
                detail="Presupuestos cerrados correctamente"
              />
              <MetricCard
                title="Enviados"
                value={formatNumber(summary.totals.sentQuotes)}
                detail="Presupuestos emitidos y enviados al paciente"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ReportPanel title="Desglose por ejecutivo">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Ejecutivo</th>
                        <th className="px-4 py-3 text-right">Presupuestos</th>
                        <th className="px-4 py-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.executiveBreakdown.map((executive) => (
                        <tr key={executive.executiveId ?? 'without-executive'}>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">
                              {executive.executiveName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {executive.executiveEmail ?? 'Sin correo'}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right font-semibold">
                            {formatNumber(executive.totalQuotes)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold">
                            {formatCurrency(executive.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReportPanel>

              <ReportPanel title="Desglose por paquete">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Paquete</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.packageBreakdown.map((medicalPackage) => (
                        <tr
                          key={
                            medicalPackage.packageId ??
                            medicalPackage.packageName
                          }
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {medicalPackage.packageName}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {medicalPackage.packageType === 'PAD'
                              ? 'PAD'
                              : 'No PAD'}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold">
                            {formatNumber(medicalPackage.totalItems)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold">
                            {formatCurrency(medicalPackage.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReportPanel>
            </section>

            <ReportPanel title="Últimos presupuestos emitidos">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-4 py-3">Ejecutivo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.recentQuotes.map((quote) => (
                      <tr key={quote.id}>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          #{quote.id}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {quote.patient
                            ? `${quote.patient.firstName} ${quote.patient.lastName}`
                            : 'Sin paciente'}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {quote.createdByUser?.name ?? 'Sin ejecutivo'}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-[#0F4C81]">
                            {getStatusLabel(quote.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(quote.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {formatCurrency(quote.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportPanel>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[26px] border border-sky-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold text-[#0F4C81]">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function ReportPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-sky-100 bg-white shadow-sm">
      <div className="border-b border-sky-100 px-5 py-4">
        <h2 className="text-lg font-bold text-[#0F4C81]">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}