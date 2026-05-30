'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type CoverageType = 'ISAPRE_PLAN' | 'FONASA' | 'PARTICULAR' | 'OTHER';
type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';

type Division = {
  id: number;
  name: string;
  code: string;
  status: boolean;
};

type Procedure = {
  id: number;
  divisionId: number;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
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

type PriceFormState = {
  divisionId: string;
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
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prices, setPrices] = useState<ProcedurePrice[]>([]);
  const [isapres, setIsapres] = useState<Isapre[]>([]);
  const [plans, setPlans] = useState<IsaprePlan[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingIsapres, setLoadingIsapres] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [search, setSearch] = useState('');
  const [coverageTypeFilter, setCoverageTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [form, setForm] = useState<PriceFormState>(INITIAL_FORM);

  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingDivisions(true);

        const divisionsResponse = await fetch(`${API_URL}/divisions`);

        if (!divisionsResponse.ok) {
          throw new Error('No se pudieron cargar las divisiones.');
        }

        const divisionsData: Division[] = await divisionsResponse.json();
        setDivisions(divisionsData);

        if (divisionsData.length > 0) {
          const initialDivisionId = String(divisionsData[0].id);
          setSelectedDivisionId(initialDivisionId);
          setForm((prev) => ({
            ...prev,
            divisionId: initialDivisionId,
          }));
        }
      } catch (error) {
        console.error(error);
        setAlert({
          type: 'error',
          message: 'No se pudieron cargar los datos iniciales del mantenedor.',
        });
      } finally {
        setLoadingDivisions(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedDivisionId) return;
    loadPrices();
  }, [selectedDivisionId, coverageTypeFilter, activeFilter]);

  useEffect(() => {
    if (!form.divisionId) {
      setProcedures([]);
      return;
    }

    loadProceduresByDivision(form.divisionId);
  }, [form.divisionId]);

  useEffect(() => {
    if (!form.divisionId) {
      setIsapres([]);
      setPlans([]);
      setForm((prev) => ({
        ...prev,
        isapreId: '',
        isaprePlanId: '',
      }));
      return;
    }

    loadIsapresByDivision(form.divisionId);
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

  async function loadProceduresByDivision(divisionId: string) {
    try {
      setLoadingProcedures(true);

      const params = new URLSearchParams({
        divisionId,
        active: 'true',
      });

      const response = await fetch(`${API_URL}/procedures?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las prestaciones.');
      }

      const data: Procedure[] = await response.json();
      setProcedures(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar las prestaciones de la división.',
      });
    } finally {
      setLoadingProcedures(false);
    }
  }

  async function loadIsapresByDivision(divisionId: string) {
    try {
      setLoadingIsapres(true);

      const response = await fetch(`${API_URL}/isapres?divisionId=${divisionId}`);

      if (!response.ok) {
        throw new Error('No se pudieron cargar las isapres.');
      }

      const data: Isapre[] = await response.json();
      setIsapres(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar las isapres de la división seleccionada.',
      });
    } finally {
      setLoadingIsapres(false);
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

    setForm({
      divisionId: selectedDivisionId || '',
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
    });
  }

  function handleCoverageTypeChange(nextCoverageType: CoverageType) {
    setForm((prev) => ({
      ...prev,
      coverageType: nextCoverageType,
      isapreId: nextCoverageType === 'ISAPRE_PLAN' ? prev.isapreId : '',
      isaprePlanId: nextCoverageType === 'ISAPRE_PLAN' ? prev.isaprePlanId : '',
      fonasaCode: nextCoverageType === 'FONASA' ? prev.fonasaCode : '',
      payerLabel:
        nextCoverageType === 'PARTICULAR' || nextCoverageType === 'OTHER'
          ? prev.payerLabel
          : '',
    }));
  }

  function handleEdit(price: ProcedurePrice) {
    setEditingPriceId(price.id);

    setForm({
      divisionId: String(price.divisionId),
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

    if (!form.divisionId || !form.procedureId || !form.price.trim()) {
      setAlert({
        type: 'info',
        message: 'División, prestación y precio son obligatorios.',
      });
      return;
    }

    if (form.coverageType === 'ISAPRE_PLAN' && (!form.isapreId || !form.isaprePlanId)) {
      setAlert({
        type: 'info',
        message: 'Para ISAPRE_PLAN debe seleccionar isapre y plan.',
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
          form.coverageType === 'ISAPRE_PLAN' && form.isapreId
            ? Number(form.isapreId)
            : undefined,
        isaprePlanId:
          form.coverageType === 'ISAPRE_PLAN' && form.isaprePlanId
            ? Number(form.isaprePlanId)
            : undefined,
        fonasaCode:
          form.coverageType === 'FONASA'
            ? form.fonasaCode.trim() || undefined
            : undefined,
        payerLabel:
          form.coverageType === 'PARTICULAR' || form.coverageType === 'OTHER'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mantenedor de precios</h1>
      </div>

      {alert && (
        <div
          className={[
            'rounded border px-3 py-2 text-sm',
            alert.type === 'success'
              ? 'border-emerald-300 text-emerald-700'
              : alert.type === 'error'
              ? 'border-rose-300 text-rose-700'
              : 'border-slate-300 text-slate-700',
          ].join(' ')}
        >
          {alert.message}
        </div>
      )}

      <section className="rounded border border-slate-300 p-4">
        <h2 className="mb-4 text-base font-medium">{pageTitle}</h2>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">División</label>
            <select
              value={form.divisionId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  divisionId: e.target.value,
                  procedureId: '',
                  isapreId: '',
                  isaprePlanId: '',
                }))
              }
              disabled={loadingDivisions}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Seleccione división</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Prestación</label>
            <select
              value={form.procedureId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  procedureId: e.target.value,
                }))
              }
              disabled={!form.divisionId || loadingProcedures}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Seleccione prestación</option>
              {procedures.map((procedure) => (
                <option key={procedure.id} value={procedure.id}>
                  {procedure.code} - {procedure.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Cobertura</label>
            <select
              value={form.coverageType}
              onChange={(e) => handleCoverageTypeChange(e.target.value as CoverageType)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="ISAPRE_PLAN">ISAPRE_PLAN</option>
              <option value="FONASA">FONASA</option>
              <option value="PARTICULAR">PARTICULAR</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Moneda</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          {form.coverageType === 'ISAPRE_PLAN' && (
            <>
              <div>
                <label className="mb-1 block text-sm">Isapre</label>
                <select
                  value={form.isapreId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isapreId: e.target.value,
                      isaprePlanId: '',
                    }))
                  }
                  disabled={loadingIsapres}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                >
                  <option value="">Seleccione isapre</option>
                  {isapres.map((isapre) => (
                    <option key={isapre.id} value={isapre.id}>
                      {isapre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm">Plan</label>
                <select
                  value={form.isaprePlanId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isaprePlanId: e.target.value,
                    }))
                  }
                  disabled={!form.isapreId || loadingPlans}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                >
                  <option value="">Seleccione plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {form.coverageType === 'FONASA' && (
            <div>
              <label className="mb-1 block text-sm">Código Fonasa</label>
              <input
                type="text"
                value={form.fonasaCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fonasaCode: e.target.value,
                  }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          )}

          {(form.coverageType === 'PARTICULAR' || form.coverageType === 'OTHER') && (
            <div>
              <label className="mb-1 block text-sm">Pagador</label>
              <input
                type="text"
                value={form.payerLabel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    payerLabel: e.target.value,
                  }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm">Precio</label>
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
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Vigencia desde</label>
            <input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  effectiveFrom: e.target.value,
                }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Vigencia hasta</label>
            <input
              type="date"
              value={form.effectiveTo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  effectiveTo: e.target.value,
                }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={savingPrice}
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
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
              className="rounded border border-slate-300 px-4 py-2 text-sm"
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-slate-300 p-4">
        <h2 className="mb-4 text-base font-medium">Listado</h2>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm">División</label>
            <select
              value={selectedDivisionId}
              onChange={(e) => setSelectedDivisionId(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Seleccione división</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Buscar</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Prestación, código o pagador"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Cobertura</label>
            <select
              value={coverageTypeFilter}
              onChange={(e) => setCoverageTypeFilter(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Todas</option>
              <option value="ISAPRE_PLAN">ISAPRE_PLAN</option>
              <option value="FONASA">FONASA</option>
              <option value="PARTICULAR">PARTICULAR</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Estado</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
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
            className="rounded border border-slate-900 px-4 py-2 text-sm"
          >
            Buscar
          </button>
        </div>

        {loadingPrices ? (
          <div>Cargando precios...</div>
        ) : prices.length === 0 ? (
          <div>No hay precios para los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left">ID</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">División</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Prestación</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Cobertura</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Isapre</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Plan</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Pagador / Fonasa</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Precio</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Vigencia</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Activo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr key={price.id}>
                    <td className="border border-slate-300 px-3 py-2">{price.id}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {price.division?.name ?? price.divisionId}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {price.procedure
                        ? `${price.procedure.code} - ${price.procedure.name}`
                        : price.procedureId}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{price.coverageType}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {price.isapre?.name ?? '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {price.isaprePlan?.name ?? '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {price.fonasaCode ?? price.payerLabel ?? '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {formatCurrency(price.price)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {formatDateInput(price.effectiveFrom) || '-'} / {formatDateInput(price.effectiveTo) || '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {price.active ? 'Sí' : 'No'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(price)}
                          className="rounded border border-slate-300 px-3 py-1"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(price)}
                          disabled={updatingStatusId === price.id}
                          className="rounded border border-slate-300 px-3 py-1"
                        >
                          {updatingStatusId === price.id
                            ? 'Actualizando...'
                            : price.active
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}