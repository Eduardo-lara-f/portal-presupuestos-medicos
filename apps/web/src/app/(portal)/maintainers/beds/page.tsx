import ProcedureCategoryMaintainer from '../components/procedure-category-maintainer';

export default function MaintainersBedsPage() {
  return (
    <ProcedureCategoryMaintainer
      category="BED"
      pageTitle="Mantenedor de días cama"
      singularLabel="Día cama"
      pluralLabel="Días cama"
    />
  );
}