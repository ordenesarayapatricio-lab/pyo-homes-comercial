import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type EtapaCaptacion =
  | "Prospección"
  | "Evaluación"
  | "Captación Activa"
  | "En Negociación"
  | "Cierre Legal"
  | "Entregada"
  | "En Pausa"
  | "Perdida";

export type MotivoCategoria =
  | "Mudanza"
  | "Herencia"
  | "Falta de liquidez"
  | "Enfermedad"
  | "Divorcio"
  | "Le va bien en la vida"
  | "Inversión"
  | "Otro";

export const MOTIVO_CATEGORIAS: MotivoCategoria[] = [
  "Mudanza",
  "Herencia",
  "Falta de liquidez",
  "Enfermedad",
  "Divorcio",
  "Le va bien en la vida",
  "Inversión",
  "Otro",
];

// Mismo listado que el selector "Tipo de Propiedad" del formulario de la landing (public/index.html).
export const TIPO_PROPIEDAD_OPTIONS = [
  "Departamento",
  "Casa Habitacional",
  "Oficina",
  "Local Comercial",
  "Parcela",
  "Terreno",
  "Sitio",
  "Bodega",
  "Industriales",
  "Agrícolas",
  "Estacionamientos",
  "Loteos",
  "Otros Inmuebles",
] as const;

export type TipoPropiedad = (typeof TIPO_PROPIEDAD_OPTIONS)[number];

export interface CaptacionLead {
  id_lead: number;
  nombre_dueno: string;
  telefono: string;
  motivacion_venta: string | null;
  motivo_categoria: MotivoCategoria | null;
  urgencia_venta: number | null;
  valor_tasacion_uf: number | null;
  valor_publicacion_uf: number | null;
  etapa_captacion: EtapaCaptacion;
  etapa_captacion_changed_at: string;
  fecha_ultimo_contacto: string | null;
  updated_at: string;
  created_at: string | null;
  propiedad_id: string | null;
  contactos: { email: string | null } | null;
  propiedades_inventario: {
    id: string;
    direccion: string | null;
    tipo_propiedad: string | null;
    link_carpeta_drive: string | null;
    certificado_cip: boolean;
    certificado_gravamenes: boolean;
    dominio_vigente: boolean;
  } | null;
}

export interface EvaluacionComercial {
  id: number;
  propiedad_uuid: string;
  valor_tasacion_uf: number | null;
  valor_publicacion_uf: number | null;
  valor_ajuste_uf: number | null;
  diferencia_mercado: number | null;
  fecha_evaluacion: string;
}

export const ETAPA_COLUMNS: { id: EtapaCaptacion; title: string }[] = [
  { id: "Prospección", title: "Prospección" },
  { id: "Evaluación", title: "Evaluación" },
  { id: "Captación Activa", title: "Captación Activa" },
  { id: "En Negociación", title: "En Negociación" },
  { id: "Cierre Legal", title: "Cierre Legal" },
  { id: "Entregada", title: "Entregada" },
];

export const PARKING_ETAPAS: EtapaCaptacion[] = ["En Pausa", "Perdida"];

const LEAD_SELECT = `
  id_lead, nombre_dueno, telefono, motivacion_venta, motivo_categoria, urgencia_venta,
  valor_tasacion_uf, valor_publicacion_uf, etapa_captacion, etapa_captacion_changed_at,
  fecha_ultimo_contacto, updated_at, created_at, propiedad_id, contacto_id,
  contactos ( email ),
  propiedades_inventario ( id, direccion, tipo_propiedad, link_carpeta_drive, certificado_cip, certificado_gravamenes, dominio_vigente )
`;

export function useCaptaciones() {
  const [leads, setLeads] = useState<CaptacionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads_propietarios")
      .select(LEAD_SELECT)
      .order("updated_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setLeads((data ?? []) as unknown as CaptacionLead[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function updateLead(
    id: number,
    changes: Partial<
      Pick<
        CaptacionLead,
        | "motivacion_venta"
        | "motivo_categoria"
        | "urgencia_venta"
        | "valor_tasacion_uf"
        | "valor_publicacion_uf"
        | "etapa_captacion"
        | "fecha_ultimo_contacto"
      >
    >
  ) {
    const { error } = await supabase.from("leads_propietarios").update(changes).eq("id_lead", id);
    if (error) throw error;
    await refresh();
  }

  async function moveLead(id: number, etapa: EtapaCaptacion) {
    await updateLead(id, { etapa_captacion: etapa });
  }

  async function markContactedToday(id: number) {
    await updateLead(id, { fecha_ultimo_contacto: new Date().toISOString().slice(0, 10) });
  }

  async function updateProperty(
    propiedadId: string,
    changes: Partial<{
      direccion: string;
      tipo_propiedad: string;
      link_carpeta_drive: string | null;
      certificado_cip: boolean;
      certificado_gravamenes: boolean;
      dominio_vigente: boolean;
    }>
  ) {
    const { error } = await supabase.from("propiedades_inventario").update(changes).eq("id", propiedadId);
    if (error) throw error;
    await refresh();
  }

  async function getEvaluacion(propiedadUuid: string): Promise<EvaluacionComercial | null> {
    const { data, error } = await supabase
      .from("evaluaciones_comerciales")
      .select("id, propiedad_uuid, valor_tasacion_uf, valor_publicacion_uf, valor_ajuste_uf, diferencia_mercado, fecha_evaluacion")
      .eq("propiedad_uuid", propiedadUuid)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function saveEvaluacion(
    leadId: number,
    propiedadUuid: string,
    values: { valor_tasacion_uf: number | null; valor_publicacion_uf: number | null; valor_ajuste_uf: number | null }
  ) {
    // Nothing entered in the panel — skip entirely rather than upserting an empty row
    // or, worse, wiping out a previously saved valor_tasacion_uf/valor_publicacion_uf.
    if (values.valor_tasacion_uf == null && values.valor_publicacion_uf == null && values.valor_ajuste_uf == null) {
      return;
    }

    const diferencia_mercado =
      values.valor_publicacion_uf != null && values.valor_tasacion_uf != null
        ? values.valor_publicacion_uf - values.valor_tasacion_uf
        : null;
    const { error: evalError } = await supabase
      .from("evaluaciones_comerciales")
      .upsert({ propiedad_uuid: propiedadUuid, ...values, diferencia_mercado }, { onConflict: "propiedad_uuid" });
    if (evalError) throw evalError;

    // Only sync fields that actually have a value — never null out an existing
    // valor_tasacion_uf/valor_publicacion_uf just because the panel loaded empty.
    const leadUpdate: Partial<Pick<CaptacionLead, "valor_tasacion_uf" | "valor_publicacion_uf">> = {};
    if (values.valor_tasacion_uf != null) leadUpdate.valor_tasacion_uf = values.valor_tasacion_uf;
    if (values.valor_publicacion_uf != null) leadUpdate.valor_publicacion_uf = values.valor_publicacion_uf;
    if (Object.keys(leadUpdate).length > 0) {
      const { error: leadError } = await supabase.from("leads_propietarios").update(leadUpdate).eq("id_lead", leadId);
      if (leadError) throw leadError;
    }
    await refresh();
  }

  async function createLead(input: {
    nombre_dueno: string;
    telefono: string;
    direccion: string;
    motivacion_venta: string | null;
    motivo_categoria: MotivoCategoria | null;
    etapa_captacion: EtapaCaptacion;
  }) {
    const { data: contacto, error: contactoError } = await supabase
      .from("contactos")
      .upsert(
        { nombre: input.nombre_dueno, telefono: input.telefono, tipo_contacto: ["propietario"] },
        { onConflict: "telefono" }
      )
      .select("id")
      .single();
    if (contactoError) throw contactoError;

    const { data: propiedad, error: propiedadError } = await supabase
      .from("propiedades_inventario")
      .insert({
        codigo_interno: `AUTO-${crypto.randomUUID().slice(0, 8)}`,
        titulo: `Propiedad de ${input.nombre_dueno}`,
        direccion: input.direccion || "Sin dirección registrada",
        propietario_id: contacto.id,
        tipo_negocio: "Venta",
        estado_propiedad: "En Captación",
      })
      .select("id")
      .single();
    if (propiedadError) throw propiedadError;

    const { error } = await supabase.from("leads_propietarios").insert({
      contacto_id: contacto.id,
      propiedad_id: propiedad.id,
      nombre_dueno: input.nombre_dueno,
      telefono: input.telefono,
      motivacion_venta: input.motivacion_venta,
      motivo_categoria: input.motivo_categoria,
      etapa_captacion: input.etapa_captacion,
    });
    if (error) throw error;
    await refresh();
  }

  return {
    leads,
    loading,
    error,
    updateLead,
    moveLead,
    markContactedToday,
    updateProperty,
    getEvaluacion,
    saveEvaluacion,
    createLead,
    refresh,
  };
}
