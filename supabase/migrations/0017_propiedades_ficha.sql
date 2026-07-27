-- Ficha Técnica Operativa y Financiera de Propiedades: convierte estado_propiedad
-- de texto libre siempre "Disponible" en un ciclo de vida real, agrega los campos
-- de la ficha (datos físicos, ubicación técnica, financieros, documentales) y una
-- tabla de historial de ofertas.

update public.propiedades_inventario set estado_propiedad = 'En Captación' where estado_propiedad = 'Disponible';
alter table public.propiedades_inventario
  add constraint chk_estado_propiedad check (estado_propiedad in
    ('En Captación','Publicada','En Negociación','Reservada','Vendida','En Arriendo'));
alter table public.propiedades_inventario alter column estado_propiedad set default 'En Captación';

alter table public.propiedades_inventario
  add column if not exists estacionamientos integer,
  add column if not exists bodegas integer,
  add column if not exists gastos_comunes numeric,
  add column if not exists contribuciones numeric,
  add column if not exists sector text,
  add column if not exists rol_sii text,
  add column if not exists link_google_maps text,
  add column if not exists link_tour_virtual text,
  add column if not exists link_portal_inmobiliario text,
  add column if not exists link_carpeta_legal text,
  add column if not exists mandato_exclusividad boolean not null default false,
  add column if not exists cedula_identidad_verificada boolean not null default false,
  add column if not exists margen_negociacion_uf numeric,
  add column if not exists fecha_publicacion date;

create table public.ofertas_propiedad (
  id bigint generated always as identity primary key,
  propiedad_id uuid not null references public.propiedades_inventario(id),
  comprador_id bigint references public.leads_compradores(id_comprador),
  monto_ofertado_uf numeric,
  medio_pago text,
  estado_oferta text not null default 'Pendiente' check (estado_oferta in ('Pendiente','Aceptada','Rechazada','Contraoferta')),
  fecha_oferta timestamptz not null default now(),
  notas text
);
