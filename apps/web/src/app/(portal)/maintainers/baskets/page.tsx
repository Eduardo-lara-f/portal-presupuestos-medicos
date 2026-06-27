'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

type BasketItem = {
  procedureId: number;
  quantity: number;
  relevanceScore?: string;
  procedure?: {
    id: number;
    code: string;
    name: string;
    category?: string | null;
    careType: CareType;
    active: boolean;
  };
};

type Basket = {
  id: number;
  divisionId: number;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  division?: {
    id: number;
    name: string;
    code: string;
  };
  items: BasketItem[];
};

type AlertState = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

type BasketFormItem = {
  procedureId: string;
  quantity: string;
  relevanceScore: string;
};

type BasketFormState = {
  divisionId: string;
  code: string;
  name: string;
  description: string;
  items: BasketFormItem[];
};

const INITIAL_FORM: BasketFormState = {
  divisionId: '',
  code: '',
  name: '',
  description: '',
  items: [],
};

export default function MaintainersBasketsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [baskets, setBaskets] = useState<Basket[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingBaskets, setLoadingBaskets] = useState(false);
  const [savingBasket, setSavingBasket] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  const [editingBasketId, setEditingBasketId] = useState<number | null>(null);
  const [form, setForm] = useState<BasketFormState>(INITIAL_FORM);

  const [procedureToAdd, setProcedureToAdd] = useState('');
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    async function loadDivisions() {
      try {
        setLoadingDivisions(true);

        const response = await fetch(`${API_URL}/divisions`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar las divisiones.');
        }

        const data: Division[] = await response.json();
        setDivisions(data);

        if (data.length > 0) {
          const initialDivisionId = String(data[0].id);
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
          message: 'No se pudieron cargar las divisiones.',
        });
      } finally {
        setLoadingDivisions(false);
      }
    }

    loadDivisions();
  }, []);

  useEffect(() => {
    if (!selectedDivisionId) return;
    loadBaskets();
  }, [selectedDivisionId, activeFilter]);

  useEffect(() => {
    if (!form.divisionId) {
      setProcedures([]);
      return;
    }

    loadProceduresByDivision(form.divisionId);
  }, [form.divisionId]);

  async function loadBaskets() {
    try {
      setLoadingBaskets(true);

      const params = new URLSearchParams();

      if (selectedDivisionId) {
        params.set('divisionId', selectedDivisionId);
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (activeFilter) {
        params.set('active', activeFilter);
      }

      const response = await fetch(`${API_URL}/baskets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las canastas.');
      }

      const data: Basket[] = await response.json();
      setBaskets(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar las canastas.',
      });
    } finally {
      setLoadingBaskets(false);
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

  function resetForm() {
    setEditingBasketId(null);
    setProcedureToAdd('');

    setForm({
      divisionId: selectedDivisionId || '',
      code: '',
      name: '',
      description: '',
      items: [],
    });
  }

  function addProcedureToForm() {
    if (!procedureToAdd) {
      setAlert({
        type: 'info',
        message: 'Debe seleccionar una prestación para agregar.',
      });
      return;
    }

    setForm((prev) => {
      const exists = prev.items.some(
        (item) => item.procedureId === procedureToAdd,
      );

      if (exists) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.procedureId === procedureToAdd
              ? {
                  ...item,
                  quantity: String(Number(item.quantity || '1') + 1),
                }
              : item,
          ),
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            procedureId: procedureToAdd,
            quantity: '1',
            relevanceScore: '',
          },
        ],
      };
    });

    setProcedureToAdd('');
  }

  function updateFormItem(
    index: number,
    field: keyof BasketFormItem,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeFormItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleEdit(basket: Basket) {
    setEditingBasketId(basket.id);
    setProcedureToAdd('');

    setForm({
      divisionId: String(basket.divisionId),
      code: basket.code,
      name: basket.name,
      description: basket.description ?? '',
      items: basket.items.map((item) => ({
        procedureId: String(item.procedureId),
        quantity: String(item.quantity),
        relevanceScore:
          item.relevanceScore !== undefined && item.relevanceScore !== null
            ? String(item.relevanceScore)
            : '',
      })),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.divisionId || !form.code.trim() || !form.name.trim()) {
      setAlert({
        type: 'info',
        message: 'División, código y nombre son obligatorios.',
      });
      return;
    }

    if (!form.items.length) {
      setAlert({
        type: 'info',
        message: 'Debe agregar al menos una prestación a la canasta.',
      });
      return;
    }

    try {
      setSavingBasket(true);

      const payload = {
        divisionId: Number(form.divisionId),
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        items: form.items.map((item) => ({
          procedureId: Number(item.procedureId),
          quantity: Number(item.quantity),
          relevanceScore: item.relevanceScore.trim()
            ? Number(item.relevanceScore)
            : undefined,
        })),
      };

      const response = await fetch(
        editingBasketId
          ? `${API_URL}/baskets/${editingBasketId}`
          : `${API_URL}/baskets`,
        {
          method: editingBasketId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo guardar la canasta.');
      }

      setAlert({
        type: 'success',
        message: editingBasketId
          ? 'Canasta actualizada correctamente.'
          : 'Canasta creada correctamente.',
      });

      resetForm();
      await loadBaskets();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo guardar la canasta.',
      });
    } finally {
      setSavingBasket(false);
    }
  }

  async function handleToggleStatus(basket: Basket) {
    try {
      setUpdatingStatusId(basket.id);

      const response = await fetch(`${API_URL}/baskets/${basket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !basket.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo actualizar el estado.');
      }

      setAlert({
        type: 'success',
        message: basket.active
          ? 'Canasta desactivada correctamente.'
          : 'Canasta activada correctamente.',
      });

      await loadBaskets();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo actualizar el estado de la canasta.',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const pageTitle = useMemo(() => {
    return editingBasketId ? 'Editar canasta' : 'Crear canasta';
  }, [editingBasketId]);

  const procedureOptions = useMemo(() => {
    return procedures.filter(
      (procedure) =>
        !form.items.some(
          (item) => Number(item.procedureId) === procedure.id,
        ),
    );
  }, [procedures, form.items]);

  function getProcedureLabel(procedureId: string) {
    const procedure = procedures.find(
      (item) => String(item.id) === procedureId,
    );

    if (!procedure) return procedureId;

    return `${procedure.code} - ${procedure.name}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 xl:px-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="text-center">
            <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm">
              Configuración clínica
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0F4C81]">
              Mantenedor de canastas
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Administre canastas por división y configure sus prestaciones asociadas.
            </p>
          </div>

          {alert && (
            <div
              className={[
                'rounded-2xl border px-4 py-3 text-sm shadow-sm',
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

          <section className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_15px_40px_-24px_rgba(15,76,129,0.28)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0F4C81]">{pageTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Complete los datos principales y agregue las prestaciones que compondrán la canasta.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="División">
                  <select
                    value={form.divisionId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        divisionId: e.target.value,
                        items: [],
                      }))
                    }
                    disabled={loadingDivisions}
                    className="input-clinical"
                  >
                    <option value="">Seleccione división</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Código">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                    className="input-clinical"
                  />
                </Field>

                <Field label="Nombre">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="input-clinical"
                  />
                </Field>

                <Field label="Descripción">
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="input-clinical"
                  />
                </Field>
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-sky-50/60 p-4 md:p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-[#0F4C81]">Prestaciones de la canasta</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Agregue una o más prestaciones, defina cantidad y un puntaje de relevancia si corresponde.
                  </p>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={procedureToAdd}
                    onChange={(e) => setProcedureToAdd(e.target.value)}
                    disabled={!form.divisionId || loadingProcedures}
                    className="input-clinical"
                  >
                    <option value="">Seleccione prestación</option>
                    {procedureOptions.map((procedure) => (
                      <option key={procedure.id} value={procedure.id}>
                        {procedure.code} - {procedure.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={addProcedureToForm}
                    className="btn-health-primary"
                  >
                    Agregar
                  </button>
                </div>

                {form.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-4 text-sm text-slate-500">
                    No hay prestaciones agregadas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.items.map((item, index) => (
                      <div
                        key={`${item.procedureId}-${index}`}
                        className="grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 md:grid-cols-[2fr_120px_160px_auto]"
                      >
                        <div className="flex items-center text-sm font-medium text-slate-700">
                          {getProcedureLabel(item.procedureId)}
                        </div>

                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateFormItem(index, 'quantity', e.target.value)
                          }
                          className="input-clinical"
                          placeholder="Cantidad"
                        />

                        <input
                          type="number"
                          step="0.01"
                          value={item.relevanceScore}
                          onChange={(e) =>
                            updateFormItem(index, 'relevanceScore', e.target.value)
                          }
                          className="input-clinical"
                          placeholder="Relevancia"
                        />

                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className="btn-health-secondary"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingBasket}
                  className="btn-health-primary"
                >
                  {savingBasket
                    ? 'Guardando...'
                    : editingBasketId
                    ? 'Actualizar'
                    : 'Crear'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-health-secondary"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-[0_15px_40px_-24px_rgba(15,76,129,0.28)] md:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#0F4C81]">Listado</h2>
              <p className="mt-1 text-sm text-slate-600">
                Filtre las canastas por división, búsqueda libre o estado.
              </p>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <Field label="División">
                <select
                  value={selectedDivisionId}
                  onChange={(e) => setSelectedDivisionId(e.target.value)}
                  className="input-clinical"
                >
                  <option value="">Seleccione división</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Buscar">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-clinical"
                  placeholder="Código o nombre"
                />
              </Field>

              <Field label="Estado">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="input-clinical"
                >
                  <option value="">Todos</option>
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
                </select>
              </Field>
            </div>

            <div className="mb-5">
              <button
                type="button"
                onClick={loadBaskets}
                className="btn-health-primary"
              >
                Buscar
              </button>
            </div>

            {loadingBaskets ? (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                Cargando canastas...
              </div>
            ) : baskets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-6 text-sm text-slate-500">
                No hay canastas para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {baskets.map((basket) => (
                  <div
                    key={basket.id}
                    className="rounded-[24px] border border-sky-100 bg-sky-50/40 p-4 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-sky-700">
                          {basket.division?.name ?? basket.divisionId}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {basket.code} - {basket.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {basket.description ?? 'Sin descripción'}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(basket)}
                          className="btn-health-secondary"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(basket)}
                          disabled={updatingStatusId === basket.id}
                          className="btn-health-secondary"
                        >
                          {updatingStatusId === basket.id
                            ? 'Actualizando...'
                            : basket.active
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="mb-2 font-semibold text-[#0F4C81]">Prestaciones</div>
                      {basket.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-3 text-slate-500">
                          Sin prestaciones.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {basket.items.map((item, index) => (
                            <div
                              key={`${basket.id}-${item.procedureId}-${index}`}
                              className="rounded-2xl border border-sky-100 bg-white px-4 py-3"
                            >
                              <div className="font-medium text-slate-800">
                                {item.procedure?.code} - {item.procedure?.name}
                              </div>
                              <div className="mt-1 text-slate-500">
                                Cantidad: {item.quantity}
                                {item.relevanceScore !== undefined &&
                                item.relevanceScore !== null
                                  ? ` · Relevancia: ${item.relevanceScore}`
                                  : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
        {label}
      </span>
      {children}
    </label>
  );
}