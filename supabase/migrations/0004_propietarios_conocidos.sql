-- 5 propietarios ya conocidos/en gestión directa: se excluyen del bot de
-- WhatsApp (igual que los contactos personales) y se registran en el CRM
-- como contactos + leads_propietarios, para que aparezcan en el dashboard.

insert into public.bot_exclusiones (telefono, nombre, motivo) values
  ('56991239921', 'Ricardo Rojas', 'propietario_en_gestion'),
  ('56942583399', 'Carola Sepulveda', 'propietario_en_gestion'),
  ('56934332553', 'Juan Arredondo', 'propietario_en_gestion'),
  ('56942454173', 'Alejandro', 'propietario_en_gestion'),
  ('56932490407', 'Joel Pereira', 'propietario_en_gestion')
on conflict (telefono) do nothing;

do $$
declare
  v_contacto_id uuid;
begin
  insert into public.contactos (nombre, telefono, tipo_contacto)
  values ('Ricardo Rojas', '56991239921', array['propietario'])
  on conflict (telefono) do update set tipo_contacto = public.contactos.tipo_contacto
  returning id into v_contacto_id;
  insert into public.leads_propietarios (contacto_id, nombre_dueno, telefono, motivacion_venta, estado_workflow)
  values (v_contacto_id, 'Ricardo Rojas', '56991239921', 'Propiedad de referencia: Casa Pudeto', 'Contactado');

  insert into public.contactos (nombre, telefono, tipo_contacto)
  values ('Carola Sepulveda', '56942583399', array['propietario'])
  on conflict (telefono) do update set tipo_contacto = public.contactos.tipo_contacto
  returning id into v_contacto_id;
  insert into public.leads_propietarios (contacto_id, nombre_dueno, telefono, motivacion_venta, estado_workflow)
  values (v_contacto_id, 'Carola Sepulveda', '56942583399', 'Propiedad de referencia: Casa El Sendero', 'Contactado');

  insert into public.contactos (nombre, telefono, tipo_contacto)
  values ('Juan Arredondo', '56934332553', array['propietario'])
  on conflict (telefono) do update set tipo_contacto = public.contactos.tipo_contacto
  returning id into v_contacto_id;
  insert into public.leads_propietarios (contacto_id, nombre_dueno, telefono, motivacion_venta, estado_workflow)
  values (v_contacto_id, 'Juan Arredondo', '56934332553', 'Propiedad de referencia: Casa Carrera 50', 'Contactado');

  insert into public.contactos (nombre, telefono, tipo_contacto)
  values ('Alejandro', '56942454173', array['propietario'])
  on conflict (telefono) do update set tipo_contacto = public.contactos.tipo_contacto
  returning id into v_contacto_id;
  insert into public.leads_propietarios (contacto_id, nombre_dueno, telefono, motivacion_venta, estado_workflow)
  values (v_contacto_id, 'Alejandro', '56942454173', 'Propiedad de referencia: Condominio Finka Poniente', 'Contactado');

  insert into public.contactos (nombre, telefono, tipo_contacto)
  values ('Joel Pereira', '56932490407', array['propietario'])
  on conflict (telefono) do update set tipo_contacto = public.contactos.tipo_contacto
  returning id into v_contacto_id;
  insert into public.leads_propietarios (contacto_id, nombre_dueno, telefono, motivacion_venta, estado_workflow)
  values (v_contacto_id, 'Joel Pereira', '56932490407', 'Propiedad de referencia: Casa Fiestas Patrias', 'Contactado');
end $$;
