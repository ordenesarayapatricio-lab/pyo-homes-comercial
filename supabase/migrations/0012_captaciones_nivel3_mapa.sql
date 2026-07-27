-- Nivel 3 de Captaciones: vista de mapa. Coordenadas geocodificadas manualmente desde el modal.

alter table public.propiedades_inventario
  add column if not exists latitud numeric(9, 6);

alter table public.propiedades_inventario
  add column if not exists longitud numeric(9, 6);
