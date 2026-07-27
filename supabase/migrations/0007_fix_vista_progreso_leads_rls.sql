-- vista_progreso_leads corría con los permisos de quien la creó (bypass de
-- RLS), exponiendo datos de contactos a la key pública (anon). security_invoker
-- hace que la vista respete el RLS del rol que realmente está consultando.

alter view public.vista_progreso_leads set (security_invoker = true);
