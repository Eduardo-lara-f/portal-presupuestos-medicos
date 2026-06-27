'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type PriceMode = 'AGREEMENT_PRICE' | 'FIXED_PRICE';
type PackageKind = 'CONVENTIONAL' | 'PAD';

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
  packageType?: PackageKind | string | null;
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
  packageType: PackageKind;
  items: PackageFormItem[];
};

const INITIAL_FORM: PackageFormState = {
  divisionId: '',
  code: '',
  name: '',
  description: '',
  packageType: 'CONVENTIONAL',
  items: [],
};

const PAGE_SHELL =
  'mx-auto w-full max-w-[1400px] px-6 pb-10 pt-4 md:px-8 lg:px-10';

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
      packageType: 'CONVENTIONAL',
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
      packageType: pkg.packageType === 'PAD' ? 'PAD' : 'CONVENTIONAL',
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
        packageType: form.packageType,
        items: form.items.map((item) => ({
          procedureId: Number(item.procedureId),
          quantity: Number(item.quantity),
          priceMode: item.priceMode,
          fixedPrice:
            item.priceMode === 'FIXED_PRICE' && item.fixedPrice.trim()
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
    <div className={PAGE_SHELL}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              Configuracion del mantenedor
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F4C81] md:text-4xl">
              Mantenedor de paquetes
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              Administre paquetes clinicos por division, agregue prestaciones y configure el modo de precio de cada componente.
            </p>
          </div>
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

        <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_15px_50px_-20px_rgba(15,76,129,0.22)]">
          <div className="border-b border-sky-100 bg-gradient-to-r from-[#0F4C81] via-[#1769aa] to-[#2C8ED6] px-6 py-5 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/90">
                Formulario
              </p>
              <h2 className="mt-1 text-2xl font-bold">{pageTitle}</h2>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                    Division
                  </label>
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
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Seleccione division</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                    Codigo
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
                    Descripcion
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                    Tipo de paquete
                  </label>
                  <select
                    value={form.packageType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        packageType: e.target.value as PackageKind,
                      }))
                    }
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="CONVENTIONAL">Convencional</option>
                    <option value="PAD">PAD</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <span className="font-semibold">Regla de emision:</span>{' '}
                {form.packageType === 'PAD'
                  ? 'Los paquetes PAD se identifican para aplicar la regla especial en emision: calculo al 50% del valor total y al 25% cuando corresponda a parto o cesarea.'
                  : 'Los paquetes convencionales mantienen el comportamiento normal de emision y pueden considerar campanas de descuento sobre honorarios.'}
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-[#0F4C81]">Prestaciones del paquete</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Agregue prestaciones a la composicion del paquete y defina si usan precio convenio o precio fijo.
                  </p>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={procedureToAdd}
                    onChange={(e) => setProcedureToAdd(e.target.value)}
                    disabled={!form.divisionId || loadingProcedures}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Seleccione prestacion</option>
                    {procedureOptions.map((procedure) => (
                      <option key={procedure.id} value={procedure.id}>
                        {procedure.code} - {procedure.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={addProcedureToForm}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Agregar
                  </button>
                </div>

                {form.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-6 text-sm text-slate-500">
                    No hay prestaciones agregadas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.items.map((item, index) => (
                      <div
                        key={`${item.procedureId}-${index}`}
                        className="grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 md:grid-cols-[2fr_110px_180px_150px_auto]"
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
                          className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                          placeholder="Cantidad"
                        />

                        <select
                          value={item.priceMode}
                          onChange={(e) =>
                            updateFormItem(index, 'priceMode', e.target.value)
                          }
                          className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
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
                          className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                          placeholder="Precio fijo"
                        />

                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
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
                  disabled={savingPackage}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
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
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_15px_50px_-20px_rgba(15,76,129,0.22)]">
          <div className="border-b border-sky-100 bg-sky-50 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                Consulta
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#0F4C81]">Listado de paquetes</h2>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                  Division
                </label>
                <select
                  value={selectedDivisionId}
                  onChange={(e) => setSelectedDivisionId(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Seleccione division</option>
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
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  placeholder="Codigo o nombre"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                  Estado
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={loadPackages}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Buscar
              </button>
            </div>

            {loadingPackages ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                Cargando paquetes...
              </div>
            ) : packages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                No hay paquetes para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]"
                  >
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                            {pkg.division?.name ?? pkg.divisionId}
                          </div>
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                              pkg.packageType === 'PAD'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-700',
                            ].join(' ')}
                          >
                            {pkg.packageType === 'PAD' ? 'PAD' : 'Convencional'}
                          </span>
                        </div>
                        <div className="mt-2 text-xl font-bold text-[#0F4C81]">
                          {pkg.code} - {pkg.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {pkg.description ?? 'Sin descripcion'}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(pkg)}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(pkg)}
                          disabled={updatingStatusId === pkg.id}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
                      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#0F4C81]">
                        Prestaciones
                      </div>
                      {pkg.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-4 text-slate-500">
                          Sin prestaciones.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pkg.items.map((item, index) => (
                            <div
                              key={`${pkg.id}-${item.procedureId}-${index}`}
                              className="rounded-2xl border border-sky-100 bg-white px-4 py-3"
                            >
                              <div className="font-medium text-slate-800">
                                {item.procedure?.code} - {item.procedure?.name}
                              </div>
                              <div className="mt-1 text-slate-500">
                                Cantidad: {item.quantity} · Modo: {item.priceMode}
                                {item.fixedPrice !== undefined && item.fixedPrice !== null
                                  ? ` · Precio fijo: ${item.fixedPrice}`
                                  : ''}
                                {pkg.packageType === 'PAD'
                                  ? ' · Regla PAD en emision'
                                  : ' · Regla convencional en emision'}
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
          </div>
        </section>
      </div>
    </div>
  );
}