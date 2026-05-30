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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mantenedor de canastas</h1>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">División</label>
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
              <label className="mb-1 block text-sm">Código</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="rounded border border-slate-300 p-4">
            <h3 className="mb-3 text-sm font-medium">Prestaciones de la canasta</h3>

            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <select
                value={procedureToAdd}
                onChange={(e) => setProcedureToAdd(e.target.value)}
                disabled={!form.divisionId || loadingProcedures}
                className="w-full rounded border border-slate-300 px-3 py-2"
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
                className="rounded border border-slate-900 px-4 py-2 text-sm"
              >
                Agregar
              </button>
            </div>

            {form.items.length === 0 ? (
              <div className="text-sm text-slate-500">
                No hay prestaciones agregadas.
              </div>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={`${item.procedureId}-${index}`}
                    className="grid gap-3 rounded border border-slate-200 p-3 md:grid-cols-[2fr_120px_160px_auto]"
                  >
                    <div className="flex items-center text-sm">
                      {getProcedureLabel(item.procedureId)}
                    </div>

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateFormItem(index, 'quantity', e.target.value)
                      }
                      className="rounded border border-slate-300 px-3 py-2"
                      placeholder="Cantidad"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={item.relevanceScore}
                      onChange={(e) =>
                        updateFormItem(index, 'relevanceScore', e.target.value)
                      }
                      className="rounded border border-slate-300 px-3 py-2"
                      placeholder="Relevancia"
                    />

                    <button
                      type="button"
                      onClick={() => removeFormItem(index)}
                      className="rounded border border-slate-300 px-3 py-2 text-sm"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingBasket}
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
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
              className="rounded border border-slate-300 px-4 py-2 text-sm"
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-slate-300 p-4">
        <h2 className="mb-4 text-base font-medium">Listado</h2>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
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
              placeholder="Código o nombre"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Estado</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={loadBaskets}
            className="rounded border border-slate-900 px-4 py-2 text-sm"
          >
            Buscar
          </button>
        </div>

        {loadingBaskets ? (
          <div>Cargando canastas...</div>
        ) : baskets.length === 0 ? (
          <div>No hay canastas para los filtros seleccionados.</div>
        ) : (
          <div className="space-y-4">
            {baskets.map((basket) => (
              <div
                key={basket.id}
                className="rounded border border-slate-300 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">
                      {basket.division?.name ?? basket.divisionId}
                    </div>
                    <div className="text-base font-semibold">
                      {basket.code} - {basket.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {basket.description ?? 'Sin descripción'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(basket)}
                      className="rounded border border-slate-300 px-3 py-1 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(basket)}
                      disabled={updatingStatusId === basket.id}
                      className="rounded border border-slate-300 px-3 py-1 text-sm"
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
                  <div className="mb-2 font-medium">Prestaciones:</div>
                  {basket.items.length === 0 ? (
                    <div className="text-slate-500">Sin prestaciones.</div>
                  ) : (
                    <div className="space-y-2">
                      {basket.items.map((item, index) => (
                        <div
                          key={`${basket.id}-${item.procedureId}-${index}`}
                          className="rounded border border-slate-200 px-3 py-2"
                        >
                          <div>
                            {item.procedure?.code} - {item.procedure?.name}
                          </div>
                          <div className="text-slate-500">
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
  );
}