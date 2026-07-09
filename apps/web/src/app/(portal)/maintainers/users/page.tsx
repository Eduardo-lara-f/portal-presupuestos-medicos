

'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type UserRole =
  | 'SUPER_ADMIN'
  | 'DIVISION_ADMIN'
  | 'BUDGET_HEAD'
  | 'EXECUTIVE'
  | 'MAINTAINER'
  | 'VIEWER';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';

type Division = {
  id: number;
  name: string;
  code: string;
  status: boolean;
};

type UserItem = {
  id: number;
  divisionId?: number | null;
  name: string;
  email: string;
  role: UserRole;
  careAccess: CareType;
  status: boolean;
  division?: {
    id: number;
    name: string;
    code: string;
  } | null;
};

type AlertState = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

type UserFormState = {
  divisionId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  careAccess: CareType;
  status: boolean;
};

const INITIAL_FORM: UserFormState = {
  divisionId: '',
  name: '',
  email: '',
  password: '',
  role: 'EXECUTIVE',
  careAccess: 'BOTH',
  status: true,
};

const PAGE_SHELL =
  'mx-auto w-full max-w-[1400px] px-6 pb-10 pt-4 md:px-8 lg:px-10';
const ITEMS_PER_PAGE = 10;

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'SUPER_ADMIN', label: 'Super admin' },
  { value: 'DIVISION_ADMIN', label: 'Administrador de división' },
  { value: 'BUDGET_HEAD', label: 'Jefe de presupuesto' },
  { value: 'EXECUTIVE', label: 'Ejecutivo' },
  { value: 'MAINTAINER', label: 'Mantenedor' },
  { value: 'VIEWER', label: 'Visualizador' },
];

const CARE_ACCESS_OPTIONS: Array<{ value: CareType; label: string }> = [
  { value: 'BOTH', label: 'Ambos módulos' },
  { value: 'AMBULATORY', label: 'Solo ambulatorio' },
  { value: 'SURGICAL', label: 'Solo quirúrgico' },
];

export default function MaintainersUsersPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('true');
  const [roleFilter, setRoleFilter] = useState('');
  const [careAccessFilter, setCareAccessFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(INITIAL_FORM);

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
    void loadUsers();
  }, [selectedDivisionId, statusFilter, roleFilter, careAccessFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length, selectedDivisionId, search, statusFilter, roleFilter, careAccessFilter]);

  const pageTitle = useMemo(() => {
    return editingUserId ? 'Editar usuario' : 'Crear usuario';
  }, [editingUserId]);

  const currentRoleAllowsSegmentedCareAccess = useMemo(() => {
    return form.role === 'EXECUTIVE' || form.role === 'BUDGET_HEAD';
  }, [form.role]);

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return users.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [users, currentPage]);

  async function loadUsers() {
    try {
      setLoadingUsers(true);

      const params = new URLSearchParams();

      if (selectedDivisionId) {
        params.set('divisionId', selectedDivisionId);
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (statusFilter) {
        params.set('status', statusFilter);
      }

      if (roleFilter) {
        params.set('role', roleFilter);
      }

      if (careAccessFilter) {
        params.set('careAccess', careAccessFilter);
      }

      const url = `${API_URL}/users?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();

        console.error('Error cargando usuarios', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url,
        });

        throw new Error(errorText || 'No se pudieron cargar los usuarios.');
      }

      const data: UserItem[] = await response.json();
      setUsers(data);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los usuarios.',
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  function resetForm() {
    setEditingUserId(null);
    setForm({
      divisionId: selectedDivisionId || '',
      name: '',
      email: '',
      password: '',
      role: 'EXECUTIVE',
      careAccess: 'BOTH',
      status: true,
    });
  }

  function handleRoleChange(nextRole: UserRole) {
    setForm((prev) => ({
      ...prev,
      role: nextRole,
      careAccess:
        nextRole === 'EXECUTIVE' || nextRole === 'BUDGET_HEAD'
          ? prev.careAccess
          : 'BOTH',
    }));
  }

  function handleEdit(user: UserItem) {
    setEditingUserId(user.id);
    setForm({
      divisionId: user.divisionId ? String(user.divisionId) : '',
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      careAccess: user.careAccess ?? 'BOTH',
      status: user.status,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setAlert({
        type: 'info',
        message: 'Nombre y correo son obligatorios.',
      });
      return;
    }

    if (!editingUserId && !form.password.trim()) {
      setAlert({
        type: 'info',
        message: 'Debe ingresar una contraseña para crear el usuario.',
      });
      return;
    }

    if (form.password.trim() && form.password.trim().length < 8) {
      setAlert({
        type: 'info',
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }

    if (form.role !== 'SUPER_ADMIN' && !form.divisionId) {
      setAlert({
        type: 'info',
        message: 'Debe seleccionar una división para este usuario.',
      });
      return;
    }

    try {
      setSavingUser(true);

      const payload = {
        divisionId:
          form.role === 'SUPER_ADMIN' || !form.divisionId
            ? undefined
            : Number(form.divisionId),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim() || undefined,
        role: form.role,
        careAccess:
          form.role === 'EXECUTIVE' || form.role === 'BUDGET_HEAD'
            ? form.careAccess
            : 'BOTH',
        status: form.status,
      };

      const response = await fetch(
        editingUserId
          ? `${API_URL}/users/${editingUserId}`
          : `${API_URL}/users`,
        {
          method: editingUserId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo guardar el usuario.');
      }

      setAlert({
        type: 'success',
        message: editingUserId
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.',
      });

      resetForm();
      await loadUsers();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar el usuario.',
      });
    } finally {
      setSavingUser(false);
    }
  }

  async function handleToggleStatus(user: UserItem) {
    try {
      setUpdatingStatusId(user.id);

      const response = await fetch(`${API_URL}/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: !user.status,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo actualizar el estado.');
      }

      setAlert({
        type: 'success',
        message: user.status
          ? 'Usuario desactivado correctamente.'
          : 'Usuario activado correctamente.',
      });

      await loadUsers();
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'No se pudo actualizar el estado del usuario.',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  function getRoleLabel(role: UserRole) {
    return (
      ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role
    );
  }

  function getCareAccessLabel(careAccess: CareType) {
    return (
      CARE_ACCESS_OPTIONS.find((item) => item.value === careAccess)?.label ?? careAccess
    );
  }

  return (
    <div className={PAGE_SHELL}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              Configuración del mantenedor
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F4C81] md:text-4xl">
              Mantenedor de usuarios
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              Administre usuarios, roles, estado y acceso clínico por módulo.
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
                    disabled={loadingDivisions || form.role === 'SUPER_ADMIN'}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    Correo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder={editingUserId ? 'Solo ingrese si desea cambiarla' : 'Mínimo 8 caracteres'}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                    Rol
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                    Acceso clínico
                  </label>
                  <select
                    value={currentRoleAllowsSegmentedCareAccess ? form.careAccess : 'BOTH'}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        careAccess: e.target.value as CareType,
                      }))
                    }
                    disabled={!currentRoleAllowsSegmentedCareAccess}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {CARE_ACCESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <span className="font-semibold">Regla de acceso:</span>{' '}
                {currentRoleAllowsSegmentedCareAccess
                  ? 'Este rol puede restringirse a solo ambulatorio, solo quirúrgico o ambos módulos.'
                  : 'Este rol debe quedar con acceso a ambos módulos.'}
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4">
                <input
                  id="user-status"
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="user-status" className="text-sm font-medium text-slate-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingUser}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingUser
                    ? 'Guardando...'
                    : editingUserId
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
              <h2 className="mt-1 text-2xl font-bold text-[#0F4C81]">Listado de usuarios</h2>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <div className="mb-5 grid gap-4 md:grid-cols-5">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                  División
                </label>
                <select
                  value={selectedDivisionId}
                  onChange={(e) => setSelectedDivisionId(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Todas</option>
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
                  placeholder="Nombre o correo"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                  Rol
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Todos</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F4C81]">
                  Módulo
                </label>
                <select
                  value={careAccessFilter}
                  onChange={(e) => setCareAccessFilter(e.target.value)}
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Todos</option>
                  {CARE_ACCESS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Buscar
              </button>
            </div>

            {loadingUsers ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                Cargando usuarios...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-sm text-slate-600">
                No hay usuarios para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]"
                  >
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                            {user.division?.name ?? 'Sin división'}
                          </div>
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                              user.status
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-700',
                            ].join(' ')}
                          >
                            {user.status ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="mt-2 text-xl font-bold text-[#0F4C81]">
                          {user.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">{user.email}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-white px-3 py-1 border border-sky-100">
                            Rol: {getRoleLabel(user.role)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 border border-sky-100">
                            Acceso: {getCareAccessLabel(user.careAccess)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(user)}
                          disabled={updatingStatusId === user.id}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {updatingStatusId === user.id
                            ? 'Actualizando...'
                            : user.status
                              ? 'Desactivar'
                              : 'Activar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.length > ITEMS_PER_PAGE && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                    <span>
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, users.length)} de {users.length} usuarios
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
                        onClick={() =>
                          setCurrentPage((page) => Math.min(totalPages, page + 1))
                        }
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
    </div>
  );
}