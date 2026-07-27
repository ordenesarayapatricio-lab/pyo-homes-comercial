-- ofertas_propiedad se creó sin política de RLS y el insert desde el dashboard
-- (usuario autenticado) fue rechazado con 403. Mismo modelo de acceso que el resto
-- de las tablas de este CRM: un solo admin autenticado, sin ownership por fila.
alter table public.ofertas_propiedad enable row level security;

create policy "Acceso completo autenticado" on public.ofertas_propiedad
  for all
  to authenticated
  using (true)
  with check (true);
