-- Reconcile the generic CRM schema from 0001 with the pre-existing, more
-- complete real-estate schema already in this project (contactos,
-- leads_propietarios/leads_compradores/candidatos_arriendo,
-- propiedades_inventario, etc.) that the WhatsApp bot's n8n workflow
-- already targets. The generic tables below are unused (empty) and are
-- superseded by that schema; only the Activities Kanban board is kept,
-- repointed at `contactos` instead of the dropped `leads` table.

-- ── Drop the superseded generic schema from 0001 ─────────────────────────
drop function if exists public.submit_lead(text, text, text, text, text, text, text, text, text);
drop table if exists public.lead_activities cascade;
drop table if exists public.properties cascade;
drop table if exists public.leads cascade;

-- ── Repoint the Kanban board at contactos instead of leads ───────────────
alter table public.activity_cards drop column if exists lead_id;
alter table public.activity_cards
  add column if not exists contacto_id uuid references public.contactos (id) on delete set null;

-- ── Enable RLS + authenticated-only policies on the real CRM tables ──────
-- Idempotent: safe to run whether or not RLS/policies already existed.
do $$
declare
  t text;
  tables text[] := array[
    'contactos', 'propiedades_inventario', 'leads_propietarios', 'leads_compradores',
    'candidatos_arriendo', 'chatbot_leads', 'interacciones_seguimiento',
    'interacciones_visitas', 'evaluaciones_comerciales', 'documentacion_arrendatario',
    'match_alertas'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t
    );
  end loop;
end $$;

-- n8n writes to these tables using the Supabase service role key (bypasses
-- RLS), so the policies above only affect the dashboard's `authenticated`
-- users and the public `anon` role used by the landing page.

-- ── Safe public lead-capture functions (for the landing page, Fase 3) ────
-- `anon` gets no direct table access; these SECURITY DEFINER functions are
-- the only way a public form submission can create/update a contacto.

create unique index if not exists contactos_telefono_key on public.contactos (telefono);

create or replace function public.submit_contacto_comprador(
  p_nombre text,
  p_telefono text,
  p_email text,
  p_presupuesto_uf text,
  p_zona_interes text,
  p_tipo_operacion text,
  p_necesidades_clave text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contacto_id uuid;
  v_lead_id bigint;
begin
  insert into public.contactos (nombre, telefono, email, tipo_contacto)
  values (p_nombre, p_telefono, p_email, array['comprador'])
  on conflict (telefono) do update
    set nombre = coalesce(public.contactos.nombre, excluded.nombre),
        email = coalesce(public.contactos.email, excluded.email),
        tipo_contacto = (
          select array_agg(distinct v) from unnest(public.contactos.tipo_contacto || excluded.tipo_contacto) as v
        )
  returning id into v_contacto_id;

  insert into public.leads_compradores (
    contacto_id, nombre, telefono, presupuesto_uf, zona_interes, tipo_operacion, necesidades_clave, estado_workflow
  ) values (
    v_contacto_id, p_nombre, p_telefono, p_presupuesto_uf, p_zona_interes, p_tipo_operacion, p_necesidades_clave, 'Nuevo'
  )
  returning id_comprador into v_lead_id;

  return v_lead_id;
end;
$$;

create or replace function public.submit_contacto_propietario(
  p_nombre text,
  p_telefono text,
  p_email text,
  p_direccion text,
  p_tipo_propiedad text,
  p_comentarios text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contacto_id uuid;
  v_lead_id bigint;
begin
  insert into public.contactos (nombre, telefono, email, tipo_contacto)
  values (p_nombre, p_telefono, p_email, array['propietario'])
  on conflict (telefono) do update
    set nombre = coalesce(public.contactos.nombre, excluded.nombre),
        email = coalesce(public.contactos.email, excluded.email),
        tipo_contacto = (
          select array_agg(distinct v) from unnest(public.contactos.tipo_contacto || excluded.tipo_contacto) as v
        )
  returning id into v_contacto_id;

  insert into public.leads_propietarios (
    contacto_id, nombre_dueno, telefono, motivacion_venta, estado_workflow
  ) values (
    v_contacto_id, p_nombre, p_telefono,
    concat_ws(' — ', p_direccion, p_tipo_propiedad, p_comentarios),
    'Nuevo'
  )
  returning id_lead into v_lead_id;

  return v_lead_id;
end;
$$;

create or replace function public.submit_contacto_general(
  p_nombre text,
  p_telefono text,
  p_email text,
  p_mensaje text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contacto_id uuid;
begin
  insert into public.contactos (nombre, telefono, email, tipo_contacto)
  values (p_nombre, p_telefono, p_email, array['contacto'])
  on conflict (telefono) do update
    set nombre = coalesce(public.contactos.nombre, excluded.nombre),
        email = coalesce(public.contactos.email, excluded.email)
  returning id into v_contacto_id;

  insert into public.interacciones_seguimiento (contacto_id, tipo_interaccion, detalle_conversacion)
  values (v_contacto_id, 'Correo', p_mensaje);

  return v_contacto_id;
end;
$$;

grant execute on function public.submit_contacto_comprador(text, text, text, text, text, text, text) to anon;
grant execute on function public.submit_contacto_propietario(text, text, text, text, text, text) to anon;
grant execute on function public.submit_contacto_general(text, text, text, text) to anon;
