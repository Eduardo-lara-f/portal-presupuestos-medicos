'use client';

import React, { useEffect, useMemo, useState } from 'react';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type Step = 0 | 1 | 2 | 3;
type BillingSection = 'PROCEDURE' | 'SUPPLY' | 'DRUG' | 'BED';

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

type BasketResponse = {
  id: number;
  divisionId: number;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  items: Array<{
    procedureId: number;
    quantity: number;
    relevanceScore?: string | number | null;
    procedure?: Procedure;
  }>;
};

type PackageResponse = {
  id: number;
  divisionId: number;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  items: Array<{
    procedureId: number;
    quantity: number;
    priceMode: string;
    fixedPrice?: string | number | null;
    procedure?: Procedure;
  }>;
};

type BudgetSourceType = 'PROCEDURE' | 'BASKET' | 'PACKAGE';

type BudgetItem = {
  localId: string;
  sourceId: string | number;
  sourceType: BudgetSourceType;
  parentGroupId?: number | null;
  parentGroupKey?: string | null;
  parentGroupType?: 'BASKET' | 'PACKAGE' | null;
  parentGroupName?: string | null;
  lockedByPackage: boolean;
  section: BillingSection;
  code: string;
  name: string;
  quantity: number;
  basePrice: number;
  appliedFactor: number;
  unitPrice: number;
  totalPrice: number;
};

type AlertState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null;

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const SECONDARY_SECTION_FACTOR = 0.5;

function roundPrice(value: number) {
  return Math.round(value);
}

function applySectionBillingRule(items: BudgetItem[]): BudgetItem[] {
  const factorByLocalId = new Map<string, number>();
  const sections: BillingSection[] = ['PROCEDURE', 'SUPPLY', 'DRUG', 'BED'];

  for (const section of sections) {
    const sorted = items
      .filter((item) => item.section === section && !item.lockedByPackage)
      .sort((a, b) => b.basePrice - a.basePrice || a.name.localeCompare(b.name));

    sorted.forEach((item, index) => {
      factorByLocalId.set(item.localId, index === 0 ? 1 : SECONDARY_SECTION_FACTOR);
    });
  }

  return items.map((item) => {
    if (item.lockedByPackage) {
      return {
        ...item,
        appliedFactor: 1,
        unitPrice: item.basePrice,
        totalPrice: item.basePrice * item.quantity,
      };
    }

    const appliedFactor = factorByLocalId.get(item.localId) ?? 1;
    const unitPrice = roundPrice(item.basePrice * appliedFactor);

    return {
      ...item,
      appliedFactor,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

type AddedGroupSummary = {
  groupKey: string;
  groupId: number;
  groupName: string;
  groupType: 'BASKET' | 'PACKAGE';
  itemCount: number;
};

function resolveBillingSectionFromProcedure(procedure: Procedure): BillingSection {
  const category = procedure.category?.trim().toUpperCase();

  if (category === 'SUPPLY') return 'SUPPLY';
  if (category === 'DRUG') return 'DRUG';
  if (category === 'BED') return 'BED';

  return 'PROCEDURE';
}


export default function NewQuotationPage() {
  const [careType, setCareType] = useState<CareType | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(0);

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [selectedDivisionId, setSelectedDivisionId] = useState('');

  const [loadingPatient, setLoadingPatient] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [, setPatientFound] = useState<boolean | null>(null);

  const [rut, setRut] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isapres, setIsapres] = useState<Isapre[]>([]);
  const [loadingIsapres, setLoadingIsapres] = useState(false);
  const [selectedIsapreId, setSelectedIsapreId] = useState('');

  const [plans, setPlans] = useState<IsaprePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [procedureSearch, setProcedureSearch] = useState('');
  const [procedureResults, setProcedureResults] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [addingProcedureId, setAddingProcedureId] = useState<number | null>(null);

  const [basketSearch, setBasketSearch] = useState('');
  const [basketResults, setBasketResults] = useState<BasketResponse[]>([]);
  const [loadingBaskets, setLoadingBaskets] = useState(false);
  const [addingBasketId, setAddingBasketId] = useState<number | null>(null);

  const [packageSearch, setPackageSearch] = useState('');
  const [packageResults, setPackageResults] = useState<PackageResponse[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [addingPackageId, setAddingPackageId] = useState<number | null>(null);

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [discountTotal, setDiscountTotal] = useState('0');
  const [notes, setNotes] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!alert) return;
    const duration = alert.type === 'error' ? 7000 : 4500;
    const timer = window.setTimeout(() => setAlert(null), duration);
    return () => window.clearTimeout(timer);
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
    return isapres.find((item) => String(item.id) === selectedIsapreId)?.name ?? '-';
  }, [isapres, selectedIsapreId]);

  const selectedPlanName = useMemo(() => {
    return plans.find((item) => String(item.id) === selectedPlanId)?.name ?? '-';
  }, [plans, selectedPlanId]);

  const selectedDivisionName = useMemo(() => {
    return divisions.find((item) => String(item.id) === selectedDivisionId)?.name ?? '-';
  }, [divisions, selectedDivisionId]);

  const sectionTotals = useMemo(() => {
    const getTotal = (section: BillingSection) =>
      budgetItems
        .filter((item) => item.section === section)
        .reduce((acc, item) => acc + item.totalPrice, 0);

    return {
      PROCEDURE: getTotal('PROCEDURE'),
      SUPPLY: getTotal('SUPPLY'),
      DRUG: getTotal('DRUG'),
      BED: getTotal('BED'),
    };
  }, [budgetItems]);

  const addedGroups = useMemo(() => {
    const groups = new Map<string, AddedGroupSummary>();

    budgetItems.forEach((item) => {
      if (!item.parentGroupKey || !item.parentGroupId || !item.parentGroupType || !item.parentGroupName) {
        return;
      }

      const current = groups.get(item.parentGroupKey);

      if (current) {
        current.itemCount += 1;
        return;
      }

      groups.set(item.parentGroupKey, {
        groupKey: item.parentGroupKey,
        groupId: item.parentGroupId,
        groupName: item.parentGroupName,
        groupType: item.parentGroupType,
        itemCount: 1,
      });
    });

    return Array.from(groups.values());
  }, [budgetItems]);

  useEffect(() => {
    async function loadDivisions() {
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
    }

    loadDivisions();
  }, []);

  useEffect(() => {
    async function loadIsapres() {
      if (!selectedDivisionId) {
        setIsapres([]);
        setSelectedIsapreId('');
        setPlans([]);
        setSelectedPlanId('');
        return;
      }

      try {
        setLoadingIsapres(true);

        const response = await fetch(`${API_URL}/isapres?divisionId=${selectedDivisionId}`);
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
          message: 'No se pudieron cargar las isapres de la división seleccionada.',
        });
      } finally {
        setLoadingIsapres(false);
      }
    }

    loadIsapres();
  }, [selectedDivisionId]);

  useEffect(() => {
    async function loadPlans() {
      if (!selectedIsapreId) {
        setPlans([]);
        setSelectedPlanId('');
        return;
      }

      try {
        setLoadingPlans(true);

        const response = await fetch(`${API_URL}/isapres/${selectedIsapreId}/plans`);
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
    }

    loadPlans();
  }, [selectedIsapreId]);

  function goToNextStep() {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  }

  function goToPrevStep() {
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  }

  function selectCareType(value: CareType) {
    setCareType(value);
    setCurrentStep(1);
    setAlert(null);
  }

  function resetPatientForm() {
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setEmail('');
    setPhone('');
    setAddress('');
  }

  async function safeParseJson<T>(response: Response): Promise<T | null> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    const text = await response.text();
    if (!text.trim()) {
      return null;
    }

    return JSON.parse(text) as T;
  }

  async function getApiErrorMessage(response: Response, fallbackMessage: string) {
    try {
      const data = await safeParseJson<{ message?: string | string[] }>(response);

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
  }

  function normalizeRut(value: string) {
    const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleaned.length < 2) {
      return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return `${body}-${dv}`;
  }

  function formatRut(value: string) {
    const normalized = normalizeRut(value);
    if (!normalized.includes('-')) {
      return normalized;
    }

    const [body, dv] = normalized.split('-');
    const reversed = body.split('').reverse().join('');
    const withDotsReversed = reversed.replace(/(\d{3})(?=\d)/g, '$1.');
    const formattedBody = withDotsReversed.split('').reverse().join('');
    return `${formattedBody}-${dv}`;
  }

  function isValidRut(value: string) {
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

    if (remainder === 11) expectedDv = '0';
    else if (remainder === 10) expectedDv = 'K';
    else expectedDv = String(remainder);

    return dv === expectedDv;
  }

  function handleRutChange(value: string) {
    setRut(value);
  }

  function handleRutBlur() {
    if (!rut.trim()) return;
    setRut(formatRut(rut));
  }

  async function handleSearchPatient() {
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
        `${API_URL}/patients/by-rut/${encodeURIComponent(normalizedRut)}?divisionId=${selectedDivisionId}`,
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
  }

  async function handleContinueFromPatientStep(
    event?: React.MouseEvent<HTMLButtonElement>,
  ) {
    event?.preventDefault();

    if (currentStep !== 1) {
      goToNextStep();
      return;
    }

    if (patientId) {
      goToNextStep();
      return;
    }

    if (!selectedDivisionId || !rut.trim() || !firstName.trim() || !lastName.trim()) {
      setAlert({
        type: 'warning',
        message: 'Complete división, RUT, nombres y apellidos antes de continuar.',
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
        message: 'Ocurrió un error al crear el paciente. Revise la API y vuelva a intentar.',
      });
    } finally {
      setSavingPatient(false);
    }
  }

  
  async function resolveProcedureAgreementPrice(procedureId: number) {
    if (!selectedDivisionId) {
      throw new Error('Seleccione una división antes de resolver precios.');
    }

    if (!selectedIsapreId || !selectedPlanId) {
      throw new Error('Seleccione isapre y plan antes de agregar ítems al presupuesto.');
    }

    const params = new URLSearchParams({
      divisionId: selectedDivisionId,
      procedureId: String(procedureId),
      coverageType: 'ISAPRE_PLAN',
      isapreId: selectedIsapreId,
      isaprePlanId: selectedPlanId,
    });

    const response = await fetch(`${API_URL}/procedure-prices/resolve?${params.toString()}`);

    if (!response.ok) {
      let fallbackMessage = 'No se pudo resolver el precio de la prestación.';
      if (response.status === 404) {
        fallbackMessage =
          'No existe un precio configurado para este ítem con la cobertura seleccionada.';
      }

      throw new Error(await getApiErrorMessage(response, fallbackMessage));
    }

    const priceData: ProcedurePriceResponse = await response.json();
    return Number(priceData.price);
  }

  function buildBudgetItem(params: {
    procedure: Procedure;
    quantity: number;
    basePrice: number;
    sourceType: BudgetSourceType;
    parentGroupId?: number | null;
    parentGroupKey?: string | null;
    parentGroupType?: 'BASKET' | 'PACKAGE' | null;
    parentGroupName?: string | null;
    lockedByPackage: boolean;
  }): BudgetItem {
    return {
      localId: `${params.sourceType}-${params.procedure.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: params.procedure.id,
      sourceType: params.sourceType,
      parentGroupId: params.parentGroupId ?? null,
      parentGroupKey: params.parentGroupKey ?? null,
      parentGroupType: params.parentGroupType ?? null,
      parentGroupName: params.parentGroupName ?? null,
      lockedByPackage: params.lockedByPackage,
      section: resolveBillingSectionFromProcedure(params.procedure),
      code: params.procedure.code,
      name: params.procedure.name,
      quantity: params.quantity,
      basePrice: params.basePrice,
      appliedFactor: 1,
      unitPrice: params.basePrice,
      totalPrice: params.basePrice * params.quantity,
    };
  }

  async function handleSearchProcedures() {
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
        category: 'PROCEDURE',
        active: 'true',
      });

      const response = await fetch(`${API_URL}/procedures?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las prestaciones.');
      }

      const data: Procedure[] = await response.json();
      const filtered = careType
        ? data.filter((item) => item.careType === careType || item.careType === 'BOTH')
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
  }

  async function handleSearchBaskets() {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de buscar canastas.',
      });
      return;
    }

    if (!basketSearch.trim()) {
      setAlert({
        type: 'warning',
        message: 'Ingrese un nombre o código para buscar canastas.',
      });
      return;
    }

    try {
      setLoadingBaskets(true);
      setAlert(null);

      const params = new URLSearchParams({
        divisionId: selectedDivisionId,
        search: basketSearch.trim(),
        active: 'true',
      });

      const response = await fetch(`${API_URL}/baskets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las canastas.');
      }

      const data: BasketResponse[] = await response.json();
      setBasketResults(data);

      if (!data.length) {
        setAlert({
          type: 'info',
          message: 'No se encontraron canastas para la búsqueda realizada.',
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'Ocurrió un error al buscar canastas.',
      });
    } finally {
      setLoadingBaskets(false);
    }
  }

  async function handleSearchPackages() {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de buscar paquetes.',
      });
      return;
    }

    if (!packageSearch.trim()) {
      setAlert({
        type: 'warning',
        message: 'Ingrese un nombre o código para buscar paquetes.',
      });
      return;
    }

    try {
      setLoadingPackages(true);
      setAlert(null);

      const params = new URLSearchParams({
        divisionId: selectedDivisionId,
        search: packageSearch.trim(),
        active: 'true',
      });

      const response = await fetch(`${API_URL}/packages?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los paquetes.');
      }

      const data: PackageResponse[] = await response.json();
      setPackageResults(data);

      if (!data.length) {
        setAlert({
          type: 'info',
          message: 'No se encontraron paquetes para la búsqueda realizada.',
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: 'Ocurrió un error al buscar paquetes.',
      });
    } finally {
      setLoadingPackages(false);
    }
  }

  async function handleAddProcedure(procedure: Procedure) {
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

      const basePrice = await resolveProcedureAgreementPrice(procedure.id);

      setBudgetItems((prev) => {
        const existing = prev.find(
          (item) =>
            item.section === 'PROCEDURE' &&
            Number(item.sourceId) === procedure.id &&
            item.sourceType === 'PROCEDURE' &&
            !item.parentGroupType,
        );

        const newItem = buildBudgetItem({
          procedure,
          quantity: 1,
          basePrice,
          sourceType: 'PROCEDURE',
          lockedByPackage: false,
        });

        const next: BudgetItem[] = existing
          ? prev.map((item) =>
              item.localId === existing.localId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prev, newItem];

        return applySectionBillingRule(next);
      });

      setAlert({
        type: 'success',
        message: `Prestación "${procedure.name}" agregada correctamente al presupuesto.`,
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado al agregar la prestación.',
      });
    } finally {
      setAddingProcedureId(null);
    }
  }

  async function handleAddBasket(basket: BasketResponse) {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de agregar canastas.',
      });
      return;
    }

    if (!selectedIsapreId || !selectedPlanId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione isapre y plan antes de agregar una canasta.',
      });
      return;
    }

    if (!basket.items.length) {
      setAlert({
        type: 'warning',
        message: 'La canasta seleccionada no tiene prestaciones configuradas.',
      });
      return;
    }

    try {
      setAddingBasketId(basket.id);
      setAlert(null);

      const groupKey = `BASKET-${basket.id}-${Date.now()}`;
      const newItems: BudgetItem[] = [];

      for (const basketItem of basket.items) {
        const procedure = basketItem.procedure;

        if (!procedure) {
          throw new Error(`La canasta "${basket.name}" tiene un ítem sin prestación asociada.`);
        }

        const basePrice = await resolveProcedureAgreementPrice(procedure.id);

        newItems.push(
          buildBudgetItem({
            procedure,
            quantity: basketItem.quantity,
            basePrice,
            sourceType: 'BASKET',
            parentGroupId: basket.id,
            parentGroupKey: groupKey,
            parentGroupType: 'BASKET',
            parentGroupName: basket.name,
            lockedByPackage: false,
          }),
        );
      }

      setBudgetItems((prev) => applySectionBillingRule([...prev, ...newItems]));

      setAlert({
        type: 'success',
        message: `Canasta "${basket.name}" agregada correctamente al presupuesto.`,
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrió un error al agregar la canasta.',
      });
    } finally {
      setAddingBasketId(null);
    }
  }

  async function handleAddPackage(pkg: PackageResponse) {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de agregar paquetes.',
      });
      return;
    }

    if (!selectedIsapreId || !selectedPlanId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione isapre y plan antes de agregar un paquete.',
      });
      return;
    }

    if (!pkg.items.length) {
      setAlert({
        type: 'warning',
        message: 'El paquete seleccionado no tiene prestaciones configuradas.',
      });
      return;
    }

    try {
      setAddingPackageId(pkg.id);
      setAlert(null);

      const groupKey = `PACKAGE-${pkg.id}-${Date.now()}`;
      const newItems: BudgetItem[] = [];

      for (const packageItem of pkg.items) {
        const procedure = packageItem.procedure;

        if (!procedure) {
          throw new Error(`El paquete "${pkg.name}" tiene un ítem sin prestación asociada.`);
        }

        let basePrice = 0;

        if (packageItem.priceMode === 'FIXED_PRICE') {
          if (packageItem.fixedPrice === null || packageItem.fixedPrice === undefined || packageItem.fixedPrice === '') {
            throw new Error(`El paquete "${pkg.name}" contiene un ítem FIXED_PRICE sin precio fijo.`);
          }

          basePrice = Number(packageItem.fixedPrice);
        } else {
          basePrice = await resolveProcedureAgreementPrice(procedure.id);
        }

        newItems.push(
          buildBudgetItem({
            procedure,
            quantity: packageItem.quantity,
            basePrice,
            sourceType: 'PACKAGE',
            parentGroupId: pkg.id,
            parentGroupKey: groupKey,
            parentGroupType: 'PACKAGE',
            parentGroupName: pkg.name,
            lockedByPackage: true,
          }),
        );
      }

      setBudgetItems((prev) => applySectionBillingRule([...prev, ...newItems]));

      setAlert({
        type: 'success',
        message: `Paquete "${pkg.name}" agregado correctamente al presupuesto.`,
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrió un error al agregar el paquete.',
      });
    } finally {
      setAddingPackageId(null);
    }
  }

  function handleQuantityChange(localId: string, quantity: number) {
    if (quantity < 1) {
      setAlert({
        type: 'warning',
        message: 'La cantidad mínima permitida es 1.',
      });
      return;
    }

    setBudgetItems((prev) => {
      const target = prev.find((item) => item.localId === localId);

      if (!target || target.lockedByPackage) {
        return prev;
      }

      const next = prev.map((item) => (item.localId === localId ? { ...item, quantity } : item));
      return applySectionBillingRule(next);
    });
  }

  function handleRemoveItem(localId: string) {
    setBudgetItems((prev) => {
      const target = prev.find((item) => item.localId === localId);

      if (!target || target.lockedByPackage) {
        return prev;
      }

      const next = prev.filter((item) => item.localId !== localId);
      return applySectionBillingRule(next);
    });

    setAlert({
      type: 'info',
      message: 'El ítem fue eliminado del presupuesto.',
    });
  }

  function handleRemoveGroup(groupKey: string, groupType: 'BASKET' | 'PACKAGE') {
    setBudgetItems((prev) => {
      const next = prev.filter((item) => item.parentGroupKey !== groupKey);
      return applySectionBillingRule(next);
    });

    setAlert({
      type: 'info',
      message:
        groupType === 'BASKET'
          ? 'La canasta fue eliminada del presupuesto.'
          : 'El paquete fue eliminado del presupuesto.',
    });
  }

  async function handleGeneratePdf() {
  if (!careType) {
    setAlert({
      type: 'warning',
      message: 'Debe seleccionar el tipo de presupuesto antes de generar el PDF.',
    });
    return;
  }

  if (!budgetItems.length) {
    setAlert({
      type: 'warning',
      message: 'No hay ítems en el presupuesto para generar el PDF.',
    });
    return;
  }

  try {
    setGeneratingPdf(true);
    setAlert(null);

    const payload = {
      quotationNumber: `BORRADOR-${Date.now()}`,
      divisionName: selectedDivisionName,
      careType,
      patient: {
        rut: rut || '-',
        fullName: [firstName, lastName].filter(Boolean).join(' ') || '-',
        email: email || undefined,
        phone: phone || undefined,
      },
      coverage: {
        isapreName: selectedIsapreName !== '-' ? selectedIsapreName : undefined,
        planName: selectedPlanName !== '-' ? selectedPlanName : undefined,
      },
      items: budgetItems.map((item) => ({
        section: item.section,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        appliedFactor: item.appliedFactor,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      subtotal,
      discountTotal: Number(discountTotal || 0),
      total,
      notes: notes || undefined,
      generatedAt: new Date().toLocaleString('es-CL'),
    };

    console.log('Payload enviado al PDF:', payload);

    const response = await fetch(`${API_URL}/pdf/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF status:', response.status);
      console.error('PDF error body:', errorText);
      console.error('PDF payload:', payload);
      throw new Error(`No se pudo generar el PDF. Código: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `presupuesto_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setAlert({
      type: 'success',
      message: 'El PDF fue generado y descargado correctamente.',
    });
  } catch (error) {
    console.error(error);
    setAlert({
      type: 'error',
      message: 'Ocurrió un error al generar el PDF del presupuesto.',
    });
  } finally {
    setGeneratingPdf(false);
  }
}

  async function handlePrimaryAction(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();

    if (currentStep === 1) {
      await handleContinueFromPatientStep(event);
      return;
    }

    if (currentStep === 2) {
      if (!budgetItems.length) {
        setAlert({
          type: 'warning',
          message: 'Agregue al menos un ítem antes de continuar.',
        });
        return;
      }

      goToNextStep();
      return;
    }

    if (currentStep === 3) {
      await handleGeneratePdf();
      return;
    }

    goToNextStep();
  }

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
                basketSearch={basketSearch}
                setBasketSearch={setBasketSearch}
                loadingBaskets={loadingBaskets}
                basketResults={basketResults}
                handleSearchBaskets={handleSearchBaskets}
                handleAddBasket={handleAddBasket}
                addingBasketId={addingBasketId}
                packageSearch={packageSearch}
                setPackageSearch={setPackageSearch}
                loadingPackages={loadingPackages}
                packageResults={packageResults}
                handleSearchPackages={handleSearchPackages}
                handleAddPackage={handleAddPackage}
                addingPackageId={addingPackageId}
                budgetItems={budgetItems}
                addedGroups={addedGroups}
                handleQuantityChange={handleQuantityChange}
                handleRemoveItem={handleRemoveItem}
                handleRemoveGroup={handleRemoveGroup}
                subtotal={subtotal}
                sectionTotals={sectionTotals}
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
                  disabled={savingPatient || generatingPdf}
                  className="btn-health-primary"
                >
                  {currentStep === 1
                    ? savingPatient
                      ? 'Guardando paciente...'
                      : 'Continuar'
                    : currentStep === 2
                    ? 'Ir a resumen'
                    : currentStep === 3
                    ? generatingPdf
                      ? 'Generando PDF...'
                      : 'Emitir presupuesto'
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
            <MiniPill>Azul clínico</MiniPill>
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

function Field({ label, children }: FieldProps) {
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
  basketSearch,
  setBasketSearch,
  loadingBaskets,
  basketResults,
  handleSearchBaskets,
  handleAddBasket,
  addingBasketId,
  packageSearch,
  setPackageSearch,
  loadingPackages,
  packageResults,
  handleSearchPackages,
  handleAddPackage,
  addingPackageId,
  budgetItems,
  addedGroups,
  handleQuantityChange,
  handleRemoveItem,
  handleRemoveGroup,
  subtotal,
  sectionTotals,
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
  basketSearch: string;
  setBasketSearch: React.Dispatch<React.SetStateAction<string>>;
  loadingBaskets: boolean;
  basketResults: BasketResponse[];
  handleSearchBaskets: () => Promise<void>;
  handleAddBasket: (basket: BasketResponse) => Promise<void>;
  addingBasketId: number | null;
  packageSearch: string;
  setPackageSearch: React.Dispatch<React.SetStateAction<string>>;
  loadingPackages: boolean;
  packageResults: PackageResponse[];
  handleSearchPackages: () => Promise<void>;
  handleAddPackage: (pkg: PackageResponse) => Promise<void>;
  addingPackageId: number | null;
  budgetItems: BudgetItem[];
  addedGroups: AddedGroupSummary[];
  handleQuantityChange: (localId: string, quantity: number) => void;
  handleRemoveItem: (localId: string) => void;
  handleRemoveGroup: (groupKey: string, groupType: 'BASKET' | 'PACKAGE') => void;
  subtotal: number;
  sectionTotals: Record<BillingSection, number>;
  discountTotal: string;
  setDiscountTotal: React.Dispatch<React.SetStateAction<string>>;
  total: number;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
}) {
  const procedureItems = budgetItems.filter((item) => item.section === 'PROCEDURE');
  const supplyItems = budgetItems.filter((item) => item.section === 'SUPPLY');
  const drugItems = budgetItems.filter((item) => item.section === 'DRUG');
  const bedItems = budgetItems.filter((item) => item.section === 'BED');

  return (
    <div className="space-y-6">
      <SectionCard title="Cobertura" subtitle="Seleccione cobertura antes de agregar prestaciones.">
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>
      </SectionCard>

      <SectionCard
        title="Prestaciones clínicas"
        subtitle="Regla aplicada en esta sección: la prestación más cara queda al 100% y el resto al 50%."
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={procedureSearch}
            onChange={(e) => setProcedureSearch(e.target.value)}
            placeholder="Buscar por código o nombre"
            className="input-clinical"
          />
          <button
            type="button"
            onClick={handleSearchProcedures}
            disabled={loadingProcedures}
            className="btn-health-primary"
          >
            {loadingProcedures ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {procedureResults.length === 0 ? (
            <p className="text-sm text-slate-500">Busque prestaciones para agregarlas.</p>
          ) : (
            procedureResults.map((procedure) => (
              <div
                key={procedure.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{procedure.name}</p>
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
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Canastas"
        subtitle="Las canastas se expanden a ítems editables dentro del presupuesto."
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={basketSearch}
            onChange={(e) => setBasketSearch(e.target.value)}
            placeholder="Buscar canasta por código o nombre"
            className="input-clinical"
          />
          <button
            type="button"
            onClick={handleSearchBaskets}
            disabled={loadingBaskets}
            className="btn-health-primary"
          >
            {loadingBaskets ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {basketResults.length === 0 ? (
            <p className="text-sm text-slate-500">Busque canastas para agregarlas.</p>
          ) : (
            basketResults.map((basket) => (
              <div
                key={basket.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{basket.name}</p>
                  <p className="text-xs text-slate-500">
                    {basket.code} · {basket.items.length} componente(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddBasket(basket)}
                  disabled={addingBasketId === basket.id}
                  className="btn-health-secondary"
                >
                  {addingBasketId === basket.id ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Paquetes"
        subtitle="Los paquetes se expanden a ítems bloqueados que no pueden editarse individualmente."
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={packageSearch}
            onChange={(e) => setPackageSearch(e.target.value)}
            placeholder="Buscar paquete por código o nombre"
            className="input-clinical"
          />
          <button
            type="button"
            onClick={handleSearchPackages}
            disabled={loadingPackages}
            className="btn-health-primary"
          >
            {loadingPackages ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {packageResults.length === 0 ? (
            <p className="text-sm text-slate-500">Busque paquetes para agregarlos.</p>
          ) : (
            packageResults.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{pkg.name}</p>
                  <p className="text-xs text-slate-500">
                    {pkg.code} · {pkg.items.length} componente(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddPackage(pkg)}
                  disabled={addingPackageId === pkg.id}
                  className="btn-health-secondary"
                >
                  {addingPackageId === pkg.id ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {(addedGroups.length > 0) && (
        <SectionCard
          title="Grupos agregados"
          subtitle="Puede quitar canastas o paquetes completos desde este resumen."
        >
          <div className="space-y-3">
            {addedGroups.map((group) => (
              <div
                key={group.groupKey}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.groupName}</p>
                  <p className="text-xs text-slate-500">
                    {group.groupType === 'BASKET' ? 'Canasta' : 'Paquete'} · {group.itemCount} componente(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.groupKey, group.groupType)}
                  className="btn-health-secondary"
                >
                  Quitar {group.groupType === 'BASKET' ? 'canasta' : 'paquete'}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Detalle consolidado"
        subtitle="La regla 100% / 50% se recalcula por sección cada vez que agrega, elimina o cambia cantidades."
      >
        <BudgetGroup
          title="Prestaciones"
          items={procedureItems}
          handleQuantityChange={handleQuantityChange}
          handleRemoveItem={handleRemoveItem}
          total={sectionTotals.PROCEDURE}
        />
        <BudgetGroup
          title="Insumos"
          items={supplyItems}
          handleQuantityChange={handleQuantityChange}
          handleRemoveItem={handleRemoveItem}
          total={sectionTotals.SUPPLY}
        />
        <BudgetGroup
          title="Medicamentos"
          items={drugItems}
          handleQuantityChange={handleQuantityChange}
          handleRemoveItem={handleRemoveItem}
          total={sectionTotals.DRUG}
        />
        <BudgetGroup
          title="Día cama"
          items={bedItems}
          handleQuantityChange={handleQuantityChange}
          handleRemoveItem={handleRemoveItem}
          total={sectionTotals.BED}
        />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Descuento" subtitle="Ingrese un descuento total si corresponde.">
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

        <SectionCard title="Observaciones" subtitle="Notas internas o comentarios del presupuesto.">
          <Field label="Observaciones">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input-clinical"
            />
          </Field>
        </SectionCard>

        <SectionCard title="Totales" subtitle="Resumen económico del presupuesto.">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Prestaciones</span>
              <span className="font-medium text-slate-900">{formatCurrency(sectionTotals.PROCEDURE)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Insumos</span>
              <span className="font-medium text-slate-900">{formatCurrency(sectionTotals.SUPPLY)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medicamentos</span>
              <span className="font-medium text-slate-900">{formatCurrency(sectionTotals.DRUG)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Día cama</span>
              <span className="font-medium text-slate-900">{formatCurrency(sectionTotals.BED)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Descuento</span>
              <span className="font-medium text-slate-900">{formatCurrency(Number(discountTotal || 0))}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}


function BudgetGroup({
  title,
  items,
  handleQuantityChange,
  handleRemoveItem,
  total,
}: {
  title: string;
  items: BudgetItem[];
  handleQuantityChange: (localId: string, quantity: number) => void;
  handleRemoveItem: (localId: string) => void;
  total: number;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#0F4C81]">{title}</h4>
        <span className="text-sm font-semibold text-slate-700">{formatCurrency(total)}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          No hay ítems en esta sección.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.localId}
              className="grid items-center gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[2fr_90px_120px_110px_140px_110px]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.code}</p>
                {item.parentGroupName ? (
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {item.parentGroupType === 'PACKAGE' ? 'Paquete' : 'Canasta'}: {item.parentGroupName}
                    {item.lockedByPackage ? ' · Bloqueado' : ''}
                  </p>
                ) : null}
              </div>

              <input
                type="number"
                min={1}
                value={item.quantity}
                disabled={item.lockedByPackage}
                onChange={(e) => handleQuantityChange(item.localId, Number(e.target.value))}
                className="input-clinical disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="text-sm text-slate-700">{formatCurrency(item.basePrice)}</div>
              <div className="text-sm font-semibold text-slate-700">
                {item.lockedByPackage ? 'Fijo' : item.appliedFactor === 1 ? '100%' : '50%'}
              </div>
              <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</div>

              {item.lockedByPackage ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bloqueado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.localId)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionCard
        title="Resumen clínico"
        subtitle="Vista consolidada del paciente y de la cobertura seleccionada."
      >
        <div className="space-y-3 text-sm text-slate-600">
          <SummaryRow label="RUT" value={rut || '-'} />
          <SummaryRow label="Paciente" value={[firstName, lastName].filter(Boolean).join(' ') || '-'} />
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
            <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Descuento</span>
            <span className="font-medium text-slate-900">{formatCurrency(discountTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>

          {notes && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-[#0F4C81]">Observaciones:</span> {notes}
            </div>
          )}
        </div>
      </SectionCard>

      <div className="md:col-span-2">
        <SectionCard
          title="Ítems incluidos"
          subtitle="Listado final de ítems incorporados al presupuesto."
        >
          {budgetItems.length === 0 ? (
            <p className="text-sm text-slate-500">No hay ítems para resumir.</p>
          ) : (
            <div className="space-y-3">
              {budgetItems.map((item) => (
                <div
                  key={item.localId}
                  className="grid items-center gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.5fr_120px_120px_120px_140px]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.code} · {item.section}</p>
                    {item.parentGroupName ? (
                      <p className="text-xs text-slate-500">
                        {item.parentGroupType === 'PACKAGE' ? 'Paquete' : 'Canasta'}: {item.parentGroupName}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-700">Cantidad: {item.quantity}</div>
                  <div className="text-sm text-slate-700">Factor: {item.lockedByPackage ? 'Fijo' : item.appliedFactor === 1 ? '100%' : '50%'}</div>
                  <div className="text-sm text-slate-700">{formatCurrency(item.unitPrice)}</div>
                  <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
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

function MiniPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">{title}</div>
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
  if (!alert) return null;

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
