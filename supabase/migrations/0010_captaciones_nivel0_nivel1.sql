-- Captaciones v2 — Nivel 0 (vincular cada captación a una propiedad real) +
-- Nivel 1 (termómetro de urgencia, etiqueta de motivo, días en la etapa,
-- alerta de enfriamiento — las acciones rápidas de WhatsApp/llamada/correo
-- no necesitan cambios de esquema, se arman en el frontend).

-- ── Nivel 1: nuevas columnas en leads_propietarios ────────────────────────
alter table public.leads_propietarios
  add column if not exists motivo_categoria text
  check (motivo_categoria in (
    'Mudanza', 'Herencia', 'Falta de liquidez', 'Enfermedad', 'Divorcio',
    'Le va bien en la vida', 'Otro'
  ));

alter table public.leads_propietarios
  add column if not exists etapa_captacion_changed_at timestamptz not null default now();

alter table public.leads_propietarios
  add constraint chk_urgencia_venta check (urgencia_venta is null or urgencia_venta between 1 and 5);

-- Trigger: actualiza etapa_captacion_changed_at solo cuando la etapa
-- realmente cambia (no en cualquier edición de la tarjeta).
create or replace function public.fn_leads_propietarios_etapa_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.etapa_captacion is distinct from old.etapa_captacion then
    new.etapa_captacion_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_propietarios_etapa_changed on public.leads_propietarios;
create trigger trg_leads_propietarios_etapa_changed
  before update on public.leads_propietarios
  for each row execute function public.fn_leads_propietarios_etapa_changed();

-- ── Nivel 0: vincular cada captación a una fila real de propiedad ────────
-- Backfill de las captaciones que todavía no tienen propiedad_id, usando el
-- texto libre que hoy vive en motivacion_venta como dirección inicial.
do $$
declare
  r record;
  new_prop_id uuid;
begin
  for r in
    select id_lead, nombre_dueno, motivacion_venta, contacto_id
    from public.leads_propietarios
    where propiedad_id is null
  loop
    insert into public.propiedades_inventario (
      codigo_interno, titulo, direccion, propietario_id, tipo_negocio, estado_propiedad
    ) values (
      'AUTO-' || substr(gen_random_uuid()::text, 1, 8),
      concat('Propiedad de ', r.nombre_dueno),
      coalesce(nullif(r.motivacion_venta, ''), 'Sin dirección registrada'),
      r.contacto_id,
      'Venta',
      'Disponible'
    )
    returning id into new_prop_id;

    update public.leads_propietarios set propiedad_id = new_prop_id where id_lead = r.id_lead;
  end loop;
end $$;
