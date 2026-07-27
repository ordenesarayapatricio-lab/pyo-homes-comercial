-- Campos universales del formulario "Nuevo Lead": origen del contacto y asignación,
-- más "Inversión" como motivo de venta válido.

alter table public.contactos
  add column if not exists origen text;

alter table public.contactos
  add column if not exists asignado_a text default 'Patricio Araya';

-- El check de motivo_categoria se agregó sin nombre explícito en la migración 0010
-- (Postgres le asignó el nombre automático leads_propietarios_motivo_categoria_check).
-- Lo recreamos agregando 'Inversión' a la lista de valores permitidos.
do $$
begin
  execute (
    select format('alter table public.leads_propietarios drop constraint %I', con.conname)
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'leads_propietarios'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%motivo_categoria%'
    limit 1
  );
exception when others then
  null; -- no existía ningún constraint sobre motivo_categoria, seguimos
end $$;

alter table public.leads_propietarios
  add constraint leads_propietarios_motivo_categoria_check
  check (motivo_categoria in (
    'Mudanza', 'Herencia', 'Falta de liquidez', 'Enfermedad', 'Divorcio',
    'Le va bien en la vida', 'Inversión', 'Otro'
  ));
