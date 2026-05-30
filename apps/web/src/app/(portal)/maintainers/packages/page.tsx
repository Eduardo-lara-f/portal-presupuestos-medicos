'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type PriceMode = 'AGREEMENT_PRICE' | 'FIXED_PRICE';

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

type PackageItem = {
  procedureId: number;
  quantity: number;
  priceMode: string;
  fixedPrice?: string | null;
  procedure?: {
    id: number;
    code: string;
    name: string;
    category?: string | null;
    careType: CareType;
    active: boolean;
  };
};

type MedicalPackage = {
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
  items: PackageItem[];
};

type AlertState = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

type PackageFormItem = {
  procedureId: string;
  quantity: string;
  priceMode: PriceMode;
  fixedPrice: string;
};

type PackageFormState = {
  divisionId: string;
  code: string;
  name: string;
  description: string;
  items: PackageFormItem[];
};

const INITIAL_FORM: PackageFormState = {
  divisionId: '',
  code: '',
  name: '',
  description: '',
  items: [],
};

export default function MaintainersPackagesPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [packages, setPackages] = useState<MedicalPackage[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [savingPackage, setSavingPackage] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [form, setForm] = useState<PackageFormState>(INITIAL_FORM);

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
    loadPackages();
  }, [selectedDivisionId, activeFilter]);

  useEffect(() => {
    if (!form.divisionId) {
      setProcedures([]);
      return;
    }

    loadProceduresByDivision(form.divisionId);
  }, [form.divisionId]);

  async function loadPackages() {
    try {
      setLoadingPackages(true);

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

      const response = await fetch(`${API_URL}/packages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los paquetes.');
      }

      const data: MedicalPackage[] = await response.json();
      setPackages(data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudieron cargar los paquetes.',
      });
    } finally {
      setLoadingPackages(false);
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
    setEditingPackageId(null);
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
            priceMode: 'AGREEMENT_PRICE',
            fixedPrice: '',
          },
        ],
      };
    });

    setProcedureToAdd('');
  }

  function updateFormItem(
    index: number,
    field: keyof PackageFormItem,
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

  function handleEdit(pkg: MedicalPackage) {
    setEditingPackageId(pkg.id);
    setProcedureToAdd('');

    setForm({
      divisionId: String(pkg.divisionId),
      code: pkg.code,
      name: pkg.name,
      description: pkg.description ?? '',
      items: pkg.items.map((item) => ({
        procedureId: String(item.procedureId),
        quantity: String(item.quantity),
        priceMode:
          item.priceMode === 'FIXED_PRICE'
            ? 'FIXED_PRICE'
            : 'AGREEMENT_PRICE',
        fixedPrice:
          item.fixedPrice !== undefined && item.fixedPrice !== null
            ? String(item.fixedPrice)
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
        message: 'Debe agregar al menos una prestación al paquete.',
      });
      return;
    }

    const invalidFixedPrice = form.items.some(
      (item) =>
        item.priceMode === 'FIXED_PRICE' &&
        (!item.fixedPrice.trim() || Number(item.fixedPrice) < 0),
    );

    if (invalidFixedPrice) {
      setAlert({
        type: 'info',
        message: 'Los ítems con FIXED_PRICE deben tener un precio fijo válido.',
      });
      return;
    }

    try {
      setSavingPackage(true);

      const payload = {
        divisionId: Number(form.divisionId),
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        items: form.items.map((item) => ({
          procedureId: Number(item.procedureId),
          quantity: Number(item.quantity),
          priceMode: item.priceMode,
          fixedPrice:
            item.priceMode === 'FIXED_PRICE'
              ? Number(item.fixedPrice)
              : undefined,
        })),
      };

      const response = await fetch(
        editingPackageId
          ? `${API_URL}/packages/${editingPackageId}`
          : `${API_URL}/packages`,
        {
          method: editingPackageId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo guardar el paquete.');
      }

      setAlert({
        type: 'success',
        message: editingPackageId
          ? 'Paquete actualizado correctamente.'
          : 'Paquete creado correctamente.',
      });

      resetForm();
      await loadPackages();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo guardar el paquete.',
      });
    } finally {
      setSavingPackage(false);
    }
  }

  async function handleToggleStatus(pkg: MedicalPackage) {
    try {
      setUpdatingStatusId(pkg.id);

      const response = await fetch(`${API_URL}/packages/${pkg.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !pkg.active,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo actualizar el estado.');
      }

      setAlert({
        type: 'success',
        message: pkg.active
          ? 'Paquete desactivado correctamente.'
          : 'Paquete activado correctamente.',
      });

      await loadPackages();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo actualizar el estado del paquete.',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const pageTitle = useMemo(() => {
    return editingPackageId ? 'Editar paquete' : 'Crear paquete';
  }, [editingPackageId]);

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
        <h1 className="text-xl font-semibold">Mantenedor de paquetes</h1>
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
            <h3 className="mb-3 text-sm font-medium">Prestaciones del paquete</h3>

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
                    className="grid gap-3 rounded border border-slate-200 p-3 md:grid-cols-[2fr_110px_160px_140px_auto]"
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

                    <select
                      value={item.priceMode}
                      onChange={(e) =>
                        updateFormItem(index, 'priceMode', e.target.value)
                      }
                      className="rounded border border-slate-300 px-3 py-2"
                    >
                      <option value="AGREEMENT_PRICE">AGREEMENT_PRICE</option>
                      <option value="FIXED_PRICE">FIXED_PRICE</option>
                    </select>

                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.fixedPrice}
                      onChange={(e) =>
                        updateFormItem(index, 'fixedPrice', e.target.value)
                      }
                      disabled={item.priceMode !== 'FIXED_PRICE'}
                      className="rounded border border-slate-300 px-3 py-2"
                      placeholder="Precio fijo"
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
              disabled={savingPackage}
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
            >
              {savingPackage
                ? 'Guardando...'
                : editingPackageId
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
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={loadPackages}
            className="rounded border border-slate-900 px-4 py-2 text-sm"
          >
            Buscar
          </button>
        </div>

        {loadingPackages ? (
          <div>Cargando paquetes...</div>
        ) : packages.length === 0 ? (
          <div>No hay paquetes para los filtros seleccionados.</div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded border border-slate-300 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">
                      {pkg.division?.name ?? pkg.divisionId}
                    </div>
                    <div className="text-base font-semibold">
                      {pkg.code} - {pkg.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {pkg.description ?? 'Sin descripción'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(pkg)}
                      className="rounded border border-slate-300 px-3 py-1 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(pkg)}
                      disabled={updatingStatusId === pkg.id}
                      className="rounded border border-slate-300 px-3 py-1 text-sm"
                    >
                      {updatingStatusId === pkg.id
                        ? 'Actualizando...'
                        : pkg.active
                        ? 'Desactivar'
                        : 'Activar'}
                    </button>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="mb-2 font-medium">Prestaciones:</div>
                  {pkg.items.length === 0 ? (
                    <div className="text-slate-500">Sin prestaciones.</div>
                  ) : (
                    <div className="space-y-2">
                      {pkg.items.map((item, index) => (
                        <div
                          key={`${pkg.id}-${item.procedureId}-${index}`}
                          className="rounded border border-slate-200 px-3 py-2"
                        >
                          <div>
                            {item.procedure?.code} - {item.procedure?.name}
                          </div>
                          <div className="text-slate-500">
                            Cantidad: {item.quantity} · Modo: {item.priceMode}
                            {item.fixedPrice !== undefined &&
                            item.fixedPrice !== null
                              ? ` · Precio fijo: ${item.fixedPrice}`
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