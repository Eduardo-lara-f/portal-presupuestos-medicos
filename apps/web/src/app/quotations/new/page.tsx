'use client';

import React, { JSX, useEffect, useMemo, useState } from 'react';

type CareType = 'AMBULATORY' | 'SURGICAL';
type Step = 0 | 1 | 2 | 3;

type Division = {
  id: number;
  name: string;
  code: string;
  status: boolean;
};

type PatientResponse = {
  id: number;
  divisionId: number;
  rut: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
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
  code: string;
  active: boolean;
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

type ProcedurePriceResponse = {
  id: number;
  divisionId: number;
  procedureId: number;
  coverageType: string;
  isapreId?: number | null;
  isaprePlanId?: number | null;
  price: string;
  currency: string;
  active: boolean;
};

type BudgetItem = {
  localId: string;
  procedureId: number;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type AlertState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NewQuotationPage() {
  const [careType, setCareType] = useState<CareType | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(0);

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');

  const [loadingPatient, setLoadingPatient] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientFound, setPatientFound] = useState<boolean | null>(null);

  const [rut, setRut] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isapres, setIsapres] = useState<Isapre[]>([]);
  const [loadingIsapres, setLoadingIsapres] = useState(false);
  const [selectedIsapreId, setSelectedIsapreId] = useState<string>('');

  const [plans, setPlans] = useState<IsaprePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const [procedureSearch, setProcedureSearch] = useState('');
  const [procedureResults, setProcedureResults] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [addingProcedureId, setAddingProcedureId] = useState<number | null>(
    null,
  );

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [discountTotal, setDiscountTotal] = useState<string>('0');
  const [notes, setNotes] = useState('');

  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!alert) {
      return;
    }

    const duration = alert.type === 'error' ? 7000 : 4500;

    const timer = window.setTimeout(() => {
      setAlert(null);
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [alert]);

  const stepTitle = useMemo(() => {
    const titles: Record<Step, string> = {
      0: 'Tipo de presupuesto',
      1: 'Datos del paciente',
      2: 'Presupuesto',
      3: 'Resumen y PDF',
    };
    return titles[currentStep];
  }, [currentStep]);

  const subtotal = useMemo(() => {
    return budgetItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [budgetItems]);

  const total = useMemo(() => {
    return subtotal - Number(discountTotal || 0);
  }, [subtotal, discountTotal]);

  const selectedIsapreName = useMemo(() => {
    return (
      isapres.find((item) => String(item.id) === selectedIsapreId)?.name ?? '-'
    );
  }, [isapres, selectedIsapreId]);

  const selectedPlanName = useMemo(() => {
    return plans.find((item) => String(item.id) === selectedPlanId)?.name ?? '-';
  }, [plans, selectedPlanId]);

  useEffect(() => {
    const loadDivisions = async () => {
      try {
        setLoadingDivisions(true);
        setAlert(null);

        const response = await fetch(`${API_URL}/divisions`);

        if (!response.ok) {
          throw new Error('No se pudieron cargar las divisiones.');
        }

        const data: Division[] = await response.json();
        setDivisions(data);

        if (data.length > 0) {
          setSelectedDivisionId(String(data[0].id));
        }
      } catch (error) {
        console.error(error);
        setAlert({
          type: 'error',
          message:
            'No fue posible cargar las divisiones. Verifique que la API esté levantada y accesible.',
        });
      } finally {
        setLoadingDivisions(false);
      }
    };

    loadDivisions();
  }, []);

  useEffect(() => {
    const loadIsapres = async () => {
      if (!selectedDivisionId) {
        setIsapres([]);
        setSelectedIsapreId('');
        setPlans([]);
        setSelectedPlanId('');
        return;
      }

      try {
        setLoadingIsapres(true);

        const response = await fetch(
          `${API_URL}/isapres?divisionId=${selectedDivisionId}`,
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar las isapres.');
        }

        const data: Isapre[] = await response.json();
        setIsapres(data);
        setSelectedIsapreId('');
        setPlans([]);
        setSelectedPlanId('');
      } catch (error) {
        console.error(error);
        setAlert({
          type: 'error',
          message:
            'No se pudieron cargar las isapres de la división seleccionada.',
        });
      } finally {
        setLoadingIsapres(false);
      }
    };

    loadIsapres();
  }, [selectedDivisionId]);

  useEffect(() => {
    const loadPlans = async () => {
      if (!selectedIsapreId) {
        setPlans([]);
        setSelectedPlanId('');
        return;
      }

      try {
        setLoadingPlans(true);

        const response = await fetch(
          `${API_URL}/isapres/${selectedIsapreId}/plans`,
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar los planes.');
        }

        const data: IsaprePlan[] = await response.json();
        setPlans(data);
        setSelectedPlanId('');
      } catch (error) {
        console.error(error);
        setAlert({
          type: 'error',
          message: 'No se pudieron cargar los planes de la isapre seleccionada.',
        });
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [selectedIsapreId]);

  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const selectCareType = (value: CareType) => {
    setCareType(value);
    setCurrentStep(1);
    setAlert(null);
  };

  const resetPatientForm = () => {
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  const safeParseJson = async <T,>(response: Response): Promise<T | null> => {
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      return null;
    }

    const text = await response.text();

    if (!text.trim()) {
      return null;
    }

    return JSON.parse(text) as T;
  };

  const getApiErrorMessage = async (
    response: Response,
    fallbackMessage: string,
  ) => {
    try {
      const data = await safeParseJson<{ message?: string | string[] }>(
        response,
      );

      if (Array.isArray(data?.message)) {
        return data.message.join(', ');
      }

      if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
      }

      return fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const normalizeRut = (value: string) => {
    const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();

    if (cleaned.length < 2) {
      return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    return `${body}-${dv}`;
  };

  const formatRut = (value: string) => {
    const normalized = normalizeRut(value);

    if (!normalized.includes('-')) {
      return normalized;
    }

    const [body, dv] = normalized.split('-');
    const reversed = body.split('').reverse().join('');
    const withDotsReversed = reversed.replace(/(\d{3})(?=\d)/g, '$1.');
    const formattedBody = withDotsReversed.split('').reverse().join('');

    return `${formattedBody}-${dv}`;
  };

  const isValidRut = (value: string) => {
    const normalized = normalizeRut(value);

    if (!/^\d+-[\dK]$/.test(normalized)) {
      return false;
    }

    const [body, dv] = normalized.split('-');

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i -= 1) {
      sum += Number(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);

    let expectedDv = '';
    if (remainder === 11) {
      expectedDv = '0';
    } else if (remainder === 10) {
      expectedDv = 'K';
    } else {
      expectedDv = String(remainder);
    }

    return dv === expectedDv;
  };

  const handleRutChange = (value: string) => {
    setRut(value);
  };

  const handleRutBlur = () => {
    if (!rut.trim()) {
      return;
    }

    setRut(formatRut(rut));
  };

  const handleSearchPatient = async () => {
    if (!rut.trim() || !selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Debe seleccionar división e ingresar un RUT antes de buscar.',
      });
      return;
    }

    if (!isValidRut(rut)) {
      setAlert({
        type: 'warning',
        message: 'El RUT ingresado no es válido.',
      });
      return;
    }

    const normalizedRut = normalizeRut(rut);

    try {
      setLoadingPatient(true);
      setAlert(null);

      const response = await fetch(
        `${API_URL}/patients/by-rut/${encodeURIComponent(
          normalizedRut,
        )}?divisionId=${selectedDivisionId}`,
      );

      if (!response.ok) {
        throw new Error('La búsqueda del paciente falló.');
      }

      const data = await safeParseJson<PatientResponse | null>(response);

      if (data) {
        setPatientId(data.id);
        setPatientFound(true);
        setRut(formatRut(data.rut ?? normalizedRut));
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setMiddleName(data.middleName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');

        setAlert({
          type: 'success',
          message: `Paciente encontrado correctamente. ID interno: ${data.id}.`,
        });
      } else {
        setPatientId(null);
        setPatientFound(false);
        setRut(formatRut(normalizedRut));
        resetPatientForm();

        setAlert({
          type: 'info',
          message:
            'No existe un paciente con ese RUT en la división seleccionada. Puede completar los datos para crearlo.',
        });
      }
    } catch (error) {
      console.error(error);
      setPatientFound(null);
      setAlert({
        type: 'error',
        message:
          'Ocurrió un error al buscar el paciente. Revise la conexión con la API y vuelva a intentarlo.',
      });
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleContinueFromPatientStep = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();

    if (currentStep !== 1) {
      goToNextStep();
      return;
    }

    if (patientId) {
      goToNextStep();
      return;
    }

    if (
      !selectedDivisionId ||
      !rut.trim() ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      setAlert({
        type: 'warning',
        message:
          'Complete división, RUT, nombres y apellidos antes de continuar.',
      });
      return;
    }

    if (!isValidRut(rut)) {
      setAlert({
        type: 'warning',
        message: 'El RUT ingresado no es válido.',
      });
      return;
    }

    const normalizedRut = normalizeRut(rut);

    try {
      setSavingPatient(true);
      setAlert(null);

      const response = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionId: Number(selectedDivisionId),
          rut: normalizedRut,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear el paciente.');
      }

      const data = await safeParseJson<PatientResponse>(response);

      if (!data?.id) {
        throw new Error('La API no devolvió un paciente válido.');
      }

      setPatientId(data.id);
      setPatientFound(true);
      setRut(formatRut(data.rut ?? normalizedRut));
      setAlert({
        type: 'success',
        message: `Paciente creado correctamente. ID interno: ${data.id}.`,
      });

      setCurrentStep(2);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message:
          'Ocurrió un error al crear el paciente. Revise la API y vuelva a intentar.',
      });
    } finally {
      setSavingPatient(false);
    }
  };

  const handleSearchProcedures = async () => {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de buscar prestaciones.',
      });
      return;
    }

    if (!procedureSearch.trim()) {
      setAlert({
        type: 'warning',
        message: 'Ingrese un nombre o código para buscar prestaciones.',
      });
      return;
    }

    try {
      setLoadingProcedures(true);
      setAlert(null);

      const params = new URLSearchParams({
        divisionId: selectedDivisionId,
        search: procedureSearch.trim(),
      });

      const response = await fetch(`${API_URL}/procedures?${params.toString()}`);

      if (!response.ok) {
        throw new Error('No se pudieron cargar las prestaciones.');
      }

      const data: Procedure[] = await response.json();

      const filtered = careType
        ? data.filter((item) => item.careType === careType)
        : data;

      setProcedureResults(filtered);

      if (!filtered.length) {
        setAlert({
          type: 'info',
          message:
            'No se encontraron prestaciones para la búsqueda realizada y la modalidad seleccionada.',
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'Ocurrió un error al buscar prestaciones.',
      });
    } finally {
      setLoadingProcedures(false);
    }
  };

  const handleAddProcedure = async (procedure: Procedure) => {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de agregar prestaciones.',
      });
      return;
    }

    if (!selectedIsapreId || !selectedPlanId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione isapre y plan antes de agregar una prestación.',
      });
      return;
    }

    try {
      setAddingProcedureId(procedure.id);
      setAlert(null);

      const params = new URLSearchParams({
        divisionId: selectedDivisionId,
        procedureId: String(procedure.id),
        coverageType: 'ISAPRE_PLAN',
        isapreId: selectedIsapreId,
        isaprePlanId: selectedPlanId,
      });

      const response = await fetch(
        `${API_URL}/procedure-prices/resolve?${params.toString()}`,
      );

      if (!response.ok) {
        let fallbackMessage = 'No se pudo resolver el precio de la prestación.';

        if (response.status === 404) {
          fallbackMessage =
            'No existe un precio configurado para esta prestación con la cobertura seleccionada.';
        }

        const apiMessage = await getApiErrorMessage(response, fallbackMessage);

        setAlert({
          type: 'error',
          message: apiMessage,
        });

        return;
      }

      const priceData: ProcedurePriceResponse = await response.json();
      const unitPrice = Number(priceData.price);

      setBudgetItems((prev) => {
        const existing = prev.find((item) => item.procedureId === procedure.id);

        if (existing) {
          return prev.map((item) =>
            item.procedureId === procedure.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  totalPrice: (item.quantity + 1) * item.unitPrice,
                }
              : item,
          );
        }

        return [
          ...prev,
          {
            localId: `${procedure.id}-${Date.now()}`,
            procedureId: procedure.id,
            code: procedure.code,
            name: procedure.name,
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice,
          },
        ];
      });

      setAlert({
        type: 'success',
        message: `Prestación "${procedure.name}" agregada correctamente al presupuesto.`,
      });
    } catch (error) {
      console.error(error);

      setAlert({
        type: 'error',
        message: 'Ocurrió un error inesperado al agregar la prestación.',
      });
    } finally {
      setAddingProcedureId(null);
    }
  };

  const handleQuantityChange = (localId: string, quantity: number) => {
    if (quantity < 1) {
      setAlert({
        type: 'warning',
        message: 'La cantidad mínima permitida es 1.',
      });
      return;
    }

    setBudgetItems((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice,
            }
          : item,
      ),
    );
  };

  const handleRemoveItem = (localId: string) => {
    setBudgetItems((prev) => prev.filter((item) => item.localId !== localId));
    setAlert({
      type: 'info',
      message: 'La prestación fue eliminada del presupuesto.',
    });
  };

  const handlePrimaryAction = async (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.preventDefault();

    if (currentStep === 1) {
      await handleContinueFromPatientStep(event);
      return;
    }

    if (currentStep === 2) {
      if (!budgetItems.length) {
        setAlert({
          type: 'warning',
          message: 'Agregue al menos una prestación antes de continuar.',
        });
        return;
      }

      goToNextStep();
      return;
    }

    if (currentStep === 3) {
      setAlert({
        type: 'info',
        message: 'El siguiente paso será guardar el presupuesto y generar el PDF.',
      });
      return;
    }

    goToNextStep();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <HeroHeader careType={careType} currentStep={currentStep} apiUrl={API_URL} />

        <section className="mb-6 grid gap-3 md:grid-cols-4">
          <StepCard number="01" label="Tipo" active={currentStep === 0} done={currentStep > 0} />
          <StepCard number="02" label="Paciente" active={currentStep === 1} done={currentStep > 1} />
          <StepCard number="03" label="Presupuesto" active={currentStep === 2} done={currentStep > 2} />
          <StepCard number="04" label="Resumen" active={currentStep === 3} done={false} />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_15px_50px_-20px_rgba(15,76,129,0.35)]">
          <div className="border-b border-sky-100 bg-gradient-to-r from-[#0F4C81] via-[#1769aa] to-[#2C8ED6] px-6 py-5 text-white">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/90">
                  Flujo de emisión
                </p>
                <h2 className="mt-1 text-2xl font-bold">{stepTitle}</h2>
              </div>

              {careType && currentStep > 0 && (
                <div
                  className={[
                    'inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide',
                    careType === 'AMBULATORY'
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-rose-100 text-rose-700',
                  ].join(' ')}
                >
                  {careType === 'AMBULATORY' ? 'Ambulatorio' : 'Quirúrgico'}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 md:p-7">
            {currentStep === 0 && (
              <InitialCareTypeStep careType={careType} onSelect={selectCareType} />
            )}

            {currentStep === 1 && (
              <SectionCard
                title="Identificación del paciente"
                subtitle="Busque al paciente por RUT y complete los datos si aún no existe en la división seleccionada."
              >
                <div className="grid items-end gap-4 md:grid-cols-3">
                  <Field label="División">
                    <select
                      value={selectedDivisionId}
                      onChange={(e) => setSelectedDivisionId(e.target.value)}
                      className="input-clinical"
                      disabled={loadingDivisions}
                    >
                      <option value="">Seleccione división</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="RUT del paciente">
                    <input
                      type="text"
                      value={rut}
                      onChange={(e) => handleRutChange(e.target.value)}
                      onBlur={handleRutBlur}
                      placeholder="12.345.678-9"
                      className="input-clinical"
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={handleSearchPatient}
                    disabled={loadingPatient}
                    className="btn-health-primary h-[46px]"
                  >
                    {loadingPatient ? 'Buscando...' : 'Verificar RUT'}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 border-t border-sky-100 pt-6 md:grid-cols-2">
                  <Field label="Nombres">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-clinical"
                    />
                  </Field>

                  <Field label="Apellidos">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-clinical"
                    />
                  </Field>

                  <Field label="Segundo apellido / otros">
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="input-clinical"
                    />
                  </Field>

                  <Field label="Correo electrónico">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-clinical"
                    />
                  </Field>

                  <Field label="Teléfono">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-clinical"
                    />
                  </Field>

                  <Field label="Dirección particular">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-clinical"
                    />
                  </Field>
                </div>
              </SectionCard>
            )}

            {currentStep === 2 && (
              <BudgetStep
                isapres={isapres}
                loadingIsapres={loadingIsapres}
                selectedIsapreId={selectedIsapreId}
                setSelectedIsapreId={setSelectedIsapreId}
                plans={plans}
                loadingPlans={loadingPlans}
                selectedPlanId={selectedPlanId}
                setSelectedPlanId={setSelectedPlanId}
                procedureSearch={procedureSearch}
                setProcedureSearch={setProcedureSearch}
                loadingProcedures={loadingProcedures}
                procedureResults={procedureResults}
                handleSearchProcedures={handleSearchProcedures}
                handleAddProcedure={handleAddProcedure}
                addingProcedureId={addingProcedureId}
                budgetItems={budgetItems}
                handleQuantityChange={handleQuantityChange}
                handleRemoveItem={handleRemoveItem}
                subtotal={subtotal}
                discountTotal={discountTotal}
                setDiscountTotal={setDiscountTotal}
                total={total}
                notes={notes}
                setNotes={setNotes}
              />
            )}

            {currentStep === 3 && (
              <SummaryStep
                rut={rut}
                firstName={firstName}
                lastName={lastName}
                email={email}
                phone={phone}
                careType={careType}
                isapreName={selectedIsapreName}
                planName={selectedPlanName}
                budgetItems={budgetItems}
                subtotal={subtotal}
                discountTotal={Number(discountTotal || 0)}
                total={total}
                notes={notes}
              />
            )}

            {currentStep > 0 && (
              <div className="mt-8 flex items-center justify-between border-t border-sky-100 pt-6">
                <button onClick={goToPrevStep} className="btn-health-secondary">
                  Volver
                </button>

                <button
                  onClick={handlePrimaryAction}
                  disabled={savingPatient}
                  className="btn-health-primary"
                >
                  {currentStep === 1
                    ? savingPatient
                      ? 'Guardando paciente...'
                      : 'Continuar'
                    : currentStep === 2
                    ? 'Ir a resumen'
                    : currentStep === 3
                    ? 'Emitir presupuesto'
                    : 'Continuar'}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <FloatingToast alert={alert} onClose={() => setAlert(null)} />
    </main>
  );
}

function HeroHeader({
  careType,
  currentStep,
  apiUrl,
}: {
  careType: CareType | null;
  currentStep: Step;
  apiUrl: string;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_15px_50px_-20px_rgba(30,136,229,0.35)]">
      <div className="grid gap-0 md:grid-cols-[1.3fr_0.9fr]">
        <div className="bg-gradient-to-br from-[#0F4C81] via-[#1769aa] to-[#51b4e8] px-6 py-8 text-white md:px-8">
          <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-50">
            Portal de presupuestos médicos
          </div>

          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            Emisión clínica con un flujo claro, limpio y orientado a demo
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-sky-50/90 md:text-base">
            Seleccione modalidad, identifique al paciente, construya el presupuesto y revise el resumen final antes de emitirlo.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <MiniPill>Flujo guiado</MiniPill>
            <MiniPill>
              {careType && currentStep > 0
                ? careType === 'AMBULATORY'
                  ? 'Modo ambulatorio'
                  : 'Modo quirúrgico'
                : 'Seleccione modalidad'}
            </MiniPill>
          </div>

          <div className="mt-6 text-xs text-sky-100/85">API activa: {apiUrl}</div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 md:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-100/70 blur-2xl" />

          <div className="relative rounded-[24px] border border-sky-100 bg-white/90 p-5 shadow-[0_15px_40px_-25px_rgba(15,76,129,0.4)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                Vista clínica
              </span>
              <span className="text-2xl">🩺</span>
            </div>

            <div className="space-y-3">
              <IllustrationLine width="85%" />
              <IllustrationLine width="65%" />
              <IllustrationLine width="100%" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniPanel title="Paciente" value="Validación por RUT" />
              <MiniPanel title="Cobertura" value="Isapre y plan" />
              <MiniPanel title="Presupuesto" value="Prestaciones y totales" />
              <MiniPanel title="Resumen" value="Preparado para PDF" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  number,
  label,
  active,
  done,
}: {
  number: string;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={[
        'rounded-2xl border px-4 py-4 transition-all',
        active
          ? 'border-sky-300 bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-lg'
          : done
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-sky-100 bg-white text-slate-600',
      ].join(' ')}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
        {number}
      </div>
      <div className="mt-1 text-sm font-semibold">{label}</div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#0F4C81]">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </div>
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

function InitialCareTypeStep({
  careType,
  onSelect,
}: {
  careType?: CareType | null;
  onSelect: (value: CareType) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect('AMBULATORY')}
        className={[
          'rounded-[24px] border p-6 text-left transition-all',
          careType === 'AMBULATORY'
            ? 'border-sky-300 bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-lg'
            : 'border-sky-100 bg-gradient-to-br from-white to-sky-50 hover:border-sky-200 hover:shadow-md',
        ].join(' ')}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
          💙
        </div>
        <h3 className="text-xl font-bold">Ambulatorio</h3>
        <p
          className={[
            'mt-2 text-sm leading-6',
            careType === 'AMBULATORY' ? 'text-sky-50' : 'text-slate-600',
          ].join(' ')}
        >
          Para consultas, evaluaciones y procedimientos sin hospitalización.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelect('SURGICAL')}
        className={[
          'rounded-[24px] border p-6 text-left transition-all',
          careType === 'SURGICAL'
            ? 'border-rose-300 bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg'
            : 'border-sky-100 bg-gradient-to-br from-white to-sky-50 hover:border-sky-200 hover:shadow-md',
        ].join(' ')}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
          ❤️
        </div>
        <h3 className="text-xl font-bold">Quirúrgico</h3>
        <p
          className={[
            'mt-2 text-sm leading-6',
            careType === 'SURGICAL' ? 'text-rose-50' : 'text-slate-600',
          ].join(' ')}
        >
          Para presupuestos con prestaciones quirúrgicas, pabellón y flujo operatorio.
        </p>
      </button>
    </div>
  );
}

function BudgetStep({
  isapres,
  loadingIsapres,
  selectedIsapreId,
  setSelectedIsapreId,
  plans,
  loadingPlans,
  selectedPlanId,
  setSelectedPlanId,
  procedureSearch,
  setProcedureSearch,
  loadingProcedures,
  procedureResults,
  handleSearchProcedures,
  handleAddProcedure,
  addingProcedureId,
  budgetItems,
  handleQuantityChange,
  handleRemoveItem,
  subtotal,
  discountTotal,
  setDiscountTotal,
  total,
  notes,
  setNotes,
}: {
  isapres: Isapre[];
  loadingIsapres: boolean;
  selectedIsapreId: string;
  setSelectedIsapreId: React.Dispatch<React.SetStateAction<string>>;
  plans: IsaprePlan[];
  loadingPlans: boolean;
  selectedPlanId: string;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string>>;
  procedureSearch: string;
  setProcedureSearch: React.Dispatch<React.SetStateAction<string>>;
  loadingProcedures: boolean;
  procedureResults: Procedure[];
  handleSearchProcedures: () => Promise<void>;
  handleAddProcedure: (procedure: Procedure) => Promise<void>;
  addingProcedureId: number | null;
  budgetItems: BudgetItem[];
  handleQuantityChange: (localId: string, quantity: number) => void;
  handleRemoveItem: (localId: string) => void;
  subtotal: number;
  discountTotal: string;
  setDiscountTotal: React.Dispatch<React.SetStateAction<string>>;
  total: number;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
}): JSX.Element {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Cobertura y búsqueda de prestaciones"
        subtitle="Seleccione la cobertura del paciente y busque las prestaciones que formarán parte del presupuesto."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Isapre">
            <select
              value={selectedIsapreId}
              onChange={(e) => setSelectedIsapreId(e.target.value)}
              className="input-clinical"
              disabled={loadingIsapres}
            >
              <option value="">Seleccione isapre</option>
              {isapres.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Plan">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="input-clinical"
              disabled={loadingPlans || !selectedIsapreId}
            >
              <option value="">Seleccione plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Buscar prestación">
            <div className="flex gap-2">
              <input
                type="text"
                value={procedureSearch}
                onChange={(e) => setProcedureSearch(e.target.value)}
                placeholder="Código o nombre"
                className="input-clinical"
              />
              <button
                type="button"
                onClick={handleSearchProcedures}
                disabled={loadingProcedures}
                className="btn-health-primary"
              >
                {loadingProcedures ? '...' : 'Buscar'}
              </button>
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Resultados de búsqueda"
        subtitle="Seleccione una prestación para incorporarla al presupuesto."
      >
        {procedureResults.length === 0 ? (
          <p className="text-sm text-slate-500">
            Busque prestaciones para agregarlas al presupuesto.
          </p>
        ) : (
          <div className="space-y-3">
            {procedureResults.map((procedure) => (
              <div
                key={procedure.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {procedure.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {procedure.code}
                    {procedure.category ? ` · ${procedure.category}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddProcedure(procedure)}
                  disabled={addingProcedureId === procedure.id}
                  className="btn-health-secondary"
                >
                  {addingProcedureId === procedure.id ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Ítems del presupuesto"
        subtitle="Revise las prestaciones agregadas, ajuste cantidades y elimine las que no correspondan."
      >
        {budgetItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay prestaciones agregadas.
          </p>
        ) : (
          <div className="space-y-3">
            {budgetItems.map((item) => (
              <div
                key={item.localId}
                className="grid items-center gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[2fr_100px_140px_140px_90px]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">{item.code}</p>
                </div>

                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.localId, Number(e.target.value))
                  }
                  className="input-clinical"
                />

                <div className="text-sm text-slate-700">
                  {formatCurrency(item.unitPrice)}
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  {formatCurrency(item.totalPrice)}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.localId)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title="Descuento"
          subtitle="Ingrese un descuento total si corresponde."
        >
          <Field label="Descuento">
            <input
              type="number"
              min={0}
              value={discountTotal}
              onChange={(e) => setDiscountTotal(e.target.value)}
              className="input-clinical"
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Observaciones"
          subtitle="Notas internas o comentarios del presupuesto."
        >
          <Field label="Observaciones">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input-clinical"
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Totales"
          subtitle="Resumen económico del presupuesto."
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Descuento</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(Number(discountTotal || 0))}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryStep({
  rut,
  firstName,
  lastName,
  email,
  phone,
  careType,
  isapreName,
  planName,
  budgetItems,
  subtotal,
  discountTotal,
  total,
  notes,
}: {
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  careType: CareType | null;
  isapreName: string;
  planName: string;
  budgetItems: BudgetItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  notes: string;
}): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionCard
        title="Resumen clínico"
        subtitle="Vista consolidada del paciente y de la cobertura seleccionada."
      >
        <div className="space-y-3 text-sm text-slate-600">
          <SummaryRow label="RUT" value={rut || '-'} />
          <SummaryRow
            label="Paciente"
            value={[firstName, lastName].filter(Boolean).join(' ') || '-'}
          />
          <SummaryRow label="Correo" value={email || '-'} />
          <SummaryRow label="Teléfono" value={phone || '-'} />
          <SummaryRow
            label="Tipo"
            value={
              careType === 'AMBULATORY'
                ? 'Ambulatorio'
                : careType === 'SURGICAL'
                ? 'Quirúrgico'
                : '-'
            }
          />
          <SummaryRow label="Isapre" value={isapreName} />
          <SummaryRow label="Plan" value={planName} />
        </div>
      </SectionCard>

      <SectionCard
        title="Resumen económico"
        subtitle="Detalle financiero consolidado del presupuesto."
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Descuento</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(discountTotal)}
            </span>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>

          {notes && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-[#0F4C81]">Observaciones:</span>{' '}
              {notes}
            </div>
          )}
        </div>
      </SectionCard>

      <div className="md:col-span-2">
        <SectionCard
          title="Prestaciones incluidas"
          subtitle="Listado final de prestaciones incorporadas al presupuesto."
        >
          {budgetItems.length === 0 ? (
            <p className="text-sm text-slate-500">No hay ítems para resumir.</p>
          ) : (
            <div className="space-y-3">
              {budgetItems.map((item) => (
                <div
                  key={item.localId}
                  className="grid items-center gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[2fr_120px_140px_140px]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.code}</p>
                  </div>

                  <div className="text-sm text-slate-700">
                    Cantidad: {item.quantity}
                  </div>

                  <div className="text-sm text-slate-700">
                    {formatCurrency(item.unitPrice)}
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function MiniPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
      {children}
    </span>
  );
}

function MiniPanel({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
        {title}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#0F4C81]">{value}</div>
    </div>
  );
}

function IllustrationLine({ width }: { width: string }) {
  return (
    <div
      className="h-3 rounded-full bg-gradient-to-r from-sky-200 to-cyan-100"
      style={{ width }}
    />
  );
}

function FloatingToast({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  if (!alert) {
    return null;
  }

  const styles =
    alert.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : alert.type === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : alert.type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-sky-200 bg-sky-50 text-sky-800';

  const icon =
    alert.type === 'success'
      ? '✓'
      : alert.type === 'warning'
      ? '!'
      : alert.type === 'error'
      ? '✕'
      : 'i';

  const title =
    alert.type === 'success'
      ? 'Correcto'
      : alert.type === 'warning'
      ? 'Atención'
      : alert.type === 'error'
      ? 'Error'
      : 'Información';

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-full max-w-md px-4">
      <div
        className={[
          'pointer-events-auto rounded-2xl border shadow-2xl backdrop-blur-sm',
          'animate-[toast-in_0.25s_ease-out]',
          styles,
        ].join(' ')}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-sm font-bold">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">{title}</div>
            <div className="mt-1 text-sm leading-5">{alert.message}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-semibold opacity-80 transition hover:bg-white/50 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}