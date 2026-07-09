import ProcedureCategoryMaintainer from '../../components/procedure-category-maintainer';

export default function MaintainersDrugsPage() {
  return (
    <ProcedureCategoryMaintainer
      category="DRUG"
      itemType="MEDICATION"
      pageTitle="Mantenedor de medicamentos"
      singularLabel="Medicamento"
      pluralLabel="Medicamentos"
    />
  );
}