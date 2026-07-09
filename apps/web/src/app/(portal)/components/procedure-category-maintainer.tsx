'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ITEMS_PER_PAGE = 10;

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type CatalogItemType = 'PROCEDURE' | 'SUPPLY' | 'MEDICATION' | 'BED_DAY' | 'MEDICAL_FEE';
type ProcedureCategory = 'SUPPLY' | 'DRUG' | 'BED' | 'PROCEDURE' | 'MEDICAL_FEE';

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
  itemType: CatalogItemType;
  careType: CareType;
  active: boolean;
  division?: {
    id: number;
    name: string;
    code: string;
  };
};

type AlertState = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

type ProcedureFormState = {
  divisionId: string;
  code: string;
  name: string;
  description: string;
  careType: CareType;
};

type ProcedureCategoryMaintainerProps = {
  category: ProcedureCategory;
  itemType?: CatalogItemType;
  pageTitle: string;
  singularLabel: string;
  pluralLabel: string;
};

const INITIAL_FORM: ProcedureFormState = {
  divisionId: '',
  code: '',
  name: '',
  description: '',
  careType: 'BOTH',
};

function getCareTypeLabel(careType: CareType) {
  if (careType === 'AMBULATORY') return 'Ambulatorio';
  if (careType === 'SURGICAL') return 'Quirúrgico';
  return 'Ambos';
}

export default function ProcedureCategoryMaintainer({
  category,
  itemType,
  pageTitle,
  singularLabel,
  pluralLabel,
}: ProcedureCategoryMaintainerProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [items, setItems] = useState<Procedure[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [search, setSearch] = useState('');
  const [careTypeFilter, setCareTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [form, setForm] = useState<ProcedureFormState>(INITIAL_FORM);

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
    loadItems();
  }, [selectedDivisionId, careTypeFilter, activeFilter]);

  useEffect(() => {
    if (editingItemId) return;

    setForm((prev) => ({
      ...prev,
      divisionId: selectedDivisionId || '',
    }));
  }, [selectedDivisionId, editingItemId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, selectedDivisionId, search, careTypeFilter, activeFilter]);

  async function loadItems() {
    try {
      setLoadingItems(true);

      const params = new URLSearchParams();

      if (selectedDivisionId) {
        params.set('divisionId', selectedDivisionId);
      }

      params.set('category', category);
      params.set('itemType', itemType ?? 'PROCEDURE');

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (careTypeFilter) {
        params.set('careType', careTypeFilter);
      }

      if (activeFilter) {
        params.set('active', activeFilter);
      }

      const response = await fetch(`${API_URL}/procedures?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`No se pudieron cargar ${pluralLabel.toLowerCase()}.`);
      }

      const data: Procedure[] = await response.json();
      setItems(data);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: `No se pudieron cargar ${pluralLabel.toLowerCase()}.`,
      });
    } finally {
      setLoadingItems(false);
    }
  }

  function resetForm() {
    setEditingItemId(null);
    setForm({
      divisionId: selectedDivisionId || '',
      code: '',
      name: '',
      description: '',
      careType: 'BOTH',
    });
  }

  function handleEdit(item: Procedure) {
    setEditingItemId(item.id);
    setForm({
      divisionId: String(item.divisionId),
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      careType: item.careType,
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

    try {
      setSavingItem(true);

      const payload = {
        divisionId: Number(form.divisionId),
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        careType: form.careType,
        category,
        itemType: itemType ?? 'PROCEDURE',
      };

      const response = await fetch(
        editingItemId
          ? `${API_URL}/procedures/${editingItemId}`
          : `${API_URL}/procedures`,
        {
          method: editingItemId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `No se pudo guardar ${singularLabel.toLowerCase()}.`,
        );
      }

      setAlert({
        type: 'success',
        message: editingItemId
          ? `${singularLabel} actualizado correctamente.`
          : `${singularLabel} creado correctamente.`,
      });

      resetForm();
      await loadItems();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: `No se pudo guardar ${singularLabel.toLowerCase()}.`,
      });
    } finally {
      setSavingItem(false);
    }
  }

  async function handleToggleStatus(item: Procedure) {
    try {
      setUpdatingStatusId(item.id);

      const response = await fetch(`${API_URL}/procedures/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !item.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo actualizar el estado.');
      }

      setAlert({
        type: 'success',
        message: item.active
          ? `${singularLabel} desactivado correctamente.`
          : `${singularLabel} activado correctamente.`,
      });

      await loadItems();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: `No se pudo actualizar el estado de ${singularLabel.toLowerCase()}.`,
      });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const formTitle = useMemo(() => {
    return editingItemId
      ? `Editar ${singularLabel.toLowerCase()}`
      : `Crear ${singularLabel.toLowerCase()}`;
  }, [editingItemId, singularLabel]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 pb-10 pt-4 md:px-8 lg:px-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-500">
          Mantenedores
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0F4C81] md:text-4xl">
          {pageTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
          Administra la creación, edición y estado de {pluralLabel.toLowerCase()} por división.
        </p>
      </div>

      {alert && (
        <div
          className={[
            'mb-6 rounded-[22px] border px-5 py-4 text-sm font-medium shadow-sm',
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

      <section className="mb-6 overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_24px_60px_-38px_rgba(15,76,129,0.45)]">
        <div className="bg-gradient-to-r from-[#0F4C81] to-[#1E88C8] px-6 py-5 text-white md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Formulario
          </p>
          <h2 className="mt-1 text-xl font-bold">{formTitle}</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              División
            </label>
            <select
              value={form.divisionId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  divisionId: e.target.value,
                }))
              }
              disabled={loadingDivisions}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50"
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
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              Código
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  code: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              Tipo de atención
            </label>
            <select
              value={form.careType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  careType: e.target.value as CareType,
                }))
              }
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              <option value="BOTH">Ambos</option>
              <option value="AMBULATORY">Ambulatorio</option>
              <option value="SURGICAL">Quirúrgico</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={savingItem}
              className="rounded-2xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(15,76,129,0.9)] transition hover:bg-[#0B3B66] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingItem ? 'Guardando...' : editingItemId ? 'Actualizar' : 'Crear'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
          <h2 className="mt-1 text-xl font-bold">{pluralLabel}</h2>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-5 grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                División
              </label>
              <select
                value={selectedDivisionId}
                onChange={(e) => {
                  setSelectedDivisionId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
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
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                Buscar
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                placeholder="Código o nombre"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                Tipo
              </label>
              <select
                value={careTypeFilter}
                onChange={(e) => {
                  setCareTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Todos</option>
                <option value="BOTH">Ambos</option>
                <option value="AMBULATORY">Ambulatorio</option>
                <option value="SURGICAL">Quirúrgico</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                Estado
              </label>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadItems}
              className="rounded-2xl border border-[#0F4C81] px-5 py-3 text-sm font-bold text-[#0F4C81] transition hover:bg-sky-50"
            >
              Buscar
            </button>
          </div>

          {loadingItems ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-6 text-sm text-slate-600">
              Cargando {pluralLabel.toLowerCase()}...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-6 text-sm text-slate-600">
              No hay {pluralLabel.toLowerCase()} para los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                          {item.division?.name ?? `División ${item.divisionId}`}
                        </div>
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                            item.active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700',
                          ].join(' ')}
                        >
                          {item.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="mt-2 text-xl font-bold text-[#0F4C81]">
                        {item.name}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        Código: <span className="font-mono text-xs">{item.code}</span>
                      </div>

                      {item.description && (
                        <div className="mt-2 max-w-3xl text-sm text-slate-500">
                          {item.description}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          ID: {item.id}
                        </span>
                        <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
                          Tipo atención: {getCareTypeLabel(item.careType)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={updatingStatusId === item.id}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {updatingStatusId === item.id
                          ? 'Actualizando...'
                          : item.active
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {items.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                  <span>
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, items.length)} de {items.length}{' '}
                    {pluralLabel.toLowerCase()}
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