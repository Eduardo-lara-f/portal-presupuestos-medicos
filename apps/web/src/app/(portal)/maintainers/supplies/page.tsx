import ProcedureCategoryMaintainer from '../../components/procedure-category-maintainer';

export default function MaintainersSuppliesPage() {
  return (
    <ProcedureCategoryMaintainer
      category="SUPPLY"
      itemType="SUPPLY"
      pageTitle="Mantenedor de insumos"
      singularLabel="Insumo"
      pluralLabel="Insumos"
    />
  );
}