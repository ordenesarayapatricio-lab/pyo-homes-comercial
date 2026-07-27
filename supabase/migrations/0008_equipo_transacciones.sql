insert into public.bot_exclusiones (telefono, nombre, motivo) values
  ('56225039225', 'Equipo transacciones', 'equipo_interno')
on conflict (telefono) do nothing;
