-- Valor de una negociación/cierre específico en curso para un comprador,
-- distinto de presupuesto_uf (lo que dijo que quería gastar inicialmente).

alter table public.leads_compradores
  add column if not exists valor_negociacion_uf numeric;
