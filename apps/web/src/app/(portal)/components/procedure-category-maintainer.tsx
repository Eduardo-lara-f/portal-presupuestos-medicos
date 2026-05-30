'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type ProcedureCategory = 'SUPPLY' | 'DRUG' | 'BED';

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

export default function ProcedureCategoryMaintainer({
  category,
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

  async function loadItems() {
    try {
      setLoadingItems(true);

      const params = new URLSearchParams();

      if (selectedDivisionId) {
        params.set('divisionId', selectedDivisionId);
      }

      params.set('category', category);

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
        throw new Error(errorText || `No se pudo guardar ${singularLabel.toLowerCase()}.`);
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
    return editingItemId ? `Editar ${singularLabel.toLowerCase()}` : `Crear ${singularLabel.toLowerCase()}`;
  }, [editingItemId, singularLabel]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
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
        <h2 className="mb-4 text-base font-medium">{formTitle}</h2>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">División</label>
            <select
              value={form.divisionId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  divisionId: e.target.value,
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
            <label className="mb-1 block text-sm">Tipo de atención</label>
            <select
              value={form.careType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  careType: e.target.value as CareType,
                }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="BOTH">BOTH</option>
              <option value="AMBULATORY">AMBULATORY</option>
              <option value="SURGICAL">SURGICAL</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={savingItem}
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
            >
              {savingItem
                ? 'Guardando...'
                : editingItemId
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
              placeholder="Código o nombre"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Tipo</label>
            <select
              value={careTypeFilter}
              onChange={(e) => setCareTypeFilter(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="BOTH">BOTH</option>
              <option value="AMBULATORY">AMBULATORY</option>
              <option value="SURGICAL">SURGICAL</option>
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
            onClick={loadItems}
            className="rounded border border-slate-900 px-4 py-2 text-sm"
          >
            Buscar
          </button>
        </div>

        {loadingItems ? (
          <div>Cargando {pluralLabel.toLowerCase()}...</div>
        ) : items.length === 0 ? (
          <div>No hay {pluralLabel.toLowerCase()} para los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left">ID</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">División</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Código</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Nombre</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Tipo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Activo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-slate-300 px-3 py-2">{item.id}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {item.division?.name ?? item.divisionId}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{item.code}</td>
                    <td className="border border-slate-300 px-3 py-2">{item.name}</td>
                    <td className="border border-slate-300 px-3 py-2">{item.careType}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {item.active ? 'Sí' : 'No'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded border border-slate-300 px-3 py-1"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={updatingStatusId === item.id}
                          className="rounded border border-slate-300 px-3 py-1"
                        >
                          {updatingStatusId === item.id
                            ? 'Actualizando...'
                            : item.active
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