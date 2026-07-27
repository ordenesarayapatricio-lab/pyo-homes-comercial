-- 22 compradores ya conocidos/en gestión directa: se excluyen del bot de
-- WhatsApp y se registran en el CRM como contactos + leads_compradores.

insert into public.bot_exclusiones (telefono, nombre, motivo) values
  ('56988080556', 'Marcela Arroyo', 'comprador_en_gestion'),
  ('56997955251', 'Alexa Condell', 'comprador_en_gestion'),
  ('56961237569', 'Luz', 'comprador_en_gestion'),
  ('56966121504', 'Romi', 'comprador_en_gestion'),
  ('56963734410', 'Maria Solis Paredes', 'comprador_en_gestion'),
  ('56936111208', 'Mauricio Aravena Zamora', 'comprador_en_gestion'),
  ('56942283727', 'Gladys Becerra', 'comprador_en_gestion'),
  ('56988615743', 'xxspidergirl', 'comprador_en_gestion'),
  ('56953613936', 'Yara Araya', 'comprador_en_gestion'),
  ('56994272096', 'Roger Gutierrez', 'comprador_en_gestion'),
  ('56995530294', 'Alejandro Jarufe', 'comprador_en_gestion'),
  ('56958219156', 'Ignacia Lopez', 'comprador_en_gestion'),
  ('56997882581', 'Renato Huerta', 'comprador_en_gestion'),
  ('56957204936', 'Pablo MM', 'comprador_en_gestion'),
  ('56995232437', 'Jacqui', 'comprador_en_gestion'),
  ('56939636326', 'Sin nombre', 'comprador_en_gestion'),
  ('56967037677', 'Julithu', 'comprador_en_gestion'),
  ('56992653860', 'Karen Patricia', 'comprador_en_gestion'),
  ('56974545334', 'Solcito', 'comprador_en_gestion'),
  ('56977906690', 'Sin nombre 2', 'comprador_en_gestion'),
  ('56987867761', 'Elizabeth', 'comprador_en_gestion'),
  ('56971415618', 'Carolina Oyanedel', 'comprador_en_gestion')
on conflict (telefono) do nothing;

do $$
declare
  v_contacto_id uuid;
  v_nombre text;
  v_telefono text;
  v_rows text[][] := array[
    array['Marcela Arroyo', '56988080556'],
    array['Alexa Condell', '56997955251'],
    array['Luz', '56961237569'],
    array['Romi', '56966121504'],
    array['Maria Solis Paredes', '56963734410'],
    array['Mauricio Aravena Zamora', '56936111208'],
    array['Gladys Becerra', '56942283727'],
    array['xxspidergirl', '56988615743'],
    array['Yara Araya', '56953613936'],
    array['Roger Gutierrez', '56994272096'],
    array['Alejandro Jarufe', '56995530294'],
    array['Ignacia Lopez', '56958219156'],
    array['Renato Huerta', '56997882581'],
    array['Pablo MM', '56957204936'],
    array['Jacqui', '56995232437'],
    array['Sin nombre', '56939636326'],
    array['Julithu', '56967037677'],
    array['Karen Patricia', '56992653860'],
    array['Solcito', '56974545334'],
    array['Sin nombre 2', '56977906690'],
    array['Elizabeth', '56987867761'],
    array['Carolina Oyanedel', '56971415618']
  ];
  v_row text[];
begin
  foreach v_row slice 1 in array v_rows loop
    v_nombre := v_row[1];
    v_telefono := v_row[2];

    insert into public.contactos (nombre, telefono, tipo_contacto)
    values (v_nombre, v_telefono, array['comprador'])
    on conflict (telefono) do update set tipo_contacto = public.contactos.tipo_contacto
    returning id into v_contacto_id;

    insert into public.leads_compradores (contacto_id, nombre, telefono, estado_workflow)
    values (v_contacto_id, v_nombre, v_telefono, 'Contactado');
  end loop;
end $$;
