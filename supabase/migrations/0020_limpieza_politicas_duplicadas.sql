-- Elimina políticas RLS duplicadas (mismo roles/cmd/using/check que su equivalente
-- "*_authenticated_all") — confirmado idénticas antes de borrar, no cambia ningún
-- comportamiento del proyecto, solo deja una sola política por tabla en vez de dos.
drop policy if exists auth_acceso_candidatos_arriendo on public.candidatos_arriendo;
drop policy if exists auth_acceso_contactos on public.contactos;
drop policy if exists auth_acceso_interacciones_seguimiento on public.interacciones_seguimiento;
drop policy if exists auth_acceso_leads_compradores on public.leads_compradores;
drop policy if exists auth_acceso_leads_propietarios on public.leads_propietarios;
drop policy if exists auth_acceso_propiedades_inventario on public.propiedades_inventario;
