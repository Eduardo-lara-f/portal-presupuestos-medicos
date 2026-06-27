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
  division?: {
    id: number;
    name: string;
    code: string;
  };
};

type ProcedureFormState = {
  divisionId: string;
  code: string;
  name: string;
  description: string;
  category: string;
  careType: CareType;
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

const INITIAL_FORM: ProcedureFormState = {
  divisionId: '',
  code: '',
  name: '',
  description: '',
  category: '',
  careType: 'BOTH',
};

export default function MaintainersProceduresPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [savingProcedure, setSavingProcedure] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [selectedDivisionName, setSelectedDivisionName] = useState('-');
  const [search, setSearch] = useState('');
  const [careTypeFilter, setCareTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('true');

  const [editingProcedureId, setEditingProcedureId] = useState<number | null>(null);
  const [form, setForm] = useState<ProcedureFormState>(INITIAL_FORM);

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
      setAuthUser(parsedAuthUser);

      const divisionId =
        parsedAuthUser?.divisionId ?? parsedAuthUser?.division?.id ?? null;
      const divisionName = parsedAuthUser?.division?.name ?? '-';

      if (typeof divisionId === 'number') {
        const nextDivisionId = String(divisionId);
        setSelectedDivisionId(nextDivisionId);
        setSelectedDivisionName(divisionName);
        setForm((prev) => ({
          ...prev,
          divisionId: nextDivisionId,
        }));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

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

        if (selectedDivisionId) {
          const currentDivision = data.find(
            (division) => String(division.id) === selectedDivisionId,
          );

          if (currentDivision) {
            setSelectedDivisionName(currentDivision.name);
          }
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
  }, [selectedDivisionId]);

  useEffect(() => {
    if (!selectedDivisionId) return;

    loadProcedures();
  }, [selectedDivisionId, careTypeFilter, activeFilter]);

  async function loadProcedures() {
    try {
      setLoadingProcedures(true);

      const params = new URLSearchParams();

      if (selectedDivisionId) {
        params.set('divisionId', selectedDivisionId);
      }

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
        throw new Error('No se pudieron cargar las prestaciones.');
      }

      const data: Procedure[] = await response.json();
      setProcedures(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar las prestaciones.',
      });
    } finally {
      setLoadingProcedures(false);
    }
  }

  function resetForm() {
    setEditingProcedureId(null);
    setForm({
      divisionId: selectedDivisionId || '',
      code: '',
      name: '',
      description: '',
      category: '',
      careType: 'BOTH',
    });
  }

  function handleEdit(procedure: Procedure) {
    setEditingProcedureId(procedure.id);
    setForm({
      divisionId: selectedDivisionId || String(procedure.divisionId),
      code: procedure.code,
      name: procedure.name,
      description: procedure.description ?? '',
      category: procedure.category ?? '',
      careType: procedure.careType,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDivisionId) {
      setAlert({
        type: 'error',
        message: 'No se pudo identificar la división asignada del usuario.',
      });
      return;
    }
    if (!form.divisionId || !form.code.trim() || !form.name.trim()) {
      setAlert({
        type: 'info',
        message: 'División, código y nombre son obligatorios.',
      });
      return;
    }

    try {
      setSavingProcedure(true);

      const payload = {
        divisionId: Number(selectedDivisionId),
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        careType: form.careType,
      };

      const response = await fetch(
        editingProcedureId
          ? `${API_URL}/procedures/${editingProcedureId}`
          : `${API_URL}/procedures`,
        {
          method: editingProcedureId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo guardar la prestación.');
      }

      setAlert({
        type: 'success',
        message: editingProcedureId
          ? 'Prestación actualizada correctamente.'
          : 'Prestación creada correctamente.',
      });

      resetForm();
      await loadProcedures();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo guardar la prestación.',
      });
    } finally {
      setSavingProcedure(false);
    }
  }

  async function handleToggleStatus(procedure: Procedure) {
    try {
      setUpdatingStatusId(procedure.id);

      const response = await fetch(`${API_URL}/procedures/${procedure.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !procedure.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo actualizar el estado.');
      }

      setAlert({
        type: 'success',
        message: procedure.active
          ? 'Prestación desactivada correctamente.'
          : 'Prestación activada correctamente.',
      });

      await loadProcedures();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo actualizar el estado de la prestación.',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const pageTitle = useMemo(() => {
    return editingProcedureId ? 'Editar prestación' : 'Crear prestación';
  }, [editingProcedureId]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 md:px-10 lg:px-14 xl:px-20 2xl:px-24">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold md:text-3xl">Mantenedor de prestaciones</h1>
        <div className="mx-auto max-w-4xl rounded border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700 shadow-sm md:text-base">
          <span className="font-semibold text-[#0F4C81]">División asignada:</span>{' '}
          {selectedDivisionName}
        </div>
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

      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-300 bg-white p-4 shadow-sm md:p-5 lg:p-6">
        <h2 className="mb-4 text-base font-medium">{pageTitle}</h2>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">División</label>
            <input
              type="text"
              value={selectedDivisionName}
              disabled
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700"
            />
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
            <label className="mb-1 block text-sm">Categoría</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value,
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
              <option value="BOTH">Ambos</option>
              <option value="AMBULATORY">Ambulatorio</option>
              <option value="SURGICAL">Quirúrgico</option>
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
              disabled={savingProcedure}
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
            >
              {savingProcedure
                ? 'Guardando...'
                : editingProcedureId
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

      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300 bg-white p-4 shadow-sm md:p-5 lg:p-6">
        <h2 className="mb-4 text-base font-medium">Listado</h2>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
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
              <option value="BOTH">Ambos</option>
              <option value="AMBULATORY">Ambulatorio</option>
              <option value="SURGICAL">Quirúrgico</option>
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
            onClick={loadProcedures}
            className="rounded border border-slate-900 px-4 py-2 text-sm"
          >
            Buscar
          </button>
        </div>

        {loadingProcedures ? (
          <div>Cargando prestaciones...</div>
        ) : procedures.length === 0 ? (
          <div>No hay prestaciones para los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left">ID</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">División</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Código</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Nombre</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Categoría</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Tipo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Activo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((procedure) => (
                  <tr key={procedure.id}>
                    <td className="border border-slate-300 px-3 py-2">{procedure.id}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {procedure.division?.name ?? procedure.divisionId}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{procedure.code}</td>
                    <td className="border border-slate-300 px-3 py-2">{procedure.name}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {procedure.category ?? '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{procedure.careType}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {procedure.active ? 'Sí' : 'No'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(procedure)}
                          className="rounded border border-slate-300 px-3 py-1"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(procedure)}
                          disabled={updatingStatusId === procedure.id}
                          className="rounded border border-slate-300 px-3 py-1"
                        >
                          {updatingStatusId === procedure.id
                            ? 'Actualizando...'
                            : procedure.active
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