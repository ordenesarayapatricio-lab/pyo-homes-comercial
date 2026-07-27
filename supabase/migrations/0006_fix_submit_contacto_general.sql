-- contactos.tipo_contacto tiene un check constraint que solo acepta
-- 'propietario'/'comprador'/'arrendatario'. submit_contacto_general (usada
-- por el formulario de contacto general de la landing, que no siempre
-- implica uno de esos 3 roles) no debe forzar un valor ahí.

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
  insert into public.contactos (nombre, telefono, email)
  values (p_nombre, p_telefono, p_email)
  on conflict (telefono) do update
    set nombre = coalesce(public.contactos.nombre, excluded.nombre),
        email = coalesce(public.contactos.email, excluded.email)
  returning id into v_contacto_id;

  insert into public.interacciones_seguimiento (contacto_id, tipo_interaccion, detalle_conversacion)
  values (v_contacto_id, 'Correo', p_mensaje);

  return v_contacto_id;
end;
$$;
