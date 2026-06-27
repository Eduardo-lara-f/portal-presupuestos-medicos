'use client';

import React, { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type QuoteStatus = 'DRAFT' | 'FINALIZED' | 'SENT';

type QuotePatient = {
  id: number;
  rut: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
};

type QuoteDivision = {
  id: number;
  name: string;
  code: string;
};

type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  totalPrice: string | number;
  deletedAt?: string | null;
};

type QuoteListItem = {
  id: number;
  status: QuoteStatus;
  careType: 'AMBULATORY' | 'SURGICAL' | 'BOTH';
  subtotal: string | number;
  discountTotal: string | number;
  total: string | number;
  updatedAt: string;
  createdAt: string;
  patient: QuotePatient;
  division: QuoteDivision;
  items: QuoteItem[];
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: boolean;
  divisionId?: number | null;
  division?: {
    id: number;
    name: string;
    code?: string;
  } | null;
};

type AlertState = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

type TabKey = 'OPEN' | 'CLOSED';

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatPatientName(patient: QuotePatient) {
  return [patient.firstName, patient.lastName, patient.middleName]
    .filter(Boolean)
    .join(' ');
}

export default function QuotationsPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('OPEN');
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    try {
      const rawAuthUser = localStorage.getItem('authUser');
      if (!rawAuthUser) return;

      const parsedAuthUser = JSON.parse(rawAuthUser) as AuthUser;
      setAuthUser(parsedAuthUser);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!authUser?.divisionId) return;
    void loadQuotes(activeTab, authUser.divisionId);
  }, [authUser?.divisionId, activeTab]);

  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  async function loadQuotes(tab: TabKey, divisionId: number) {
    try {
      setLoading(true);
      setAlert(null);

      const params = new URLSearchParams({
        divisionId: String(divisionId),
      });

      if (tab === 'OPEN') {
        params.set('status', 'DRAFT');
      } else {
        params.set('status', 'FINALIZED');
      }

      const response = await fetch(`${API_URL}/quotes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los presupuestos.');
      }

      const data: QuoteListItem[] = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error(error);
      setQuotes([]);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar los presupuestos.',
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return quotes;

    return quotes.filter((quote) => {
      const patientName = formatPatientName(quote.patient).toLowerCase();
      const rut = (quote.patient.rut ?? '').toLowerCase();
      const divisionName = (quote.division?.name ?? '').toLowerCase();
      const quoteId = String(quote.id);

      return (
        patientName.includes(normalizedSearch) ||
        rut.includes(normalizedSearch) ||
        divisionName.includes(normalizedSearch) ||
        quoteId.includes(normalizedSearch)
      );
    });
  }, [quotes, search]);

  const pageTitle =
    activeTab === 'OPEN'
      ? 'Presupuestos sin finalizar'
      : 'Presupuestos finalizados';

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <section className="mb-6 overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_15px_50px_-20px_rgba(30,136,229,0.35)]">
          <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-gradient-to-br from-[#0F4C81] via-[#1769aa] to-[#51b4e8] px-6 py-8 text-white md:px-8">
              <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-50">
                Seguimiento de presupuestos
              </div>

              <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
                {pageTitle}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-sky-50/90 md:text-base">
                Revise el estado de las cotizaciones generadas por división y
                consulte su información principal antes de continuar con la
                gestión.
              </p>
            </div>

            <div className="flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 md:p-8">
              <div className="w-full rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_15px_40px_-25px_rgba(15,76,129,0.35)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
                  División activa
                </div>
                <div className="mt-2 text-lg font-semibold text-[#0F4C81]">
                  {authUser?.division?.name ?? 'Sin división asignada'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {authUser?.division?.code ?? '-'}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      Abiertos
                    </div>
                    <div className="mt-1 text-xl font-bold text-[#0F4C81]">
                      {activeTab === 'OPEN' ? filteredQuotes.length : '-'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      Cerrados
                    </div>
                    <div className="mt-1 text-xl font-bold text-[#0F4C81]">
                      {activeTab === 'CLOSED' ? filteredQuotes.length : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {alert && (
          <div
            className={[
              'mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm',
              alert.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : alert.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-sky-200 bg-sky-50 text-sky-700',
            ].join(' ')}
          >
            {alert.message}
          </div>
        )}

        <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_15px_50px_-20px_rgba(15,76,129,0.22)]">
          <div className="border-b border-sky-100 bg-sky-50 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                  Consulta
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#0F4C81]">
                  Listado de presupuestos
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('OPEN')}
                  className={[
                    'rounded-2xl px-4 py-2 text-sm font-medium transition',
                    activeTab === 'OPEN'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  Sin finalizar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('CLOSED')}
                  className={[
                    'rounded-2xl px-4 py-2 text-sm font-medium transition',
                    activeTab === 'CLOSED'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  Finalizados
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por ID, RUT, paciente o división"
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />

              <button
                type="button"
                onClick={() => {
                  if (authUser?.divisionId) {
                    void loadQuotes(activeTab, authUser.divisionId);
                  }
                }}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                Cargando presupuestos...
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                No hay presupuestos para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]"
                  >
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                            Presupuesto #{quote.id}
                          </span>
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                              quote.status === 'FINALIZED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800',
                            ].join(' ')}
                          >
                            {quote.status === 'FINALIZED'
                              ? 'Finalizado'
                              : 'Sin finalizar'}
                          </span>
                          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                            {quote.careType === 'AMBULATORY'
                              ? 'Ambulatorio'
                              : quote.careType === 'SURGICAL'
                              ? 'Quirúrgico'
                              : 'Mixto'}
                          </span>
                        </div>

                        <div className="mt-3 text-lg font-bold text-[#0F4C81]">
                          {formatPatientName(quote.patient)}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          RUT: {quote.patient.rut} · División:{' '}
                          {quote.division?.name ?? '-'}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-right shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Total
                        </div>
                        <div className="mt-1 text-xl font-bold text-[#0F4C81]">
                          {formatCurrency(quote.total)}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <InfoCard
                        label="Creado"
                        value={formatDate(quote.createdAt)}
                      />
                      <InfoCard
                        label="Actualizado"
                        value={formatDate(quote.updatedAt)}
                      />
                      <InfoCard
                        label="Ítems"
                        value={String(quote.items.length)}
                      />
                      <InfoCard
                        label="Descuento"
                        value={formatCurrency(quote.discountTotal)}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-sky-100 bg-white px-4 py-4">
                      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#0F4C81]">
                        Resumen económico
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <SummaryValue
                          label="Subtotal"
                          value={formatCurrency(quote.subtotal)}
                        />
                        <SummaryValue
                          label="Descuento"
                          value={formatCurrency(quote.discountTotal)}
                        />
                        <SummaryValue
                          label="Total"
                          value={formatCurrency(quote.total)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-[#0F4C81]">{value}</div>
    </div>
  );
}