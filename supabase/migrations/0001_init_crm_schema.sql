-- CRM schema for PyO Homes Comercial
-- Tables: leads (shared by web forms + WhatsApp bot), properties,
-- lead_activities (per-lead timeline), and the Activities Kanban board
-- (activity_columns / activity_cards / activity_card_attachments).

create extension if not exists pgcrypto;

-- ── leads ─────────────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text,
  phone text not null,
  email text,
  source text not null default 'manual'
    check (source in ('web_buyer', 'web_seller', 'web_contact', 'whatsapp', 'manual')),
  intent text
    check (intent in ('buy', 'rent', 'sell', 'unknown')),
  property_type text,
  zone text,
  budget text,
  requirements text,
  stage text not null default 'new'
    check (stage in ('new', 'contacted', 'negotiation', 'closed_won', 'closed_lost')),
  value numeric,
  last_activity_at timestamptz not null default now()
);

create unique index leads_phone_key on public.leads (phone);

-- ── properties ────────────────────────────────────────────────────────────
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  type text,
  address text,
  price numeric,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'sold')),
  owner_lead_id uuid references public.leads (id) on delete set null
);

-- ── lead_activities (per-lead timeline, incl. WhatsApp messages) ─────────
create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  type text not null
    check (type in ('note', 'call', 'status_change', 'email', 'whatsapp_message')),
  description text,
  created_at timestamptz not null default now()
);

-- ── Activities Kanban board (dashboard "Actividades") ────────────────────
create table public.activity_columns (
  id text primary key,
  title text not null,
  "order" integer not null default 0
);

create table public.activity_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  column_id text not null references public.activity_columns (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_card_attachments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.activity_cards (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  size bigint not null,
  created_at timestamptz not null default now()
);

insert into public.activity_columns (id, title, "order") values
  ('todo', 'Por Hacer', 0),
  ('today', 'Hoy', 1),
  ('in_progress', 'En Proceso', 2),
  ('done', 'Terminadas', 3)
on conflict (id) do nothing;

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.leads enable row level security;
alter table public.properties enable row level security;
alter table public.lead_activities enable row level security;
alter table public.activity_columns enable row level security;
alter table public.activity_cards enable row level security;
alter table public.activity_card_attachments enable row level security;

create policy "leads_authenticated_all" on public.leads
  for all to authenticated using (true) with check (true);

create policy "properties_authenticated_all" on public.properties
  for all to authenticated using (true) with check (true);

create policy "lead_activities_authenticated_all" on public.lead_activities
  for all to authenticated using (true) with check (true);

create policy "activity_columns_authenticated_all" on public.activity_columns
  for all to authenticated using (true) with check (true);

create policy "activity_cards_authenticated_all" on public.activity_cards
  for all to authenticated using (true) with check (true);

create policy "activity_card_attachments_authenticated_all" on public.activity_card_attachments
  for all to authenticated using (true) with check (true);

-- No RLS policy grants anon direct INSERT/SELECT on `leads` — public web
-- submissions go through `submit_lead()` below instead, so a visitor can
-- never set stage/value or read other people's leads from the browser.

-- ── submit_lead(): the only way `anon` can create a lead ─────────────────
create or replace function public.submit_lead(
  p_full_name text,
  p_phone text,
  p_email text,
  p_source text,
  p_intent text,
  p_property_type text,
  p_zone text,
  p_budget text,
  p_requirements text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_source not in ('web_buyer', 'web_seller', 'web_contact') then
    raise exception 'invalid source for public submission: %', p_source;
  end if;

  insert into public.leads (
    full_name, phone, email, source, intent, property_type, zone, budget, requirements, stage
  ) values (
    p_full_name, p_phone, p_email, p_source, p_intent, p_property_type, p_zone, p_budget, p_requirements, 'new'
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.submit_lead(text, text, text, text, text, text, text, text, text) to anon;

-- ── Storage bucket for Kanban card attachments ────────────────────────────
insert into storage.buckets (id, name, public)
values ('activity-attachments', 'activity-attachments', false)
on conflict (id) do nothing;

create policy "activity_attachments_authenticated_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'activity-attachments')
  with check (bucket_id = 'activity-attachments');
