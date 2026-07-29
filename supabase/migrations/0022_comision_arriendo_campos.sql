-- Necesarios para calcular la comisión de arriendo (50%+IVA de la garantía si el
-- contrato dura <24 meses, o 2%+IVA del total de rentas si dura >=24 meses).
-- Nullable: se completan recién al cerrar el arriendo, mismo criterio que
-- gastos_comunes/contribuciones en 0017.
alter table public.propiedades_inventario
  add column if not exists plazo_contrato_meses integer,
  add column if not exists meses_garantia integer;
