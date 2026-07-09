import ProcedureCategoryMaintainer from '../../components/procedure-category-maintainer';

export default function MaintainersMedicalFeesPage() {
  return (
    <ProcedureCategoryMaintainer
      category="MEDICAL_FEE"
      itemType="MEDICAL_FEE"
      pageTitle="Mantenedor de honorarios médicos"
      singularLabel="Honorario médico"
      pluralLabel="Honorarios médicos"
    />
  );
}