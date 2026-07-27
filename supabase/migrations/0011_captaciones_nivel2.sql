-- Nivel 2 de Captaciones: checklist de documentos + panel de Evaluación Comercial.

alter table public.propiedades_inventario
  add column if not exists certificado_gravamenes boolean not null default false;

alter table public.propiedades_inventario
  add column if not exists dominio_vigente boolean not null default false;

alter table public.evaluaciones_comerciales
  add column if not exists valor_ajuste_uf numeric;

-- Una evaluación comercial activa por propiedad (permite upsert por propiedad_uuid).
alter table public.evaluaciones_comerciales
  add constraint uq_evaluaciones_comerciales_propiedad unique (propiedad_uuid);
