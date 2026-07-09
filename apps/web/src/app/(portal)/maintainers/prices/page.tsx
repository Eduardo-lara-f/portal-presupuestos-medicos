'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ITEMS_PER_PAGE = 10;

type CoverageType = 'ISAPRE_PLAN' | 'FONASA' | 'PARTICULAR' | 'OTHER';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';

type CatalogItemType =
  | 'PROCEDURE'
  | 'SUPPLY'
  | 'MEDICATION'
  | 'BED_DAY'
  | 'MEDICAL_FEE';

type Procedure = {
  id: number;
  divisionId: number;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  itemType: CatalogItemType;
  careType: CareType;
  active: boolean;
};

type Isapre = {
  id: number;
  name: string;
  code: string;
  active: boolean;
};

type IsaprePlan = {
  id: number;
  isapreId: number;
  name: string;
  code?: string | null;
  active: boolean;
};

type CoverageCatalogItem = {
  type: CoverageType;
  label: string;
  enabled: boolean;
  requiresIsapre: boolean;
  requiresPlan: boolean;
  requiresFonasaCode: boolean;
  requiresPayerLabel: boolean;
};

type CoverageCatalogResponse = {
  divisionId: number;
  coverages: CoverageCatalogItem[];
  isapres: Isapre[];
  itemTypes: ItemTypeCatalogItem[];
};

type ItemTypeCatalogItem = {
  value: CatalogItemType;
  label: string;
};

type ProcedurePrice = {
  id: number;
  divisionId: number;
  procedureId: number;
  coverageType: CoverageType;
  isapreId?: number | null;
  isaprePlanId?: number | null;
  fonasaCode?: string | null;
  payerLabel?: string | null;
  price: string;
  currency: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  active: boolean;
  division?: {
    id: number;
    name: string;
    code: string;
  };
  procedure?: {
    id: number;
    code: string;
    name: string;
    itemType: CatalogItemType;
    careType: CareType;
    active: boolean;
  };
  isapre?: {
    id: number;
    name: string;
    code: string;
  } | null;
  isaprePlan?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
};

type AlertState = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

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

type PriceFormState = {
  divisionId: string;
  itemType: CatalogItemType;
  procedureId: string;
  coverageType: CoverageType;
  isapreId: string;
  isaprePlanId: string;
  fonasaCode: string;
  payerLabel: string;
  price: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
};

const INITIAL_FORM: PriceFormState = {
  divisionId: '',
  itemType: 'PROCEDURE',
  procedureId: '',
  coverageType: 'ISAPRE_PLAN',
  isapreId: '',
  isaprePlanId: '',
  fonasaCode: '',
  payerLabel: '',
  price: '',
  currency: 'CLP',
  effectiveFrom: '',
  effectiveTo: '',
};

function formatCurrency(value: string | number) {
  const amount = Number(value);

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function MaintainersPricesPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prices, setPrices] = useState<ProcedurePrice[]>([]);
  const [isapres, setIsapres] = useState<Isapre[]>([]);
  const [plans, setPlans] = useState<IsaprePlan[]>([]);
  const [coverageCatalog, setCoverageCatalog] = useState<CoverageCatalogItem[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemTypeCatalogItem[]>([]);

  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDivisionName, setSelectedDivisionName] = useState('-');
  const [search, setSearch] = useState('');
  const [coverageTypeFilter, setCoverageTypeFilter] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<CatalogItemType | ''>('');
  const [activeFilter, setActiveFilter] = useState('true');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [form, setForm] = useState<PriceFormState>(INITIAL_FORM);

  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    try {
      const rawAuthUser = localStorage.getItem('authUser');
      if (!rawAuthUser) return;

      const parsedAuthUser = JSON.parse(rawAuthUser) as AuthUser;

      const divisionId =
        parsedAuthUser?.divisionId ?? parsedAuthUser?.division?.id ?? null;
      const divisionName = parsedAuthUser?.division?.name ?? '-';

      if (typeof divisionId === 'number') {
        const normalizedDivisionId = String(divisionId);
        setSelectedDivisionId(normalizedDivisionId);
        setSelectedDivisionName(divisionName);
        setForm((prev) => ({
          ...prev,
          divisionId: normalizedDivisionId,
        }));
      }
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo cargar la división asignada del usuario.',
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedDivisionId) return;
    loadPrices();
  }, [selectedDivisionId, itemTypeFilter, coverageTypeFilter, activeFilter]);

  useEffect(() => {
    if (!form.divisionId) {
      setProcedures([]);
      return;
    }

    loadProceduresByDivision(form.divisionId, form.itemType);
  }, [form.divisionId, form.itemType]);

  useEffect(() => {
    if (!form.divisionId) {
      setCoverageCatalog([]);
      setItemTypes([]);
      setIsapres([]);
      setPlans([]);
      setForm((prev) => ({
        ...prev,
        coverageType: 'ISAPRE_PLAN',
        itemType: 'PROCEDURE',
        isapreId: '',
        isaprePlanId: '',
        fonasaCode: '',
        payerLabel: '',
      }));
      return;
    }

    loadCoverageCatalog(form.divisionId);
  }, [form.divisionId]);

  useEffect(() => {
    if (!form.isapreId) {
      setPlans([]);
      setForm((prev) => ({
        ...prev,
        isaprePlanId: '',
      }));
      return;
    }

    loadPlansByIsapre(form.isapreId);
  }, [form.isapreId]);

  const selectedCoverageConfig = useMemo(() => {
    return coverageCatalog.find((item) => item.type === form.coverageType) ?? null;
  }, [coverageCatalog, form.coverageType]);

  const enabledCoverageOptions = useMemo(() => {
    return coverageCatalog.filter((item) => item.enabled);
  }, [coverageCatalog]);

  async function loadPrices() {
    try {
      setLoadingPrices(true);

      const params = new URLSearchParams();

      if (selectedDivisionId) {
        params.set('divisionId', selectedDivisionId);
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (itemTypeFilter) {
        params.set('itemType', itemTypeFilter);
      }

      if (coverageTypeFilter) {
        params.set('coverageType', coverageTypeFilter);
      }

      if (activeFilter) {
        params.set('active', activeFilter);
      }

      const response = await fetch(`${API_URL}/procedure-prices?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los precios.');
      }

      const data: ProcedurePrice[] = await response.json();
      setPrices(data);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar los precios.',
      });
    } finally {
      setLoadingPrices(false);
    }
  }

  async function loadProceduresByDivision(
    divisionId: string,
    itemType: CatalogItemType,
  ) {
    try {
      setLoadingProcedures(true);

      const params = new URLSearchParams({
        divisionId,
        active: 'true',
      });

      params.set('itemType', itemType);

      const response = await fetch(`${API_URL}/procedures?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los ítems del tipo seleccionado.');
      }

      const data: Procedure[] = await response.json();
      setProcedures(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar los ítems de la división.',
      });
    } finally {
      setLoadingProcedures(false);
    }
  }

  async function loadCoverageCatalog(divisionId: string) {
    try {
      setLoadingCatalog(true);

      const response = await fetch(
        `${API_URL}/procedure-prices/catalog?divisionId=${divisionId}`,
      );

      if (!response.ok) {
        throw new Error('No se pudo cargar el catálogo de coberturas.');
      }

      const data: CoverageCatalogResponse = await response.json();

      setCoverageCatalog(data.coverages);
      setItemTypes(data.itemTypes ?? []);
      setIsapres(data.isapres);

      const currentCoverageStillValid = data.coverages.some(
        (item) => item.type === form.coverageType && item.enabled,
      );

      const fallbackCoverage =
        data.coverages.find((item) => item.enabled)?.type ?? 'ISAPRE_PLAN';

      setForm((prev) => {
        const nextCoverageType = currentCoverageStillValid
          ? prev.coverageType
          : fallbackCoverage;

        const nextCoverageConfig =
          data.coverages.find((item) => item.type === nextCoverageType) ?? null;

        return {
          ...prev,
          coverageType: nextCoverageType,
          itemType: 'PROCEDURE',
          isapreId: nextCoverageConfig?.requiresIsapre ? prev.isapreId : '',
          isaprePlanId: nextCoverageConfig?.requiresPlan ? prev.isaprePlanId : '',
          fonasaCode: nextCoverageConfig?.requiresFonasaCode ? prev.fonasaCode : '',
          payerLabel: nextCoverageConfig?.requiresPayerLabel ? prev.payerLabel : '',
        };
      });
    } catch (error) {
      console.error(error);
      setCoverageCatalog([]);
      setItemTypes([]);
      setIsapres([]);
      setPlans([]);
      setAlert({
        type: 'error',
        message: 'No se pudo cargar el catálogo de coberturas.',
      });
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function loadPlansByIsapre(isapreId: string) {
    try {
      setLoadingPlans(true);

      const response = await fetch(`${API_URL}/isapres/${isapreId}/plans`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los planes.');
      }

      const data: IsaprePlan[] = await response.json();
      setPlans(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar los planes de la isapre seleccionada.',
      });
    } finally {
      setLoadingPlans(false);
    }
  }

  function resetForm() {
    setEditingPriceId(null);
    setPlans([]);

    const defaultCoverageType =
      coverageCatalog.find((item) => item.enabled)?.type ?? 'ISAPRE_PLAN';

    setForm({
      divisionId: selectedDivisionId || '',
      itemType: itemTypes[0]?.value ?? 'PROCEDURE',
      procedureId: '',
      coverageType: defaultCoverageType,
      isapreId: '',
      isaprePlanId: '',
      fonasaCode: '',
      payerLabel: '',
      price: '',
      currency: 'CLP',
      effectiveFrom: '',
      effectiveTo: '',
    });
  }

  function handleCoverageTypeChange(nextCoverageType: CoverageType) {
    const config = coverageCatalog.find((item) => item.type === nextCoverageType);

    setForm((prev) => ({
      ...prev,
      coverageType: nextCoverageType,
      isapreId: config?.requiresIsapre ? prev.isapreId : '',
      isaprePlanId: config?.requiresPlan ? prev.isaprePlanId : '',
      fonasaCode: config?.requiresFonasaCode ? prev.fonasaCode : '',
      payerLabel: config?.requiresPayerLabel ? prev.payerLabel : '',
    }));

    if (!config?.requiresIsapre) {
      setPlans([]);
    }
  }

  function handleEdit(price: ProcedurePrice) {
    setEditingPriceId(price.id);

    setForm({
      divisionId: String(price.divisionId),
      itemType: price.procedure?.itemType ?? 'PROCEDURE',
      procedureId: String(price.procedureId),
      coverageType: price.coverageType,
      isapreId: price.isapreId ? String(price.isapreId) : '',
      isaprePlanId: price.isaprePlanId ? String(price.isaprePlanId) : '',
      fonasaCode: price.fonasaCode ?? '',
      payerLabel: price.payerLabel ?? '',
      price: String(price.price ?? ''),
      currency: price.currency ?? 'CLP',
      effectiveFrom: formatDateInput(price.effectiveFrom),
      effectiveTo: formatDateInput(price.effectiveTo),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.divisionId || !form.itemType || !form.procedureId || !form.price.trim()) {
      setAlert({
        type: 'info',
        message: 'División, tipo de ítem, ítem y precio son obligatorios.',
      });
      return;
    }

    if (selectedCoverageConfig?.requiresIsapre && !form.isapreId) {
      setAlert({
        type: 'info',
        message: 'Debe seleccionar una isapre.',
      });
      return;
    }

    if (selectedCoverageConfig?.requiresPlan && !form.isaprePlanId) {
      setAlert({
        type: 'info',
        message: 'Debe seleccionar un plan.',
      });
      return;
    }

    if (selectedCoverageConfig?.requiresFonasaCode && !form.fonasaCode.trim()) {
      setAlert({
        type: 'info',
        message: 'Debe ingresar el código Fonasa.',
      });
      return;
    }

    if (selectedCoverageConfig?.requiresPayerLabel && !form.payerLabel.trim()) {
      setAlert({
        type: 'info',
        message: 'Debe ingresar el pagador.',
      });
      return;
    }

    try {
      setSavingPrice(true);

      const payload = {
        divisionId: Number(form.divisionId),
        procedureId: Number(form.procedureId),
        coverageType: form.coverageType,
        isapreId:
          selectedCoverageConfig?.requiresIsapre && form.isapreId
            ? Number(form.isapreId)
            : undefined,
        isaprePlanId:
          selectedCoverageConfig?.requiresPlan && form.isaprePlanId
            ? Number(form.isaprePlanId)
            : undefined,
        fonasaCode: selectedCoverageConfig?.requiresFonasaCode
          ? form.fonasaCode.trim() || undefined
          : undefined,
        payerLabel: selectedCoverageConfig?.requiresPayerLabel
          ? form.payerLabel.trim() || undefined
          : undefined,
        price: Number(form.price),
        currency: form.currency.trim() || 'CLP',
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
      };

      const response = await fetch(
        editingPriceId
          ? `${API_URL}/procedure-prices/${editingPriceId}`
          : `${API_URL}/procedure-prices`,
        {
          method: editingPriceId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo guardar el precio.');
      }

      setAlert({
        type: 'success',
        message: editingPriceId
          ? 'Precio actualizado correctamente.'
          : 'Precio creado correctamente.',
      });

      resetForm();
      await loadPrices();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo guardar el precio.',
      });
    } finally {
      setSavingPrice(false);
    }
  }

  async function handleToggleStatus(price: ProcedurePrice) {
    try {
      setUpdatingStatusId(price.id);

      const response = await fetch(`${API_URL}/procedure-prices/${price.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !price.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo actualizar el estado.');
      }

      setAlert({
        type: 'success',
        message: price.active
          ? 'Precio desactivado correctamente.'
          : 'Precio activado correctamente.',
      });

      await loadPrices();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo actualizar el estado del precio.',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const pageTitle = useMemo(() => {
    return editingPriceId ? 'Editar precio' : 'Crear precio';
  }, [editingPriceId]);

  const totalPages = Math.max(1, Math.ceil(prices.length / ITEMS_PER_PAGE));

  const paginatedPrices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return prices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [prices, currentPage]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 pb-10 pt-4 md:px-8 lg:px-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-500">
          Mantenedores
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0F4C81] md:text-4xl">
          Mantenedor de precios
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
          Administre precios por tipo de ítem y cobertura dentro de la división asignada.
        </p>
      </div>

      {alert && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm shadow-sm',
            alert.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : alert.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-sky-200 bg-sky-50 text-sky-800',
          ].join(' ')}
        >
          {alert.message}
        </div>
      )}

      <section className="mb-6 overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_24px_60px_-38px_rgba(15,76,129,0.45)]">
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#1E88C8] px-6 py-5 text-white md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Formulario
          </p>
          <h2 className="mt-1 text-xl font-bold">{pageTitle}</h2>
        </div>

        <div className="border-b border-sky-100 px-6 py-4 md:px-8">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-[#0F4C81]">División asignada:</span>{' '}
            {selectedDivisionName}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              División
            </label>
            <div className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {selectedDivisionName}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Tipo de ítem</label>
            <select
              value={form.itemType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  itemType: e.target.value as CatalogItemType,
                  procedureId: '',
                }))
              }
              disabled={!form.divisionId || loadingCatalog || itemTypes.length === 0}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {itemTypes.map((itemType) => (
                <option key={itemType.value} value={itemType.value}>
                  {itemType.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Ítem</label>
            <select
              value={form.procedureId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  procedureId: e.target.value,
                }))
              }
              disabled={!form.divisionId || loadingProcedures}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Seleccione ítem</option>
              {procedures.map((procedure) => (
                <option key={procedure.id} value={procedure.id}>
                  {procedure.code} - {procedure.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Cobertura</label>
            <select
              value={form.coverageType}
              onChange={(e) => handleCoverageTypeChange(e.target.value as CoverageType)}
              disabled={loadingCatalog || enabledCoverageOptions.length === 0}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {enabledCoverageOptions.map((coverage) => (
                <option key={coverage.type} value={coverage.type}>
                  {coverage.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Moneda</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {selectedCoverageConfig?.requiresIsapre && (
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Isapre</label>
              <select
                value={form.isapreId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isapreId: e.target.value,
                    isaprePlanId: '',
                  }))
                }
                disabled={loadingCatalog}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Seleccione isapre</option>
                {isapres.map((isapre) => (
                  <option key={isapre.id} value={isapre.id}>
                    {isapre.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedCoverageConfig?.requiresPlan && (
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Plan</label>
              <select
                value={form.isaprePlanId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isaprePlanId: e.target.value,
                  }))
                }
                disabled={!form.isapreId || loadingPlans}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Seleccione plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedCoverageConfig?.requiresFonasaCode && (
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Código Fonasa</label>
              <input
                type="text"
                value={form.fonasaCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fonasaCode: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          )}

          {selectedCoverageConfig?.requiresPayerLabel && (
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Pagador</label>
              <input
                type="text"
                value={form.payerLabel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    payerLabel: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Precio</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Vigencia desde</label>
            <input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  effectiveFrom: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Vigencia hasta</label>
            <input
              type="date"
              value={form.effectiveTo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  effectiveTo: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={savingPrice}
              className="rounded-2xl bg-[#0F4C81] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3d67] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPrice
                ? 'Guardando...'
                : editingPriceId
                ? 'Actualizar'
                : 'Crear'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50"
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_24px_60px_-38px_rgba(15,76,129,0.45)]">
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#1E88C8] px-6 py-5 text-white md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Listado
          </p>
          <h2 className="mt-1 text-xl font-bold">Precios</h2>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-5 grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              División
            </label>
            <div className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {selectedDivisionName}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Buscar</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              placeholder="Prestación, código o pagador"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Tipo de ítem</label>
            <select
              value={itemTypeFilter}
              onChange={(e) => {
                setItemTypeFilter(e.target.value as CatalogItemType | '');
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Todos</option>
              {itemTypes.map((itemType) => (
                <option key={itemType.value} value={itemType.value}>
                  {itemType.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Cobertura</label>
            <select
              value={coverageTypeFilter}
              onChange={(e) => {
                setCoverageTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Todas</option>
              {enabledCoverageOptions.map((coverage) => (
                <option key={coverage.type} value={coverage.type}>
                  {coverage.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">Estado</label>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={loadPrices}
            className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50"
          >
            Buscar
          </button>
        </div>

        {loadingPrices ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
            Cargando precios...
          </div>
        ) : prices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
            No hay precios para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedPrices.map((price) => {
              const procedureLabel = price.procedure
                ? `${price.procedure.code} - ${price.procedure.name}`
                : String(price.procedureId);
              const itemTypeLabel =
                itemTypes.find((item) => item.value === price.procedure?.itemType)?.label ??
                price.procedure?.itemType ??
                '-';
              const coverageLabel =
                coverageCatalog.find((item) => item.type === price.coverageType)?.label ??
                price.coverageType;
              const payerLabel = price.fonasaCode ?? price.payerLabel ?? '-';
              const effectiveLabel = `${formatDateInput(price.effectiveFrom) || '-'} / ${
                formatDateInput(price.effectiveTo) || '-'
              }`;

              return (
                <div
                  key={price.id}
                  className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                          {price.division?.name ?? `División ${price.divisionId}`}
                        </div>
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                            price.active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700',
                          ].join(' ')}
                        >
                          {price.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="mt-2 text-xl font-bold text-[#0F4C81]">
                        {procedureLabel}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-700">
                        {formatCurrency(price.price)}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          ID: {price.id}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Tipo ítem: {itemTypeLabel}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Cobertura: {coverageLabel}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Isapre: {price.isapre?.name ?? '-'}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Plan: {price.isaprePlan?.name ?? '-'}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Pagador / Fonasa: {payerLabel}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Vigencia: {effectiveLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(price)}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(price)}
                        disabled={updatingStatusId === price.id}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {updatingStatusId === price.id
                          ? 'Actualizando...'
                          : price.active
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {prices.length > ITEMS_PER_PAGE && (
              <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <span>
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, prices.length)} de {prices.length}{' '}
                  precios
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <span className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#0F4C81]">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}