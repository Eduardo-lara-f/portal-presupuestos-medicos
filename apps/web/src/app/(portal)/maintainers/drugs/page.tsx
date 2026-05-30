import ProcedureCategoryMaintainer from '../components/procedure-category-maintainer';

export default function MaintainersDrugsPage() {
  return (
    <ProcedureCategoryMaintainer
      category="DRUG"
      pageTitle="Mantenedor de medicamentos"
      singularLabel="Medicamento"
      pluralLabel="Medicamentos"
    />
  );
}