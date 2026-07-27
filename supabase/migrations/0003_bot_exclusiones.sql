-- Contactos personales/laborales que nunca deben recibir la respuesta
-- automática del bot de WhatsApp (familia, amigos, colegas, y clientes de
-- propiedades ya en conversación directa con el corredor). WhatsApp no
-- permite consultar por API a qué etiqueta pertenece un contacto, así que
-- esta lista es la única forma de filtrarlos.

create table public.bot_exclusiones (
  telefono text primary key,
  nombre text,
  motivo text not null default 'personal',
  created_at timestamptz not null default now()
);

alter table public.bot_exclusiones enable row level security;

create policy "bot_exclusiones_authenticated_all" on public.bot_exclusiones
  for all to authenticated using (true) with check (true);

insert into public.bot_exclusiones (telefono, nombre) values
  ('56975264902', 'Mamita'),
  ('56939611806', 'Diego Hermano'),
  ('56957159698', 'Papá'),
  ('56937059947', 'Matilde Sobrina'),
  ('56982809931', 'Astrid Hermana'),
  ('56938836970', 'Francisco Hermano'),
  ('56938963911', 'Hans'),
  ('56983131771', 'Agua Gladimar'),
  ('56936730367', 'Nico'),
  ('56969193342', 'Bastian Ahumada'),
  ('56959763514', 'Elias Ramos'),
  ('56966271245', 'Nico Veliz'),
  ('56957384666', 'Edualdito'),
  ('56920413638', 'Albert Martinez DJ'),
  ('56972130934', 'Stephanie Carvallo'),
  ('56976748900', 'Felix'),
  ('56974737933', 'Bale polola hermano'),
  ('56996219571', 'Angelica'),
  ('56996302739', 'Don Pancho'),
  ('56978459678', 'Andres Pachuco'),
  ('56957771259', 'Valeska'),
  ('56997802688', 'Javi'),
  ('56959929464', 'Valeria F'),
  ('56986901325', 'Edu'),
  ('56963917071', 'Mauricio Diaz Obra civil'),
  ('56996793506', 'Rodrigo Lagos'),
  ('56984633527', 'Roberto Meneses'),
  ('56933816541', 'Caro'),
  ('56967418221', 'Alexis Itaud'),
  ('56993449797', 'Marco Scotiabank'),
  ('56996231465', 'Francisca Bci'),
  ('56954295622', 'Natalia Santander'),
  ('56962380577', 'Katia Banco chile'),
  ('56962410482', 'Alain Sejas'),
  ('56926278058', 'Cordinadora Viña'),
  ('56985472346', 'Raul Vargas'),
  ('56922332530', 'Cordinadora HyC'),
  ('56945448915', 'Jorge Hinojosa'),
  ('56982623969', 'Cordinadora Biobio'),
  ('56940276937', 'Cordinadora Administracion'),
  ('56947321800', 'Andres Iturra'),
  ('56979888705', 'Carlos Cruz Hyc'),
  ('56939220063', 'Olga HyC'),
  ('56956780997', 'Nadia HyC'),
  ('56975835069', 'Marcela Cantillano'),
  ('56986548126', 'HyC asociados La Serena'),
  ('56946126955', 'Alonso Becker'),
  ('56982402825', 'Rodrigo Group Habix'),
  ('56971490660', 'Carolina Riquelme Itau'),
  ('56995307357', 'Darinka Obligado')
on conflict (telefono) do nothing;
