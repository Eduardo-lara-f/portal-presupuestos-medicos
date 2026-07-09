'use client';

import ProcedureCategoryMaintainer from '../../components/procedure-category-maintainer';

export default function MaintainersProceduresPage() {
  return (
    <ProcedureCategoryMaintainer
      category="PROCEDURE"
      itemType="PROCEDURE"
      pageTitle="Mantenedor de prestaciones"
      singularLabel="Prestación"
      pluralLabel="Prestaciones"
    />
  );
}