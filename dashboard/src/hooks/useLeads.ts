import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { EstadoWorkflow } from "../lib/mockData";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export type LeadRol = "vendedor" | "comprador" | "arrendatario";
export type LeadOrigen = "leads_propietarios" | "leads_compradores" | "candidatos_arriendo";

export const ROL_LABELS: Record<LeadRol, string> = {
  vendedor: "Vendedor",
  comprador: "Comprador",
  arrendatario: "Arrendatario",
};

// Mismo listado fijo de comunas usado en el selector de Zona de Interés al crear
// un lead y en el filtro avanzado de Leads.tsx — sin columna array en el esquema,
// zona_interes es texto libre que se guarda unido con coma.
export const ZONAS_COMUNES = ["Quillota", "Viña del Mar", "Valparaíso", "Concón", "Limache", "La Calera", "Quilpué", "Villa Alemana"];

// Etapas "activas" del embudo genérico — un lead en Nuevo aún no fue contactado
// (no es enfriamiento), y uno Cerrado ya no requiere seguimiento.
const ESTADOS_ACTIVOS: EstadoWorkflow[] = ["Contactado", "Calificado", "En Visita", "Negociación"];
export const DIAS_ENFRIAMIENTO = 14;

// Vendedor tiene fecha_ultimo_contacto real; comprador/arrendatario no tienen ese campo
// en su tabla (limitación ya documentada en Fase 1), así que usan updated_at como proxy.
export function estaEnfriando(lead: LeadItem): boolean {
  if (!ESTADOS_ACTIVOS.includes(lead.estado_workflow)) return false;
  const referencia = lead.fecha_ultimo_contacto ?? lead.updated_at;
  if (!referencia) return true;
  const dias = (Date.now() - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24);
  return dias > DIAS_ENFRIAMIENTO;
}

// Score relativo (0-1) sobre el campo de calificación que tenga el lead —
// urgencia_venta es 1-5, nivel_calificacion es 1-3, no son comparables en crudo.
export function scoreRatio(lead: LeadItem): number | null {
  if (lead.urgencia_venta != null) return lead.urgencia_venta / 5;
  if (lead.nivel_calificacion != null) return lead.nivel_calificacion / 3;
  return null;
}

// Orden lógico del embudo genérico para poder ordenar la columna "Etapa" —
// no alfabético (así "Contactado" no queda antes que "Nuevo" por accidente).
export const ETAPA_ORDEN: EstadoWorkflow[] = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "En Visita",
  "Negociación",
  "Cerrado Ganado",
  "Cerrado Perdido",
];

// Un lead es siempre una fila real de una de las 3 tablas — `origen`+`id` identifican
// esa fila para cualquier escritura. Todos los campos específicos de rol son opcionales
// porque solo se pueblan según `origen` (mismo patrón "interfaz plana" que CaptacionLead
// en useCaptaciones.ts, en vez de un discriminated union más pesado de manejar en JSX).
export interface LeadItem {
  key: string;
  origen: LeadOrigen;
  id: number;
  rol: LeadRol;
  nombre: string;
  telefono: string;
  email: string | null;
  fuente: string | null;
  asignado_a: string | null;
  estado_workflow: EstadoWorkflow;
  archivado: boolean;
  updated_at: string;
  contacto_id: string | null;
  // vendedor (leads_propietarios)
  fecha_ultimo_contacto: string | null;
  direccion: string | null;
  etapa_captacion: string | null;
  motivacion_venta: string | null;
  motivo_categoria: string | null;
  urgencia_venta: number | null;
  valor_tasacion_uf: number | null;
  valor_publicacion_uf: number | null;
  propiedad_id: string | null;
  // comprador (leads_compradores) — también usado por arrendatarios que llegan
  // vía el mismo formulario ("Arrendar") con tipo_operacion = 'rent'
  presupuesto_uf: string | null;
  presupuesto_uf_num: number | null;
  valor_negociacion_uf: number | null;
  zona_interes: string | null;
  tipo_operacion: string | null;
  necesidades_clave: string | null;
  nivel_calificacion: number | null;
  // arrendatario (candidatos_arriendo)
  ingreso_mensual: number | null;
  complementa_renta: boolean | null;
  estado_calificacion: string | null;
}

const PROPIETARIOS_SELECT = `
  id_lead, nombre_dueno, telefono, motivacion_venta, motivo_categoria, urgencia_venta,
  valor_tasacion_uf, valor_publicacion_uf, etapa_captacion, estado_workflow, archivado, updated_at,
  fecha_ultimo_contacto, contacto_id, propiedad_id,
  contactos ( email, origen, asignado_a ),
  propiedades_inventario ( direccion )
`;

const COMPRADORES_SELECT = `
  id_comprador, nombre, telefono, presupuesto_uf, presupuesto_uf_num, valor_negociacion_uf, zona_interes,
  tipo_operacion, necesidades_clave, nivel_calificacion, estado_workflow, archivado, updated_at,
  contacto_id,
  contactos ( email, origen, asignado_a )
`;

const ARRENDATARIOS_SELECT = `
  id_candidato, nombre_completo, telefono, ingreso_mensual, complementa_renta,
  estado_calificacion, estado_workflow, archivado, updated_at, contacto_id, propiedad_id,
  contactos ( email, origen, asignado_a ),
  propiedades_inventario ( direccion )
`;

function mapPropietario(row: any): LeadItem {
  return {
    key: `leads_propietarios-${row.id_lead}`,
    origen: "leads_propietarios",
    id: row.id_lead,
    rol: "vendedor",
    nombre: row.nombre_dueno,
    telefono: row.telefono,
    email: row.contactos?.email ?? null,
    fuente: row.contactos?.origen ?? null,
    asignado_a: row.contactos?.asignado_a ?? null,
    estado_workflow: row.estado_workflow,
    archivado: row.archivado ?? false,
    updated_at: row.updated_at,
    contacto_id: row.contacto_id,
    fecha_ultimo_contacto: row.fecha_ultimo_contacto,
    direccion: row.propiedades_inventario?.direccion ?? null,
    etapa_captacion: row.etapa_captacion,
    motivacion_venta: row.motivacion_venta,
    motivo_categoria: row.motivo_categoria,
    urgencia_venta: row.urgencia_venta,
    valor_tasacion_uf: row.valor_tasacion_uf,
    valor_publicacion_uf: row.valor_publicacion_uf,
    propiedad_id: row.propiedad_id,
    presupuesto_uf: null,
    presupuesto_uf_num: null,
    valor_negociacion_uf: null,
    zona_interes: null,
    tipo_operacion: null,
    necesidades_clave: null,
    nivel_calificacion: null,
    ingreso_mensual: null,
    complementa_renta: null,
    estado_calificacion: null,
  };
}

function mapComprador(row: any): LeadItem {
  const esArriendo = row.tipo_operacion === "rent";
  return {
    key: `leads_compradores-${row.id_comprador}`,
    origen: "leads_compradores",
    id: row.id_comprador,
    rol: esArriendo ? "arrendatario" : "comprador",
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.contactos?.email ?? null,
    fuente: row.contactos?.origen ?? null,
    asignado_a: row.contactos?.asignado_a ?? null,
    estado_workflow: row.estado_workflow,
    archivado: row.archivado ?? false,
    updated_at: row.updated_at,
    contacto_id: row.contacto_id,
    fecha_ultimo_contacto: null,
    direccion: null,
    etapa_captacion: null,
    motivacion_venta: null,
    motivo_categoria: null,
    urgencia_venta: null,
    valor_tasacion_uf: null,
    valor_publicacion_uf: null,
    propiedad_id: null,
    presupuesto_uf: row.presupuesto_uf,
    presupuesto_uf_num: row.presupuesto_uf_num,
    valor_negociacion_uf: row.valor_negociacion_uf,
    zona_interes: row.zona_interes,
    tipo_operacion: row.tipo_operacion,
    necesidades_clave: row.necesidades_clave,
    nivel_calificacion: row.nivel_calificacion,
    ingreso_mensual: null,
    complementa_renta: null,
    estado_calificacion: null,
  };
}

function mapArrendatario(row: any): LeadItem {
  return {
    key: `candidatos_arriendo-${row.id_candidato}`,
    origen: "candidatos_arriendo",
    id: row.id_candidato,
    rol: "arrendatario",
    nombre: row.nombre_completo,
    telefono: row.telefono,
    email: row.contactos?.email ?? null,
    fuente: row.contactos?.origen ?? null,
    asignado_a: row.contactos?.asignado_a ?? null,
    estado_workflow: row.estado_workflow,
    archivado: row.archivado ?? false,
    updated_at: row.updated_at,
    contacto_id: row.contacto_id,
    fecha_ultimo_contacto: null,
    direccion: row.propiedades_inventario?.direccion ?? null,
    etapa_captacion: null,
    motivacion_venta: null,
    motivo_categoria: null,
    urgencia_venta: null,
    valor_tasacion_uf: null,
    valor_publicacion_uf: null,
    propiedad_id: row.propiedad_id,
    presupuesto_uf: null,
    presupuesto_uf_num: null,
    valor_negociacion_uf: null,
    zona_interes: null,
    tipo_operacion: null,
    necesidades_clave: null,
    nivel_calificacion: null,
    ingreso_mensual: row.ingreso_mensual,
    complementa_renta: row.complementa_renta,
    estado_calificacion: row.estado_calificacion,
  };
}

export function useLeads() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [propietarios, compradores, arrendatarios] = await Promise.all([
      supabase.from("leads_propietarios").select(PROPIETARIOS_SELECT),
      supabase.from("leads_compradores").select(COMPRADORES_SELECT),
      supabase.from("candidatos_arriendo").select(ARRENDATARIOS_SELECT),
    ]);

    const firstError = propietarios.error || compradores.error || arrendatarios.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setError(null);
      const merged: LeadItem[] = [
        ...((propietarios.data ?? []) as any[]).map(mapPropietario),
        ...((compradores.data ?? []) as any[]).map(mapComprador),
        ...((arrendatarios.data ?? []) as any[]).map(mapArrendatario),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setLeads(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function updateEstado(lead: LeadItem, estado_workflow: EstadoWorkflow) {
    const { error } = await supabase.from(lead.origen).update({ estado_workflow }).eq(pkColumn(lead.origen), lead.id);
    if (error) throw error;
    await refresh();
  }

  async function updateComprador(
    lead: LeadItem,
    changes: Partial<{
      presupuesto_uf: string | null;
      valor_negociacion_uf: number | null;
      zona_interes: string | null;
      tipo_operacion: string | null;
      necesidades_clave: string | null;
      nivel_calificacion: number | null;
    }>
  ) {
    const { error } = await supabase.from("leads_compradores").update(changes).eq("id_comprador", lead.id);
    if (error) throw error;
    await refresh();
  }

  // El correo vive en `contactos`, no en la tabla de rol — aplica a los 3 roles por igual.
  async function updateContactoEmail(lead: LeadItem, email: string | null) {
    if (!lead.contacto_id) return;
    const { error } = await supabase.from("contactos").update({ email }).eq("id", lead.contacto_id);
    if (error) throw error;
    await refresh();
  }

  async function updateArrendatario(
    lead: LeadItem,
    changes: Partial<{
      ingreso_mensual: number | null;
      complementa_renta: boolean | null;
      estado_calificacion: string | null;
    }>
  ) {
    const { error } = await supabase.from("candidatos_arriendo").update(changes).eq("id_candidato", lead.id);
    if (error) throw error;
    await refresh();
  }

  async function updateArchivado(lead: LeadItem, archivado: boolean) {
    const { error } = await supabase.from(lead.origen).update({ archivado }).eq(pkColumn(lead.origen), lead.id);
    if (error) throw error;
    await refresh();
  }

  // Borrado real (irreversible) — a diferencia de archivar. Para arrendatario, primero
  // hay que borrar cualquier fila relacionada en documentacion_arrendatario (FK a
  // id_candidato) para no dejar huérfanos si esa tabla no tiene cascade configurado.
  async function deleteLead(lead: LeadItem) {
    if (lead.origen === "candidatos_arriendo") {
      const { error: docError } = await supabase.from("documentacion_arrendatario").delete().eq("id_candidato", lead.id);
      if (docError) throw docError;
    }
    const { error } = await supabase.from(lead.origen).delete().eq(pkColumn(lead.origen), lead.id);
    if (error) throw error;
    await refresh();
  }

  // "Mover a Captaciones": un comprador/arrendatario que también quiere vender su
  // propiedad actual — crea una fila de vendedor reusando el mismo contacto_id, mismo
  // patrón que la rama vendedor de createLead. Un vendedor ya vive en Captaciones
  // automáticamente, así que esto no aplica a leads que ya son rol "vendedor".
  async function promoverAVendedor(lead: LeadItem) {
    if (!lead.contacto_id) throw new Error("Este lead no tiene contacto asociado");
    const { data: propiedad, error: propiedadError } = await supabase
      .from("propiedades_inventario")
      .insert({
        codigo_interno: `AUTO-${crypto.randomUUID().slice(0, 8)}`,
        titulo: `Propiedad de ${lead.nombre}`,
        direccion: "Sin dirección registrada",
        propietario_id: lead.contacto_id,
        tipo_negocio: "Venta",
        estado_propiedad: "En Captación",
      })
      .select("id")
      .single();
    if (propiedadError) throw propiedadError;

    const { error } = await supabase.from("leads_propietarios").insert({
      contacto_id: lead.contacto_id,
      propiedad_id: propiedad.id,
      nombre_dueno: lead.nombre,
      telefono: lead.telefono,
      etapa_captacion: "Prospección",
      fecha_ultimo_contacto: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
    await refresh();
  }

  async function createLead(input: {
    rol: LeadRol;
    nombre: string;
    telefono: string;
    email?: string;
    origen?: string;
    // vendedor
    direccion?: string;
    tipo_propiedad?: string;
    motivo_categoria?: string;
    urgencia_venta?: number;
    etapa_captacion?: string;
    valor_tasacion_uf?: number;
    // comprador
    zona_interes?: string;
    presupuesto_uf_num?: number;
    necesidades_clave?: string;
    nivel_calificacion?: number;
    // arrendatario
    ingreso_mensual?: number;
    complementa_renta?: boolean;
    tipo_persona?: string;
  }) {
    const tipoContacto = input.rol === "vendedor" ? "propietario" : input.rol === "comprador" ? "comprador" : "arrendatario";
    const { data: contacto, error: contactoError } = await supabase
      .from("contactos")
      .upsert(
        {
          nombre: input.nombre,
          telefono: input.telefono,
          email: input.email || null,
          tipo_contacto: [tipoContacto],
          origen: input.origen || null,
        },
        { onConflict: "telefono" }
      )
      .select("id, asignado_a")
      .single();
    if (contactoError) throw contactoError;

    if (input.rol === "vendedor") {
      const { data: propiedad, error: propiedadError } = await supabase
        .from("propiedades_inventario")
        .insert({
          codigo_interno: `AUTO-${crypto.randomUUID().slice(0, 8)}`,
          titulo: `Propiedad de ${input.nombre}`,
          direccion: input.direccion || "Sin dirección registrada",
          tipo_propiedad: input.tipo_propiedad || null,
          propietario_id: contacto.id,
          tipo_negocio: "Venta",
          estado_propiedad: "En Captación",
        })
        .select("id")
        .single();
      if (propiedadError) throw propiedadError;

      const etapaInicial = input.etapa_captacion || "Prospección";
      const { data: leadRow, error } = await supabase
        .from("leads_propietarios")
        .insert({
          contacto_id: contacto.id,
          propiedad_id: propiedad.id,
          nombre_dueno: input.nombre,
          telefono: input.telefono,
          motivo_categoria: input.motivo_categoria || null,
          urgencia_venta: input.urgencia_venta ?? null,
          valor_tasacion_uf: input.valor_tasacion_uf ?? null,
          etapa_captacion: etapaInicial,
          fecha_ultimo_contacto: new Date().toISOString().slice(0, 10),
        })
        .select("id_lead")
        .single();
      if (error) throw error;

      await notifyN8n({
        contacto_id: contacto.id,
        nombre: input.nombre,
        telefono: input.telefono,
        origen: input.origen ?? null,
        asignado_a: contacto.asignado_a ?? null,
        tipo_lead: "vendedor",
        tabla_destino: "leads_propietarios",
        id_registro: leadRow.id_lead,
        estado_workflow: "Nuevo",
        detalle: {
          direccion: input.direccion ?? null,
          tipo_propiedad: input.tipo_propiedad ?? null,
          motivo_categoria: input.motivo_categoria ?? null,
          urgencia_venta: input.urgencia_venta ?? null,
          valor_tasacion_uf: input.valor_tasacion_uf ?? null,
          etapa_captacion: etapaInicial,
          propiedad_id: propiedad.id,
        },
      });
    } else if (input.rol === "comprador") {
      const presupuestoNum = input.presupuesto_uf_num;
      const presupuestoTexto = presupuestoNum ? `UF ${ufFormat.format(presupuestoNum)}` : null;
      const { data: compradorRow, error } = await supabase
        .from("leads_compradores")
        .insert({
          contacto_id: contacto.id,
          nombre: input.nombre,
          telefono: input.telefono,
          tipo_operacion: "buy",
          zona_interes: input.zona_interes || null,
          presupuesto_uf_num: presupuestoNum ?? null,
          presupuesto_uf: presupuestoTexto,
          necesidades_clave: input.necesidades_clave || null,
          nivel_calificacion: input.nivel_calificacion ?? 1,
        })
        .select("id_comprador")
        .single();
      if (error) throw error;

      await notifyN8n({
        contacto_id: contacto.id,
        nombre: input.nombre,
        telefono: input.telefono,
        origen: input.origen ?? null,
        asignado_a: contacto.asignado_a ?? null,
        tipo_lead: "comprador",
        tabla_destino: "leads_compradores",
        id_registro: compradorRow.id_comprador,
        estado_workflow: "Nuevo",
        detalle: {
          zona_interes: input.zona_interes ?? null,
          presupuesto_uf: presupuestoTexto,
          necesidades_clave: input.necesidades_clave ?? null,
          nivel_calificacion: input.nivel_calificacion ?? 1,
          tipo_operacion: "buy",
        },
      });
    } else {
      const { data: candidato, error } = await supabase
        .from("candidatos_arriendo")
        .insert({
          contacto_id: contacto.id,
          nombre_completo: input.nombre,
          telefono: input.telefono,
          ingreso_mensual: input.ingreso_mensual ?? null,
          complementa_renta: input.complementa_renta ?? false,
        })
        .select("id_candidato")
        .single();
      if (error) throw error;

      if (input.tipo_persona) {
        const { error: docError } = await supabase.from("documentacion_arrendatario").insert({
          contacto_id: contacto.id,
          id_candidato: candidato.id_candidato,
          tipo_persona: input.tipo_persona,
        });
        if (docError) throw docError;
      }

      await notifyN8n({
        contacto_id: contacto.id,
        nombre: input.nombre,
        telefono: input.telefono,
        origen: input.origen ?? null,
        asignado_a: contacto.asignado_a ?? null,
        tipo_lead: "arrendatario",
        tabla_destino: "candidatos_arriendo",
        id_registro: candidato.id_candidato,
        estado_workflow: "Nuevo",
        detalle: {
          ingreso_mensual_clp: input.ingreso_mensual ?? null,
          tipo_persona: input.tipo_persona ?? null,
          complementa_renta: input.complementa_renta ?? false,
        },
      });
    }
    await refresh();
  }

  return {
    leads,
    loading,
    error,
    updateEstado,
    updateComprador,
    updateArrendatario,
    updateContactoEmail,
    updateArchivado,
    deleteLead,
    promoverAVendedor,
    createLead,
    sendBulkCampaign,
    refresh,
  };
}

export interface PropiedadResumen {
  id: string;
  codigo_interno: string;
  titulo: string | null;
  direccion: string | null;
  tipo_propiedad: string | null;
  precio_venta_uf: number | null;
  link_carpeta_drive: string | null;
}

// A diferencia de notifyN8n (efecto secundario de crear un lead, nunca debe bloquear
// ni fallar visiblemente), esta SÍ es la acción principal del botón "Enviar Propiedad"
// — si falla, quien la llama debe poder mostrar un error, así que no se atrapan errores acá.
async function sendBulkCampaign(leadsSeleccionados: LeadItem[], propiedad: PropiedadResumen, canal: "whatsapp" | "correo") {
  const payload = {
    canal,
    enviado_por: leadsSeleccionados[0]?.asignado_a ?? null,
    propiedad,
    leads: leadsSeleccionados.map((l) => ({
      contacto_id: l.contacto_id,
      id_registro: l.id,
      tipo_lead: l.rol,
      nombre: l.nombre,
      telefono: l.telefono,
      email: l.email,
      zona_interes: l.zona_interes,
      presupuesto_uf: l.presupuesto_uf,
    })),
  };
  const res = await fetch("/api/webhooks/campana-masiva", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "campaign.bulk_send", timestamp: new Date().toISOString(), campaign: payload }),
  });
  if (!res.ok) throw new Error("No se pudo enviar la campaña");
}

function pkColumn(origen: LeadOrigen): string {
  if (origen === "leads_propietarios") return "id_lead";
  if (origen === "leads_compradores") return "id_comprador";
  return "id_candidato";
}

interface N8nLeadPayload {
  contacto_id: string;
  nombre: string;
  telefono: string;
  origen: string | null;
  asignado_a: string | null;
  tipo_lead: LeadRol;
  tabla_destino: LeadOrigen;
  id_registro: number;
  estado_workflow: string;
  detalle: Record<string, unknown>;
}

// Notifica a n8n que se creó un lead nuevo, vía nuestro propio backend (server.js)
// en vez de llamar un webhook de terceros directo desde el navegador — mismo criterio
// ya aplicado para Nominatim (ver useCaptaciones.ts / memoria del proyecto). Nunca debe
// bloquear ni hacer fallar la creación del lead si el webhook no está configurado o falla.
async function notifyN8n(payload: N8nLeadPayload) {
  try {
    await fetch("/api/webhooks/nuevo-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "lead.created", timestamp: new Date().toISOString(), lead: payload }),
    });
  } catch (err) {
    console.warn("No se pudo notificar a n8n del nuevo lead:", err);
  }
}
