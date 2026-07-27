-- "Archivar" un lead sin abrir su ficha (acción rápida en la tabla de Leads) —
-- distinto de estado_workflow='Cerrado Perdido', que es un resultado real del embudo.

alter table public.leads_propietarios
  add column if not exists archivado boolean not null default false;

alter table public.leads_compradores
  add column if not exists archivado boolean not null default false;

alter table public.candidatos_arriendo
  add column if not exists archivado boolean not null default false;
