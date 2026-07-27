-- Etapa del embudo de Captación (propietarios), condensada a 6 etapas
-- activas + 2 de "estacionamiento" (en pausa / perdida) — independiente de
-- `estado_workflow` (que sigue usándose para la vista genérica de contactos
-- en el Dashboard, compartida con compradores/arrendatarios).

alter table public.leads_propietarios
  add column if not exists etapa_captacion text not null default 'Prospección'
  check (etapa_captacion in (
    'Prospección', 'Evaluación', 'Captación Activa', 'En Negociación',
    'Cierre Legal', 'Entregada', 'En Pausa', 'Perdida'
  ));
