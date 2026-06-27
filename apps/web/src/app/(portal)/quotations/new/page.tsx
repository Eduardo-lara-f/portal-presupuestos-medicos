'use client';

import React, { useEffect, useMemo, useState } from 'react';

type CareType = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type CareAccess = 'AMBULATORY' | 'SURGICAL' | 'BOTH';
type Step = 0 | 1 | 2 | 3;
type BillingSection = 'PROCEDURE' | 'SUPPLY' | 'DRUG' | 'BED';
type CoverageType = 'ISAPRE_PLAN' | 'FONASA' | 'PARTICULAR' | 'OTHER';

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

type CoverageCatalogItem = {
  type: CoverageType;
  label: string;
  enabled: boolean;
  requiresIsapre: boolean;
  requiresPlan: boolean;
  requiresFonasaCode: boolean;
  requiresPayerLabel: boolean;
};

type CoverageCatalogResponse = {
  divisionId: number;
  coverages: CoverageCatalogItem[];
  isapres: Isapre[];
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
  coverageType: CoverageType;
  isapreId?: number | null;
  isaprePlanId?: number | null;
  fonasaCode?: string | null;
  payerLabel?: string | null;
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
  packageType?: 'PAD' | 'CONVENTIONAL' | null;
  active: boolean;
  items: Array<{
    procedureId: number;
    quantity: number;
    priceMode: string;
    fixedPrice?: string | number | null;
    procedure?: Procedure;
  }>;
};

type PackageSuggestionResult = {
  id: number;
  code: string;
  name: string;
  packageType?: 'PAD' | 'CONVENTIONAL' | null;
};

type PackageByProcedureResponse = {
  hasPackage: boolean;
  packages: PackageSuggestionResult[];
};

type PackageEvaluationResponse = {
  packageId: number;
  packageType?: 'PAD' | 'CONVENTIONAL' | null;
  isPad: boolean;
  requiresCampaignSelection: boolean;
  campaign: {
    id: number;
    name: string;
    discountPercentage: number;
  } | null;
};

type QuoteItemResponse = {
  id: number;
  parentId?: number | null;
  sourceId: number;
  sourceType: string;
  description: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  type: string;
  editable?: boolean | null;
};

type QuoteResponse = {
  id: number;
  items: QuoteItemResponse[];
};

type BudgetSourceType = 'PROCEDURE' | 'BASKET' | 'PACKAGE' | 'MEDICAL_FEE';

type BudgetItem = {
  localId: string;
  quoteItemId?: number | null;
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

type PendingPackageSuggestion = {
  procedure: Procedure;
  packages: PackageSuggestionResult[];
};

type PendingCampaignSelection = {
  pkg: PackageResponse;
  evaluation: PackageEvaluationResponse;
};

type PendingPadSelection = {
  pkg: PackageResponse;
};

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  careAccess?: CareAccess | null;
  status: boolean;
  divisionId?: number | null;
  division?: {
    id: number;
    name: string;
    code?: string;
    corporationId?: number | null;
    brandPrimaryColor?: string;
    brandSecondaryColor?: string;
    brandAccentColor?: string;
    brandLogoKey?: string;
  } | null;
};

type AddedGroupSummary = {
  groupKey: string;
  groupId: number;
  groupName: string;
  groupType: 'BASKET' | 'PACKAGE';
  itemCount: number;
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

  const [, setAuthUser] = useState<AuthUser | null>(null);
  const [userCareAccess, setUserCareAccess] = useState<CareAccess>('BOTH');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDivisionName, setSelectedDivisionName] = useState('-');

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

  const [coverageCatalog, setCoverageCatalog] = useState<CoverageCatalogItem[]>([]);
  const [loadingCoverageCatalog, setLoadingCoverageCatalog] = useState(false);
  const [selectedCoverageType, setSelectedCoverageType] =
    useState<CoverageType>('ISAPRE_PLAN');

  const [isapres, setIsapres] = useState<Isapre[]>([]);
  const [loadingIsapres, setLoadingIsapres] = useState(false);
  const [selectedIsapreId, setSelectedIsapreId] = useState('');

  const [plans, setPlans] = useState<IsaprePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [fonasaCode, setFonasaCode] = useState('');
  const [payerLabel, setPayerLabel] = useState('');

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

  const [showBasketFinder, setShowBasketFinder] = useState(false);
  const [showPackageFinder, setShowPackageFinder] = useState(false);

  const [pendingPackageSuggestion, setPendingPackageSuggestion] =
    useState<PendingPackageSuggestion | null>(null);
  const [pendingCampaignSelection, setPendingCampaignSelection] =
    useState<PendingCampaignSelection | null>(null);
  const [pendingPadSelection, setPendingPadSelection] =
    useState<PendingPadSelection | null>(null);
  const [processingPackageFlow, setProcessingPackageFlow] = useState(false);

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [discountTotal, setDiscountTotal] = useState('0');
  const [notes, setNotes] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [createdByUserId, setCreatedByUserId] = useState<number | null>(null);

  const [alert, setAlert] = useState<AlertState>(null);

  const currentCoverageConfig = useMemo(() => {
    return (
      coverageCatalog.find((item) => item.type === selectedCoverageType) ?? null
    );
  }, [coverageCatalog, selectedCoverageType]);

  const allowedCareTypes = useMemo(() => {
    return {
      ambulatory: userCareAccess === 'AMBULATORY' || userCareAccess === 'BOTH',
      surgical: userCareAccess === 'SURGICAL' || userCareAccess === 'BOTH',
    };
  }, [userCareAccess]);

  useEffect(() => {
    try {
      const rawAuthUser = localStorage.getItem('authUser');
      if (!rawAuthUser) return;

      const parsedAuthUser = JSON.parse(rawAuthUser) as AuthUser;

      if (typeof parsedAuthUser?.id === 'number') {
        setCreatedByUserId(parsedAuthUser.id);
      }

      setAuthUser(parsedAuthUser);
      setUserCareAccess(parsedAuthUser.careAccess ?? 'BOTH');

      const divisionId =
        parsedAuthUser?.divisionId ?? parsedAuthUser?.division?.id ?? null;
      const divisionName = parsedAuthUser?.division?.name ?? '-';

      if (typeof divisionId === 'number') {
        setSelectedDivisionId(String(divisionId));
        setSelectedDivisionName(divisionName);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!alert) return;
    const duration = alert.type === 'error' ? 7000 : 4500;
    const timer = window.setTimeout(() => setAlert(null), duration);
    return () => window.clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    async function loadCoverageCatalog() {
      if (!selectedDivisionId) {
        setCoverageCatalog([]);
        setIsapres([]);
        setSelectedCoverageType('ISAPRE_PLAN');
        setSelectedIsapreId('');
        setSelectedPlanId('');
        setFonasaCode('');
        setPayerLabel('');
        return;
      }

      try {
        setLoadingCoverageCatalog(true);
        setLoadingIsapres(true);

        const response = await fetch(
          `${API_URL}/procedure-prices/catalog?divisionId=${selectedDivisionId}`,
        );

        if (!response.ok) {
          const message = await getApiErrorMessage(
            response,
            'No se pudo cargar el catálogo de coberturas.',
          );

          console.error('Error cargando catálogo de coberturas', {
            status: response.status,
            statusText: response.statusText,
            message,
            url: `${API_URL}/procedure-prices/catalog?divisionId=${selectedDivisionId}`,
          });

          throw new Error(message);
        }

        const data: CoverageCatalogResponse = await response.json();
        setCoverageCatalog(data.coverages ?? []);
        setIsapres(data.isapres ?? []);

        const enabledCoverages = (data.coverages ?? []).filter((item) => item.enabled);
        const isapreCoverage = enabledCoverages.find(
          (item) => item.type === 'ISAPRE_PLAN',
        );

        const nextCoverageType =
          isapreCoverage?.type ?? enabledCoverages[0]?.type ?? 'ISAPRE_PLAN';

        setSelectedCoverageType(nextCoverageType);

        if (nextCoverageType === 'ISAPRE_PLAN') {
          const firstIsapreId = data.isapres?.[0]?.id;
          setSelectedIsapreId(firstIsapreId ? String(firstIsapreId) : '');
          setSelectedPlanId('');
        } else {
          setSelectedIsapreId('');
          setSelectedPlanId('');
          setPlans([]);
        }

        if (nextCoverageType !== 'FONASA') {
          setFonasaCode('');
        }

        if (nextCoverageType !== 'PARTICULAR' && nextCoverageType !== 'OTHER') {
          setPayerLabel('');
        }
      } catch (error) {
        console.error(error);
        setCoverageCatalog([]);
        setIsapres([]);
        setAlert({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar las coberturas de la división seleccionada.',
        });
      } finally {
        setLoadingCoverageCatalog(false);
        setLoadingIsapres(false);
      }
    }

    loadCoverageCatalog();
  }, [selectedDivisionId]);

  useEffect(() => {
    async function loadPlans() {
      if (!selectedIsapreId || selectedCoverageType !== 'ISAPRE_PLAN') {
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
        setSelectedPlanId((currentPlanId) => {
          const currentPlanStillExists = data.some(
            (plan) => String(plan.id) === currentPlanId,
          );

          if (currentPlanStillExists) {
            return currentPlanId;
          }

          return data[0]?.id ? String(data[0].id) : '';
        });
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
  }, [selectedIsapreId, selectedCoverageType]);

  useEffect(() => {
    if (careType === 'AMBULATORY') {
      setShowPackageFinder(false);
      setPendingPackageSuggestion(null);
      setPendingCampaignSelection(null);
      setPendingPadSelection(null);
      setPackageResults([]);
      setPackageSearch('');
    }
  }, [careType]);

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

  const selectedCoverageName = useMemo(() => {
    return (
      coverageCatalog.find((item) => item.type === selectedCoverageType)?.label ??
      selectedCoverageType
    );
  }, [coverageCatalog, selectedCoverageType]);

  const selectedIsapreName = useMemo(() => {
    return isapres.find((item) => String(item.id) === selectedIsapreId)?.name ?? '-';
  }, [isapres, selectedIsapreId]);

  const selectedPlanName = useMemo(() => {
    return plans.find((item) => String(item.id) === selectedPlanId)?.name ?? '-';
  }, [plans, selectedPlanId]);

  const coverageDetailLabel = useMemo(() => {
    if (selectedCoverageType === 'ISAPRE_PLAN') {
      if (selectedIsapreName !== '-' && selectedPlanName !== '-') {
        return `${selectedIsapreName} / ${selectedPlanName}`;
      }

      return '-';
    }

    if (selectedCoverageType === 'FONASA') {
      return fonasaCode.trim() || '-';
    }

    if (selectedCoverageType === 'PARTICULAR' || selectedCoverageType === 'OTHER') {
      return payerLabel.trim() || '-';
    }

    return '-';
  }, [
    selectedCoverageType,
    selectedIsapreName,
    selectedPlanName,
    fonasaCode,
    payerLabel,
  ]);

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
    if (value === 'AMBULATORY' && !allowedCareTypes.ambulatory) {
      setAlert({
        type: 'warning',
        message: 'Su usuario no tiene acceso al módulo ambulatorio.',
      });
      return;
    }

    if (value === 'SURGICAL' && !allowedCareTypes.surgical) {
      setAlert({
        type: 'warning',
        message: 'Su usuario no tiene acceso al módulo quirúrgico.',
      });
      return;
    }

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

  function handleCoverageTypeSelection(nextType: CoverageType) {
    setSelectedCoverageType(nextType);

    if (nextType !== 'ISAPRE_PLAN') {
      setSelectedIsapreId('');
      setSelectedPlanId('');
      setPlans([]);
    }

    if (nextType !== 'FONASA') {
      setFonasaCode('');
    }

    if (nextType !== 'PARTICULAR' && nextType !== 'OTHER') {
      setPayerLabel('');
    }
  }

  function validateCoverageSelection() {
    if (!currentCoverageConfig?.enabled) {
      return 'La cobertura seleccionada no está habilitada para la división.';
    }

    if (currentCoverageConfig.requiresIsapre && !selectedIsapreId) {
      return 'Seleccione una isapre antes de continuar.';
    }

    if (currentCoverageConfig.requiresPlan && !selectedPlanId) {
      return 'Seleccione un plan antes de continuar.';
    }

    if (currentCoverageConfig.requiresFonasaCode && !fonasaCode.trim()) {
      return 'Ingrese el código Fonasa antes de continuar.';
    }

    if (currentCoverageConfig.requiresPayerLabel && !payerLabel.trim()) {
      return 'Ingrese el pagador antes de continuar.';
    }

    return null;
  }

  async function handleSearchPatient() {
    if (!rut.trim() || !selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Debe ingresar un RUT válido antes de buscar.',
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

    if (!selectedDivisionId) {
      setAlert({
        type: 'error',
        message: 'No se pudo identificar la división asignada del usuario.',
      });
      return;
    }

    if (!patientId && (!rut.trim() || !firstName.trim() || !lastName.trim())) {
      setAlert({
        type: 'warning',
        message: 'Complete RUT, nombres y apellidos antes de continuar.',
      });
      return;
    }

    const coverageValidationError = validateCoverageSelection();
    if (coverageValidationError) {
      setAlert({
        type: 'warning',
        message: coverageValidationError,
      });
      return;
    }

    if (patientId) {
      goToNextStep();
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

    const coverageValidationError = validateCoverageSelection();
    if (coverageValidationError) {
      throw new Error(coverageValidationError);
    }

    const params = new URLSearchParams({
      divisionId: selectedDivisionId,
      procedureId: String(procedureId),
      coverageType: selectedCoverageType,
    });

    if (selectedCoverageType === 'ISAPRE_PLAN') {
      params.set('isapreId', selectedIsapreId);
      params.set('isaprePlanId', selectedPlanId);
    }

    if (selectedCoverageType === 'FONASA' && fonasaCode.trim()) {
      params.set('fonasaCode', fonasaCode.trim());
    }

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
      quoteItemId: null,
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

  function buildQuoteCoveragePayload() {
    const base = {
      coverageType: selectedCoverageType,
      isapreId: undefined as number | undefined,
      isaprePlanId: undefined as number | undefined,
      fonasaCode: undefined as string | undefined,
      payerLabel: undefined as string | undefined,
    };

    if (selectedCoverageType === 'ISAPRE_PLAN') {
      return {
        ...base,
        isapreId: Number(selectedIsapreId),
        isaprePlanId: Number(selectedPlanId),
      };
    }

    if (selectedCoverageType === 'FONASA') {
      return {
        ...base,
        fonasaCode: fonasaCode.trim() || undefined,
      };
    }

    if (selectedCoverageType === 'PARTICULAR' || selectedCoverageType === 'OTHER') {
      return {
        ...base,
        payerLabel: payerLabel.trim() || undefined,
      };
    }

    return base;
  }

  async function ensureDraftQuote() {
    if (quoteId) {
      return quoteId;
    }

    if (!careType || !selectedDivisionId || !patientId || !createdByUserId) {
      throw new Error('Faltan datos para crear el borrador de cotización.');
    }

    const coverageValidationError = validateCoverageSelection();
    if (coverageValidationError) {
      throw new Error(coverageValidationError);
    }

    const response = await fetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        divisionId: Number(selectedDivisionId),
        patientId,
        ...buildQuoteCoveragePayload(),
        careType,
        validityDays: 15,
        discountTotal: Number(discountTotal || 0),
        notes: notes || undefined,
        createdByUserId,
        items: [],
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo crear el borrador de la cotización.'));
    }

    const data = await safeParseJson<{ id: number }>(response);

    if (!data?.id) {
      throw new Error('La API no devolvió un borrador válido.');
    }

    setQuoteId(data.id);
    return data.id;
  }

  async function fetchPackagesByProcedure(procedureId: number) {
    const params = new URLSearchParams({
      procedureId: String(procedureId),
      divisionId: selectedDivisionId,
    });

    const response = await fetch(`${API_URL}/packages/by-procedure?${params.toString()}`);

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo verificar si existe un paquete para la prestación.'));
    }

    const data = await safeParseJson<PackageByProcedureResponse>(response);
    return data ?? { hasPackage: false, packages: [] };
  }

  async function fetchPackageDetail(packageId: number) {
    const response = await fetch(`${API_URL}/packages/${packageId}`);

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo cargar el detalle del paquete.'));
    }

    const data = await safeParseJson<PackageResponse>(response);

    if (!data) {
      throw new Error('No fue posible cargar el paquete seleccionado.');
    }

    return data;
  }

  async function evaluatePackage(packageId: number) {
    const response = await fetch(`${API_URL}/packages/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId }),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo evaluar el paquete.'));
    }

    const data = await safeParseJson<PackageEvaluationResponse>(response);

    if (!data) {
      throw new Error('La evaluación del paquete no devolvió datos.');
    }

    return data;
  }

  async function createQuoteItemInBackend(payload: {
    sourceType: 'PROCEDURE' | 'BASKET' | 'PACKAGE';
    sourceId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    type: 'PROCEDURE' | 'BASKET' | 'PACKAGE';
    parentId?: number;
  }) {
    const draftQuoteId = await ensureDraftQuote();

    const response = await fetch(`${API_URL}/quotes/${draftQuoteId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo agregar el ítem a la cotización.'));
    }

    const data = await safeParseJson<{
      id: number;
      quoteId: number;
      parentId?: number | null;
      sourceId: number;
      sourceType: string;
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      type: string;
    }>(response);

    if (!data?.id) {
      throw new Error('La API no devolvió el ítem creado.');
    }

    return data;
  }

  function mapQuotePackageItemsToBudgetItems(
    quote: QuoteResponse,
    packageQuoteItemId: number,
  ): BudgetItem[] {
    const itemsById = new Map<number, QuoteItemResponse>();

    quote.items.forEach((item) => {
      itemsById.set(item.id, item);
    });

    const packageRoot = itemsById.get(packageQuoteItemId);

    if (!packageRoot) {
      return [];
    }

    return quote.items
      .filter((item) => item.parentId === packageQuoteItemId)
      .map((item) => ({
        localId: `QUOTEITEM-${item.id}`,
        quoteItemId: item.id,
        sourceId: item.sourceId,
        sourceType: item.type === 'MEDICAL_FEE' ? 'MEDICAL_FEE' : 'PACKAGE',
        parentGroupId: packageQuoteItemId,
        parentGroupKey: `PACKAGE-${packageQuoteItemId}`,
        parentGroupType: 'PACKAGE' as const,
        parentGroupName: packageRoot.description,
        lockedByPackage: true,
        section:
          item.type === 'MEDICAL_FEE'
            ? 'PROCEDURE'
            : resolveBillingSectionFromProcedure({
                id: Number(item.sourceId),
                divisionId: 0,
                code: String(item.sourceId ?? '-'),
                name: item.description,
                category: null,
                careType: 'BOTH',
                active: true,
              }),
        code: item.type === 'MEDICAL_FEE' ? 'HONORARIO' : String(item.sourceId ?? '-'),
        name: item.description,
        quantity: Number(item.quantity),
        basePrice: Number(item.unitPrice),
        appliedFactor: 1,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }));
  }

  async function addPackageThroughBackend(
    pkg: PackageResponse,
    options?: {
      applyCampaign?: boolean;
      campaignId?: number;
      padFactor?: number;
    },
  ) {
    const draftQuoteId = await ensureDraftQuote();

    const response = await fetch(`${API_URL}/quotes/${draftQuoteId}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: pkg.id,
        applyCampaign: options?.applyCampaign ?? false,
        campaignId: options?.campaignId,
        padFactor: options?.padFactor,
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo agregar el paquete a la cotización.'));
    }

    const packageResult = await safeParseJson<{
      packageQuoteItemId: number;
      isPad: boolean;
      goToSummary: boolean;
      campaignApplied: boolean;
    }>(response);

    if (!packageResult?.packageQuoteItemId) {
      throw new Error('La API no devolvió el paquete agregado.');
    }

    const quoteResponse = await fetch(`${API_URL}/quotes/${draftQuoteId}`);

    if (!quoteResponse.ok) {
      throw new Error(await getApiErrorMessage(quoteResponse, 'No se pudo sincronizar la cotización.'));
    }

    const quoteData = await safeParseJson<QuoteResponse>(quoteResponse);

    if (!quoteData) {
      throw new Error('No se pudo sincronizar el detalle de la cotización.');
    }

    const newPackageItems = mapQuotePackageItemsToBudgetItems(
      quoteData,
      packageResult.packageQuoteItemId,
    );

    setBudgetItems((prev) => applySectionBillingRule([...prev, ...newPackageItems]));

    if (packageResult.goToSummary) {
      setCurrentStep(3);
    }

    return packageResult;
  }

  async function handleSearchProcedures() {
    if (!selectedDivisionId) {
      setAlert({
        type: 'warning',
        message: 'Seleccione una división antes de buscar prestaciones.',
      });
      return;
    }

    const coverageValidationError = validateCoverageSelection();
    if (coverageValidationError) {
      setAlert({
        type: 'warning',
        message: coverageValidationError,
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
    if (careType !== 'SURGICAL') {
      setAlert({
        type: 'warning',
        message: 'Los paquetes solo están disponibles en presupuestos quirúrgicos.',
      });
      return;
    }

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
        careType: 'SURGICAL',
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

    try {
      setAddingProcedureId(procedure.id);
      setAlert(null);

      if (careType === 'SURGICAL') {
        const packageData = await fetchPackagesByProcedure(procedure.id);

        if (packageData.hasPackage && packageData.packages.length > 0) {
          setPendingPackageSuggestion({
            procedure,
            packages: packageData.packages,
          });
          return;
        }
      }

      const basePrice = await resolveProcedureAgreementPrice(procedure.id);

      const createdItem = await createQuoteItemInBackend({
        sourceType: 'PROCEDURE',
        sourceId: procedure.id,
        description: procedure.name,
        quantity: 1,
        unitPrice: basePrice,
        type: 'PROCEDURE',
      });

      setBudgetItems((prev) => {
        const newItem = buildBudgetItem({
          procedure,
          quantity: Number(createdItem.quantity),
          basePrice: Number(createdItem.unitPrice),
          sourceType: 'PROCEDURE',
          lockedByPackage: false,
        });

        const next: BudgetItem[] = [
          ...prev,
          {
            ...newItem,
            localId: `QUOTEITEM-${createdItem.id}`,
            quoteItemId: createdItem.id,
          },
        ];

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

  async function handleProceedWithoutPackage() {
    if (!pendingPackageSuggestion) {
      return;
    }

    try {
      const basePrice = await resolveProcedureAgreementPrice(pendingPackageSuggestion.procedure.id);

      const createdItem = await createQuoteItemInBackend({
        sourceType: 'PROCEDURE',
        sourceId: pendingPackageSuggestion.procedure.id,
        description: pendingPackageSuggestion.procedure.name,
        quantity: 1,
        unitPrice: basePrice,
        type: 'PROCEDURE',
      });

      setBudgetItems((prev) => {
        const newItem = buildBudgetItem({
          procedure: pendingPackageSuggestion.procedure,
          quantity: Number(createdItem.quantity),
          basePrice: Number(createdItem.unitPrice),
          sourceType: 'PROCEDURE',
          lockedByPackage: false,
        });

        const next: BudgetItem[] = [
          ...prev,
          {
            ...newItem,
            localId: `QUOTEITEM-${createdItem.id}`,
            quoteItemId: createdItem.id,
          },
        ];

        return applySectionBillingRule(next);
      });

      setAlert({
        type: 'success',
        message: `Prestación "${pendingPackageSuggestion.procedure.name}" agregada correctamente al presupuesto.`,
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo agregar la prestación.',
      });
    } finally {
      setPendingPackageSuggestion(null);
    }
  }

  async function handleChooseSuggestedPackage(pkg: PackageSuggestionResult) {
    if (careType !== 'SURGICAL') {
      setAlert({
        type: 'warning',
        message: 'Los paquetes solo están disponibles en presupuestos quirúrgicos.',
      });
      return;
    }

    try {
      setProcessingPackageFlow(true);
      setAddingPackageId(pkg.id);

      const evaluation = await evaluatePackage(pkg.id);
      const packageDetail = await fetchPackageDetail(pkg.id);
      setPendingPackageSuggestion(null);

      if (evaluation.isPad) {
        setPendingPadSelection({ pkg: packageDetail });
        return;
      }

      if (evaluation.requiresCampaignSelection && evaluation.campaign) {
        setPendingCampaignSelection({
          pkg: packageDetail,
          evaluation,
        });
        return;
      }

      await addPackageThroughBackend(packageDetail);

      setAlert({
        type: 'success',
        message: `Paquete "${packageDetail.name}" agregado correctamente al presupuesto.`,
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo procesar el paquete sugerido.',
      });
    } finally {
      setProcessingPackageFlow(false);
      setAddingPackageId(null);
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

      const createdBasketParent = await createQuoteItemInBackend({
        sourceType: 'BASKET',
        sourceId: basket.id,
        description: basket.name,
        quantity: 1,
        unitPrice: 0,
        type: 'BASKET',
      });

      const groupKey = `BASKET-${createdBasketParent.id}`;
      const newItems: BudgetItem[] = [];

      for (const basketItem of basket.items) {
        const procedure = basketItem.procedure;

        if (!procedure) {
          throw new Error(`La canasta "${basket.name}" tiene un ítem sin prestación asociada.`);
        }

        const basePrice = await resolveProcedureAgreementPrice(procedure.id);

        const createdChildItem = await createQuoteItemInBackend({
          sourceType: 'PROCEDURE',
          sourceId: procedure.id,
          description: procedure.name,
          quantity: basketItem.quantity,
          unitPrice: basePrice,
          type: 'PROCEDURE',
          parentId: createdBasketParent.id,
        });

        newItems.push({
          ...buildBudgetItem({
            procedure,
            quantity: basketItem.quantity,
            basePrice,
            sourceType: 'BASKET',
            parentGroupId: createdBasketParent.id,
            parentGroupKey: groupKey,
            parentGroupType: 'BASKET',
            parentGroupName: basket.name,
            lockedByPackage: false,
          }),
          localId: `QUOTEITEM-${createdChildItem.id}`,
          quoteItemId: createdChildItem.id,
        });
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

  async function handleBeginPackageFlow(pkg: PackageResponse) {
    if (careType !== 'SURGICAL') {
      setAlert({
        type: 'warning',
        message: 'Los paquetes solo están disponibles en presupuestos quirúrgicos.',
      });
      return;
    }

    try {
      setProcessingPackageFlow(true);
      setAddingPackageId(pkg.id);

      const evaluation = await evaluatePackage(pkg.id);

      if (evaluation.isPad) {
        setPendingPadSelection({ pkg });
        return;
      }

      if (evaluation.requiresCampaignSelection && evaluation.campaign) {
        setPendingCampaignSelection({
          pkg,
          evaluation,
        });
        return;
      }

      await addPackageThroughBackend(pkg);

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
      setProcessingPackageFlow(false);
      setAddingPackageId(null);
    }
  }

  async function handleAcceptCampaign() {
    if (!pendingCampaignSelection?.evaluation.campaign) {
      return;
    }

    try {
      setProcessingPackageFlow(true);

      await addPackageThroughBackend(pendingCampaignSelection.pkg, {
        applyCampaign: true,
        campaignId: pendingCampaignSelection.evaluation.campaign.id,
      });

      setAlert({
        type: 'success',
        message: `Paquete "${pendingCampaignSelection.pkg.name}" agregado con campaña aplicada.`,
      });

      setPendingCampaignSelection(null);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo aplicar la campaña.',
      });
    } finally {
      setProcessingPackageFlow(false);
    }
  }

  async function handleRejectCampaign() {
    if (!pendingCampaignSelection) {
      return;
    }

    try {
      setProcessingPackageFlow(true);

      await addPackageThroughBackend(pendingCampaignSelection.pkg);

      setAlert({
        type: 'success',
        message: `Paquete "${pendingCampaignSelection.pkg.name}" agregado sin campaña.`,
      });

      setPendingCampaignSelection(null);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo agregar el paquete.',
      });
    } finally {
      setProcessingPackageFlow(false);
    }
  }

  async function handleSelectPadFactor(padFactor: number) {
    if (!pendingPadSelection) {
      return;
    }

    try {
      setProcessingPackageFlow(true);

      await addPackageThroughBackend(pendingPadSelection.pkg, {
        padFactor,
      });

      setAlert({
        type: 'success',
        message: `Paquete PAD "${pendingPadSelection.pkg.name}" agregado correctamente.`,
      });

      setPendingPadSelection(null);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo agregar el paquete PAD.',
      });
    } finally {
      setProcessingPackageFlow(false);
    }
  }

  async function updateQuoteItemQuantityInBackend(itemId: number, quantity: number) {
    const draftQuoteId = await ensureDraftQuote();

    const response = await fetch(`${API_URL}/quotes/${draftQuoteId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo actualizar la cantidad del ítem.'));
    }

    return safeParseJson<{
      id: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>(response);
  }

  async function deleteQuoteItemInBackend(itemId: number) {
    const draftQuoteId = await ensureDraftQuote();

    const response = await fetch(`${API_URL}/quotes/${draftQuoteId}/items/${itemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo eliminar el ítem de la cotización.'));
    }
  }

  async function deleteQuoteGroupInBackend(groupItemId: number) {
    const draftQuoteId = await ensureDraftQuote();

    const response = await fetch(`${API_URL}/quotes/${draftQuoteId}/groups/${groupItemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'No se pudo eliminar el grupo de la cotización.'));
    }
  }

  async function handleQuantityChange(localId: string, quantity: number) {
    if (quantity < 1) {
      setAlert({
        type: 'warning',
        message: 'La cantidad mínima permitida es 1.',
      });
      return;
    }

    try {
      const target = budgetItems.find((item) => item.localId === localId);

      if (!target || target.lockedByPackage) {
        return;
      }

      if (target.quoteItemId) {
        await updateQuoteItemQuantityInBackend(target.quoteItemId, quantity);
      }

      setBudgetItems((prev) => {
        const next = prev.map((item) =>
          item.localId === localId ? { ...item, quantity } : item,
        );
        return applySectionBillingRule(next);
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo actualizar la cantidad.',
      });
    }
  }

  async function handleRemoveItem(localId: string) {
    try {
      const target = budgetItems.find((item) => item.localId === localId);

      if (!target || target.lockedByPackage) {
        return;
      }

      if (target.quoteItemId) {
        await deleteQuoteItemInBackend(target.quoteItemId);
      }

      setBudgetItems((prev) => {
        const next = prev.filter((item) => item.localId !== localId);
        return applySectionBillingRule(next);
      });

      setAlert({
        type: 'info',
        message: 'El ítem fue eliminado del presupuesto.',
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo eliminar el ítem.',
      });
    }
  }

  async function handleRemoveGroup(groupKey: string, groupType: 'BASKET' | 'PACKAGE') {
    try {
      const groupRoot = budgetItems.find(
        (item) => item.parentGroupKey === groupKey && item.parentGroupId,
      );

      if (groupRoot?.parentGroupId) {
        await deleteQuoteGroupInBackend(groupRoot.parentGroupId);
      }

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
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo eliminar el grupo.',
      });
    }
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

      const patientFullName = [firstName, lastName, middleName]
        .filter((value) => value.trim())
        .join(' ');

      const pdfItems = budgetItems.map((item) => ({
        section: item.section,
        code: item.code || '-',
        name: item.name || '-',
        quantity: Number(item.quantity || 0),
        appliedFactor: Number(item.appliedFactor || 1),
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || 0),
      }));

      const payload = {
        quotationNumber: quoteId ? `COT-${quoteId}` : `BORRADOR-${Date.now()}`,
        divisionName: selectedDivisionName || '-',
        careType,
        patient: {
          rut: rut || '-',
          fullName: patientFullName || '-',
          email: email || '-',
          phone: phone || '-',
        },
        coverage: {
          type: selectedCoverageType,
          label: selectedCoverageName,
          coverageName: selectedCoverageName,
          detailLabel: coverageDetailLabel,
          isapreName:
            selectedCoverageType === 'ISAPRE_PLAN' && selectedIsapreName !== '-'
              ? selectedIsapreName
              : undefined,
          planName:
            selectedCoverageType === 'ISAPRE_PLAN' && selectedPlanName !== '-'
              ? selectedPlanName
              : undefined,
          fonasaCode:
            selectedCoverageType === 'FONASA' ? fonasaCode.trim() || undefined : undefined,
          payerLabel:
            selectedCoverageType === 'PARTICULAR' || selectedCoverageType === 'OTHER'
              ? payerLabel.trim() || undefined
              : undefined,
        },
        items: pdfItems,
        subtotal: Number(subtotal || 0),
        discountTotal: Number(discountTotal || 0),
        total: Number(total || 0),
        notes: notes || '',
        generatedAt: new Date().toLocaleString('es-CL'),
      };

      console.log('PDF payload JSON:', JSON.stringify(payload, null, 2));

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
        console.error('PDF payload JSON:', JSON.stringify(payload, null, 2));
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
    <main className="min-h-screen bg-gradient-to-br from-[var(--brand-primary-soft)] via-white to-[var(--brand-secondary-soft)]">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-5">
        <HeroHeader careType={careType} currentStep={currentStep} />

        <section className="relative z-10 mt-4 mb-5 grid gap-3 md:mt-5 md:grid-cols-4">
          <StepCard number="01" label="Tipo" active={currentStep === 0} done={currentStep > 0} />
          <StepCard number="02" label="Paciente" active={currentStep === 1} done={currentStep > 1} />
          <StepCard number="03" label="Presupuesto" active={currentStep === 2} done={currentStep > 2} />
          <StepCard number="04" label="Resumen" active={currentStep === 3} done={false} />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[var(--brand-secondary-soft)] bg-white shadow-[0_15px_50px_-20px_rgba(15,76,129,0.28)]">
          <div
            className="border-b border-[var(--brand-secondary-soft)] px-6 py-4 text-white"
            style={{
              background:
                'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
            }}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  Flujo de emisión
                </p>
                <h2 className="mt-1 text-2xl font-bold">{stepTitle}</h2>
              </div>

              {careType && currentStep > 0 && (
                <div
                  className={[
                    'inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide',
                    careType === 'AMBULATORY'
                      ? 'bg-white/90 text-slate-800'
                      : 'bg-white/90 text-slate-800',
                  ].join(' ')}
                >
                  {careType === 'AMBULATORY' ? 'Ambulatorio' : 'Quirúrgico'}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 md:p-7">
            {currentStep === 0 && (
              <InitialCareTypeStep
                careType={careType}
                allowedCareTypes={allowedCareTypes}
                onSelect={selectCareType}
              />
            )}

            {currentStep === 1 && (
              <SectionCard
                title="Identificación del paciente y cobertura"
                subtitle={`Busque al paciente por RUT y complete los datos si aún no existe en la división ${selectedDivisionName}. La cobertura se carga desde el mismo catálogo que usa el mantenedor de precios.`}
              >
                <div className="mb-4 rounded-2xl border border-[var(--brand-secondary-soft)] bg-[var(--brand-primary-soft)] px-4 py-3 text-sm text-slate-700">
                  <span className="font-semibold text-[var(--brand-primary)]">División asignada:</span>{' '}
                  {selectedDivisionName}
                </div>

                <div className="grid items-end gap-4 md:grid-cols-3">
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

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleSearchPatient}
                      disabled={loadingPatient || !selectedDivisionId}
                      className="btn-health-primary h-[46px]"
                    >
                      {loadingPatient ? 'Buscando...' : 'Verificar RUT'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 border-t border-[var(--brand-secondary-soft)] pt-6 md:grid-cols-2">
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

                <div className="mt-6 border-t border-[var(--brand-secondary-soft)] pt-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-[var(--brand-primary)]">Cobertura</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Seleccione la cobertura desde el catálogo centralizado antes de continuar.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Tipo de cobertura">
                      <select
                        value={selectedCoverageType}
                        onChange={(e) =>
                          handleCoverageTypeSelection(e.target.value as CoverageType)
                        }
                        className="input-clinical"
                        disabled={loadingCoverageCatalog || !coverageCatalog.length}
                      >
                        {coverageCatalog
                          .filter((item) => item.enabled)
                          .map((item) => (
                            <option key={item.type} value={item.type}>
                              {item.label}
                            </option>
                          ))}
                      </select>
                    </Field>

                    <Field label="Estado del catálogo">
                      <div className="input-clinical flex items-center bg-slate-50 text-slate-600">
                        {loadingCoverageCatalog
                          ? 'Cargando coberturas...'
                          : currentCoverageConfig
                          ? 'Cobertura disponible'
                          : 'Sin coberturas configuradas'}
                      </div>
                    </Field>

                    {currentCoverageConfig?.requiresIsapre && (
                      <Field label="Isapre">
                        <select
                          value={selectedIsapreId}
                          onChange={(e) => {
                            setSelectedIsapreId(e.target.value);
                            setSelectedPlanId('');
                          }}
                          className="input-clinical"
                          disabled={loadingIsapres || !selectedDivisionId}
                        >
                          <option value="">Seleccione isapre</option>
                          {isapres.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}

                    {currentCoverageConfig?.requiresPlan && (
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
                    )}

                    {currentCoverageConfig?.requiresFonasaCode && (
                      <Field label="Código Fonasa">
                        <input
                          type="text"
                          value={fonasaCode}
                          onChange={(e) => setFonasaCode(e.target.value)}
                          className="input-clinical"
                          placeholder="Ingrese código Fonasa"
                        />
                      </Field>
                    )}

                    {currentCoverageConfig?.requiresPayerLabel && (
                      <Field label="Pagador">
                        <input
                          type="text"
                          value={payerLabel}
                          onChange={(e) => setPayerLabel(e.target.value)}
                          className="input-clinical"
                          placeholder="Ingrese pagador"
                        />
                      </Field>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {currentStep === 2 && (
              <BudgetStep
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
                handleAddPackage={handleBeginPackageFlow}
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
                careType={careType}
                showBasketFinder={showBasketFinder}
                setShowBasketFinder={setShowBasketFinder}
                showPackageFinder={showPackageFinder}
                setShowPackageFinder={setShowPackageFinder}
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
                coverageLabel={selectedCoverageName}
                coverageDetailLabel={coverageDetailLabel}
                budgetItems={budgetItems}
                subtotal={subtotal}
                discountTotal={Number(discountTotal || 0)}
                total={total}
                notes={notes}
              />
            )}

            {currentStep > 0 && (
              <div className="mt-8 flex items-center justify-between border-t border-[var(--brand-secondary-soft)] pt-6">
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

      <PackageSuggestionModal
        open={!!pendingPackageSuggestion}
        procedureName={pendingPackageSuggestion?.procedure.name ?? ''}
        packages={pendingPackageSuggestion?.packages ?? []}
        loading={processingPackageFlow}
        onClose={() => setPendingPackageSuggestion(null)}
        onContinueWithoutPackage={handleProceedWithoutPackage}
        onSelectPackage={handleChooseSuggestedPackage}
      />

      <CampaignSelectionModal
        open={!!pendingCampaignSelection}
        packageName={pendingCampaignSelection?.pkg.name ?? ''}
        campaignName={pendingCampaignSelection?.evaluation.campaign?.name ?? ''}
        discountPercentage={pendingCampaignSelection?.evaluation.campaign?.discountPercentage ?? 0}
        loading={processingPackageFlow}
        onClose={() => setPendingCampaignSelection(null)}
        onAccept={handleAcceptCampaign}
        onReject={handleRejectCampaign}
      />

      <PadSelectionModal
        open={!!pendingPadSelection}
        packageName={pendingPadSelection?.pkg.name ?? ''}
        loading={processingPackageFlow}
        onClose={() => setPendingPadSelection(null)}
        onSelectFactor={handleSelectPadFactor}
      />

      <FloatingToast alert={alert} onClose={() => setAlert(null)} />
    </main>
  );
}

function HeroHeader({
  careType,
  currentStep,
}: {
  careType: CareType | null;
  currentStep: Step;
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-[30px] border border-[var(--brand-secondary-soft)] bg-white shadow-[0_15px_45px_-25px_rgba(30,136,229,0.32)]">
      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div
          className="relative overflow-hidden px-6 py-7 text-white md:px-8 md:py-8"
          style={{
            background:
              'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
          }}
        >
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
              Portal de presupuestos médicos
            </div>

            <h1 className="max-w-xl text-3xl font-bold leading-tight md:text-[2.6rem]">
              Presupuestos clínicos simples, rápidos y trazables
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/88 md:text-base">
              Valide al paciente, seleccione cobertura y construya el presupuesto en un flujo único para admisión, clínica y cobranza.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <MiniPill>Atención conectada</MiniPill>
              <MiniPill>Precios por cobertura</MiniPill>
              <MiniPill>
                {careType && currentStep > 0
                  ? careType === 'AMBULATORY'
                    ? 'Modo ambulatorio'
                    : 'Modo quirúrgico'
                  : 'Seleccione modalidad'}
              </MiniPill>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary-soft)] via-white to-[var(--brand-secondary-soft)] p-5 md:p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--brand-primary-soft)] blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--brand-secondary-soft)] blur-2xl" />

          <div className="relative rounded-[24px] border border-[var(--brand-secondary-soft)] bg-white/92 p-5 shadow-[0_15px_40px_-25px_rgba(15,76,129,0.4)] backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                  Vista clínica
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Un presupuesto, una ruta clara
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-secondary-soft)] text-2xl">
                🏥
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-[150px] items-center justify-center rounded-3xl border border-[var(--brand-secondary-soft)] bg-gradient-to-br from-white to-[var(--brand-primary-soft)] p-4">
                <div className="relative h-24 w-24">
                  <div className="absolute inset-x-5 bottom-0 h-16 rounded-t-2xl bg-[var(--brand-primary)]/90" />
                  <div className="absolute inset-x-8 top-2 h-14 rounded-t-xl bg-[var(--brand-secondary)]/90" />
                  <div className="absolute left-1/2 top-9 h-10 w-3 -translate-x-1/2 rounded bg-white" />
                  <div className="absolute left-1/2 top-12 h-3 w-10 -translate-x-1/2 rounded bg-white" />
                  <div className="absolute bottom-0 left-1/2 h-8 w-7 -translate-x-1/2 rounded-t-lg bg-white/90" />
                </div>
              </div>

              <div className="space-y-3">
                <MiniPanel title="Paciente" value="Validación por RUT" />
                <MiniPanel title="Cobertura" value="Catálogo unificado" />
                <MiniPanel title="Presupuesto" value="Totales trazables" />
              </div>
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
        'rounded-2xl border px-4 py-3.5 transition-all shadow-sm',
        active
          ? 'border-[var(--brand-secondary)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-lg'
          : done
          ? 'border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] text-slate-800'
          : 'border-[var(--brand-secondary-soft)] bg-white text-slate-600',
      ].join(' ')}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
        {number}
      </div>
      <div className="mt-1 text-sm font-bold">{label}</div>
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
    <div className="rounded-[24px] border border-[var(--brand-secondary-soft)] bg-gradient-to-br from-white to-[var(--brand-primary-soft)] p-5 shadow-[0_15px_30px_-25px_rgba(15,76,129,0.35)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--brand-primary)]">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InitialCareTypeStep({
  careType,
  allowedCareTypes,
  onSelect,
}: {
  careType?: CareType | null;
  allowedCareTypes: {
    ambulatory: boolean;
    surgical: boolean;
  };
  onSelect: (value: CareType) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect('AMBULATORY')}
        disabled={!allowedCareTypes.ambulatory}
        className={[
          'rounded-[24px] border p-6 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50',
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
        {!allowedCareTypes.ambulatory && (
          <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            Sin acceso para este usuario
          </p>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSelect('SURGICAL')}
        disabled={!allowedCareTypes.surgical}
        className={[
          'rounded-[24px] border p-6 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50',
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
        {!allowedCareTypes.surgical && (
          <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            Sin acceso para este usuario
          </p>
        )}
      </button>
    </div>
  );
}


function BudgetStep({
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
  careType,
  showBasketFinder,
  setShowBasketFinder,
  showPackageFinder,
  setShowPackageFinder,
}: {
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
  handleQuantityChange: (localId: string, quantity: number) => Promise<void>;
  handleRemoveItem: (localId: string) => Promise<void>;
  handleRemoveGroup: (groupKey: string, groupType: 'BASKET' | 'PACKAGE') => Promise<void>;
  subtotal: number;
  sectionTotals: Record<BillingSection, number>;
  discountTotal: string;
  setDiscountTotal: React.Dispatch<React.SetStateAction<string>>;
  total: number;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  careType: CareType | null;
  showBasketFinder: boolean;
  setShowBasketFinder: React.Dispatch<React.SetStateAction<boolean>>;
  showPackageFinder: boolean;
  setShowPackageFinder: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const procedureItems = budgetItems.filter((item) => item.section === 'PROCEDURE');
  const supplyItems = budgetItems.filter((item) => item.section === 'SUPPLY');
  const drugItems = budgetItems.filter((item) => item.section === 'DRUG');
  const bedItems = budgetItems.filter((item) => item.section === 'BED');
  const packageSearchEnabled = careType === 'SURGICAL';

  return (
    <div className="space-y-6">
      <SectionCard
        title="Prestaciones clínicas"
        subtitle={
          packageSearchEnabled
            ? 'Busque una prestación. Los valores consultados consideran la cobertura seleccionada en el paso anterior. Si existe un paquete asociado, el sistema lo sugerirá antes de agregar la prestación individual.'
            : 'Busque una prestación. Los valores consultados consideran la cobertura seleccionada en el paso anterior. En modalidad ambulatoria solo podrá trabajar con prestaciones individuales y canastas.'
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowBasketFinder((prev) => !prev)}
            className="btn-health-secondary"
          >
            {showBasketFinder ? 'Cerrar buscador de canastas' : 'Buscador de canastas'}
          </button>

          {packageSearchEnabled && (
            <button
              type="button"
              onClick={() => setShowPackageFinder((prev) => !prev)}
              className="btn-health-secondary"
            >
              {showPackageFinder ? 'Cerrar buscador de paquetes' : 'Buscador de paquetes'}
            </button>
          )}
        </div>

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
                  {addingProcedureId === procedure.id ? 'Evaluando...' : 'Agregar'}
                </button>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {showBasketFinder && (
        <SectionCard
          title="Buscador de canastas"
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
      )}

      {packageSearchEnabled && showPackageFinder && (
        <SectionCard
          title="Buscador de paquetes"
          subtitle="Los paquetes se validan antes de agregarse para detectar campañas activas o comportamiento PAD."
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
                      {pkg.code}
                      {pkg.packageType ? ` · ${pkg.packageType === 'PAD' ? 'PAD' : 'Convencional'}` : ''}
                      {' · '}
                      {pkg.items.length} componente(s)
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
      )}

      {addedGroups.length > 0 && (
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

function PackageSuggestionModal({
  open,
  procedureName,
  packages,
  loading,
  onClose,
  onContinueWithoutPackage,
  onSelectPackage,
}: {
  open: boolean;
  procedureName: string;
  packages: PackageSuggestionResult[];
  loading: boolean;
  onClose: () => void;
  onContinueWithoutPackage: () => Promise<void>;
  onSelectPackage: (pkg: PackageSuggestionResult) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-2xl rounded-[24px] border border-sky-100 bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-[#0F4C81]">Existe un paquete disponible</h3>
        <p className="mt-2 text-sm text-slate-600">
          La prestación "{procedureName}" tiene uno o más paquetes asociados. Puede usar uno de ellos o continuar con la prestación individual.
        </p>

        <div className="mt-5 space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{pkg.name}</p>
                <p className="text-xs text-slate-500">
                  {pkg.code}
                  {pkg.packageType ? ` · ${pkg.packageType === 'PAD' ? 'PAD' : 'Convencional'}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectPackage(pkg)}
                disabled={loading}
                className="btn-health-primary"
              >
                {loading ? 'Procesando...' : 'Usar paquete'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-health-secondary">
            Cerrar
          </button>
          <button
            type="button"
            onClick={onContinueWithoutPackage}
            disabled={loading}
            className="btn-health-primary"
          >
            Agregar prestación
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignSelectionModal({
  open,
  packageName,
  campaignName,
  discountPercentage,
  loading,
  onClose,
  onAccept,
  onReject,
}: {
  open: boolean;
  packageName: string;
  campaignName: string;
  discountPercentage: number;
  loading: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-xl rounded-[24px] border border-sky-100 bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-[#0F4C81]">Campaña activa en honorarios</h3>
        <p className="mt-2 text-sm text-slate-600">
          El paquete "{packageName}" tiene la campaña "{campaignName}" activa. Puede aplicar el descuento de {discountPercentage}% sobre honorarios médicos o continuar sin campaña.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-health-secondary">
            Cerrar
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="btn-health-secondary"
          >
            Continuar sin campaña
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="btn-health-primary"
          >
            {loading ? 'Aplicando...' : 'Aplicar campaña'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PadSelectionModal({
  open,
  packageName,
  loading,
  onClose,
  onSelectFactor,
}: {
  open: boolean;
  packageName: string;
  loading: boolean;
  onClose: () => void;
  onSelectFactor: (factor: number) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-xl rounded-[24px] border border-sky-100 bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-[#0F4C81]">Paquete PAD</h3>
        <p className="mt-2 text-sm text-slate-600">
          El paquete "{packageName}" corresponde a un PAD. Seleccione el factor correspondiente y el sistema lo agregará bloqueado y lo enviará directo al resumen.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectFactor(0.5)}
            disabled={loading}
            className="btn-health-primary"
          >
            {loading ? 'Procesando...' : 'Parto (50%)'}
          </button>

          <button
            type="button"
            onClick={() => onSelectFactor(0.25)}
            disabled={loading}
            className="btn-health-secondary"
          >
            {loading ? 'Procesando...' : 'Cesárea (25%)'}
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn-health-secondary">
            Cerrar
          </button>
        </div>
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
  handleQuantityChange: (localId: string, quantity: number) => Promise<void>;
  handleRemoveItem: (localId: string) => Promise<void>;
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
                onChange={(e) => void handleQuantityChange(item.localId, Number(e.target.value))}
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
                  onClick={() => void handleRemoveItem(item.localId)}
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
  coverageLabel,
  coverageDetailLabel,
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
  coverageLabel: string;
  coverageDetailLabel: string;
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
          <SummaryRow label="Cobertura" value={coverageLabel} />
          <SummaryRow label="Detalle cobertura" value={coverageDetailLabel} />
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
    <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
      {children}
    </span>
  );
}

function MiniPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand-secondary-soft)] bg-[var(--brand-primary-soft)] px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-secondary)]">{title}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--brand-primary)]">{value}</div>
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