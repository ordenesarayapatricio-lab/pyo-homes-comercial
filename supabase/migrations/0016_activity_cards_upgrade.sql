-- Panel de control diario real para Actividades: tipo de actividad (unifica el
-- selector de ícono y los filtros por módulo), vínculo a un lead específico
-- (no solo al contacto genérico) y recordatorio automático por WhatsApp.

alter table public.activity_cards
  add column if not exists tipo_actividad text;

alter table public.activity_cards
  add column if not exists lead_origen text;

alter table public.activity_cards
  add column if not exists lead_ref_id bigint;

alter table public.activity_cards
  add column if not exists recordatorio_whatsapp boolean not null default false;
