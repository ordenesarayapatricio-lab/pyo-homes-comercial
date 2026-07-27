import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { LeadItem } from "./useLeads";

export type EstadoPropiedad = "En Captación" | "Publicada" | "En Negociación" | "Reservada" | "Vendida" | "En Arriendo";

export const ESTADO_PROPIEDAD_OPCIONES: EstadoPropiedad[] = [
  "En Captación",
  "Publicada",
  "En Negociación",
  "Reservada",
  "Vendida",
  "En Arriendo",
];

export const ESTADO_PROPIEDAD_COLOR: Record<EstadoPropiedad, string> = {
  "En Captación": "bg-surface-container-high text-on-surface-variant",
  Publicada: "bg-tertiary/20 text-tertiary",
  "En Negociación": "bg-gold/20 text-gold",
  Reservada: "bg-secondary-container/20 text-secondary-fixed-dim",
  Vendida: "bg-emerald-500/20 text-emerald-400",
  "En Arriendo": "bg-emerald-500/20 text-emerald-400",
};

export interface PropertyItem {
  id: string;
  codigo_interno: string;
  titulo: string | null;
  direccion: string | null;
  comuna: string | null;
  sector: string | null;
  rol_sii: string | null;
  latitud: number | null;
  longitud: number | null;
  tipo_propiedad: string | null;
  tipo_negocio: string | null;
  estado_propiedad: EstadoPropiedad;
  precio_venta_uf: number | null;
  precio_arriendo_clp: number | null;
  area_construida: number | null;
  area_terreno: number | null;
  habitaciones: number | null;
  banos: number | null;
  estacionamientos: number | null;
  bodegas: number | null;
  gastos_comunes: number | null;
  contribuciones: number | null;
  margen_negociacion_uf: number | null;
  fecha_publicacion: string | null;
  link_carpeta_drive: string | null;
  link_carpeta_legal: string | null;
  link_google_maps: string | null;
  link_tour_virtual: string | null;
  link_portal_inmobiliario: string | null;
  caracteristicas_clave: string | null;
  certificado_cip: boolean;
  certificado_gravamenes: boolean;
  dominio_vigente: boolean;
  mandato_exclusividad: boolean;
  cedula_identidad_verificada: boolean;
  propietario_id: string | null;
  propietario_nombre: string | null;
  propietario_telefono: string | null;
  lead_propietario_id: number | null;
  updated_at: string;
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

export interface VisitaPropiedad {
  id: number;
  propiedad_id: string | null;
  propiedad_titulo: string | null;
  id_comprador: number | null;
  comprador_nombre: string | null;
  fecha_visita: string | null;
  feedback_cliente: string | null;
  estado_visita: string | null;
}

export type EstadoOferta = "Pendiente" | "Aceptada" | "Rechazada" | "Contraoferta";

export interface OfertaPropiedad {
  id: number;
  propiedad_id: string;
  propiedad_titulo: string | null;
  comprador_id: number | null;
  comprador_nombre: string | null;
  monto_ofertado_uf: number | null;
  medio_pago: string | null;
  estado_oferta: EstadoOferta;
  fecha_oferta: string;
  notas: string | null;
}

const PROPERTY_SELECT = `
  id, codigo_interno, titulo, direccion, comuna, sector, rol_sii, latitud, longitud, tipo_propiedad, tipo_negocio,
  estado_propiedad, precio_venta_uf, precio_arriendo_clp, area_construida, area_terreno,
  habitaciones, banos, estacionamientos, bodegas, gastos_comunes, contribuciones,
  margen_negociacion_uf, fecha_publicacion, link_carpeta_drive, link_carpeta_legal,
  link_google_maps, link_tour_virtual, link_portal_inmobiliario, caracteristicas_clave,
  certificado_cip, certificado_gravamenes, dominio_vigente, mandato_exclusividad,
  cedula_identidad_verificada, propietario_id, updated_at,
  contactos ( nombre, telefono ),
  leads_propietarios ( id_lead )
`;

function mapProperty(row: any): PropertyItem {
  return {
    id: row.id,
    codigo_interno: row.codigo_interno,
    titulo: row.titulo,
    direccion: row.direccion,
    comuna: row.comuna,
    sector: row.sector,
    rol_sii: row.rol_sii,
    latitud: row.latitud,
    longitud: row.longitud,
    tipo_propiedad: row.tipo_propiedad,
    tipo_negocio: row.tipo_negocio,
    estado_propiedad: row.estado_propiedad,
    precio_venta_uf: row.precio_venta_uf,
    precio_arriendo_clp: row.precio_arriendo_clp,
    area_construida: row.area_construida,
    area_terreno: row.area_terreno,
    habitaciones: row.habitaciones,
    banos: row.banos,
    estacionamientos: row.estacionamientos,
    bodegas: row.bodegas,
    gastos_comunes: row.gastos_comunes,
    contribuciones: row.contribuciones,
    margen_negociacion_uf: row.margen_negociacion_uf,
    fecha_publicacion: row.fecha_publicacion,
    link_carpeta_drive: row.link_carpeta_drive,
    link_carpeta_legal: row.link_carpeta_legal,
    link_google_maps: row.link_google_maps,
    link_tour_virtual: row.link_tour_virtual,
    link_portal_inmobiliario: row.link_portal_inmobiliario,
    caracteristicas_clave: row.caracteristicas_clave,
    certificado_cip: row.certificado_cip ?? false,
    certificado_gravamenes: row.certificado_gravamenes ?? false,
    dominio_vigente: row.dominio_vigente ?? false,
    mandato_exclusividad: row.mandato_exclusividad ?? false,
    cedula_identidad_verificada: row.cedula_identidad_verificada ?? false,
    propietario_id: row.propietario_id,
    propietario_nombre: row.contactos?.nombre ?? null,
    propietario_telefono: row.contactos?.telefono ?? null,
    lead_propietario_id: row.leads_propietarios?.[0]?.id_lead ?? null,
    updated_at: row.updated_at,
  };
}

export function diasEnMercado(property: PropertyItem): number | null {
  if (!property.fecha_publicacion) return null;
  const dias = (Date.now() - new Date(property.fecha_publicacion).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(dias);
}

// Match Inteligente: ±10% del precio de venta y coincidencia de comuna en zona_interes
// (texto libre unido con coma, mismo formato que usa el selector de zonas en Leads).
// Función pura — no toca la base de datos, se calcula sobre los leads ya cargados por useLeads().
export function matchesCompradores(property: PropertyItem, leads: LeadItem[]): LeadItem[] {
  if (!property.precio_venta_uf) return [];
  const min = property.precio_venta_uf * 0.9;
  const max = property.precio_venta_uf * 1.1;
  return leads
    .filter((l) => l.rol === "comprador")
    .filter((l) => {
      const presupuesto = l.valor_negociacion_uf ?? l.presupuesto_uf_num;
      if (presupuesto == null) return false;
      if (presupuesto < min || presupuesto > max) return false;
      if (property.comuna && l.zona_interes && !l.zona_interes.toLowerCase().includes(property.comuna.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const scoreA = a.urgencia_venta != null ? a.urgencia_venta / 5 : a.nivel_calificacion != null ? a.nivel_calificacion / 3 : 0;
      const scoreB = b.urgencia_venta != null ? b.urgencia_venta / 5 : b.nivel_calificacion != null ? b.nivel_calificacion / 3 : 0;
      return scoreB - scoreA;
    });
}

export function useProperties() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("propiedades_inventario")
      .select(PROPERTY_SELECT)
      .order("updated_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setProperties(((data ?? []) as any[]).map(mapProperty));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function updateProperty(
    id: string,
    changes: Partial<
      Pick<
        PropertyItem,
        | "titulo"
        | "direccion"
        | "comuna"
        | "sector"
        | "rol_sii"
        | "latitud"
        | "longitud"
        | "tipo_propiedad"
        | "tipo_negocio"
        | "estado_propiedad"
        | "precio_venta_uf"
        | "precio_arriendo_clp"
        | "area_construida"
        | "area_terreno"
        | "habitaciones"
        | "banos"
        | "estacionamientos"
        | "bodegas"
        | "gastos_comunes"
        | "contribuciones"
        | "margen_negociacion_uf"
        | "fecha_publicacion"
        | "link_carpeta_drive"
        | "link_carpeta_legal"
        | "link_google_maps"
        | "link_tour_virtual"
        | "link_portal_inmobiliario"
        | "caracteristicas_clave"
        | "certificado_cip"
        | "certificado_gravamenes"
        | "dominio_vigente"
        | "mandato_exclusividad"
        | "cedula_identidad_verificada"
      >
    >
  ) {
    // Publicar por primera vez fija la fecha de publicación (para el contador de DOM) —
    // si ya tenía una, no se pisa por cambiar el estado a algo distinto y volver a Publicada.
    const patch: typeof changes = { ...changes };
    if (changes.estado_propiedad === "Publicada") {
      const actual = properties.find((p) => p.id === id);
      if (actual && !actual.fecha_publicacion) {
        patch.fecha_publicacion = new Date().toISOString().slice(0, 10);
      }
    }
    const { error } = await supabase.from("propiedades_inventario").update(patch).eq("id", id);
    if (error) throw error;
    await refresh();
  }

  async function createProperty(input: {
    titulo: string;
    direccion: string;
    tipo_propiedad?: string;
    tipo_negocio?: string;
    propietario_id?: string;
  }) {
    const { error } = await supabase.from("propiedades_inventario").insert({
      codigo_interno: `AUTO-${crypto.randomUUID().slice(0, 8)}`,
      titulo: input.titulo,
      direccion: input.direccion,
      tipo_propiedad: input.tipo_propiedad || null,
      tipo_negocio: input.tipo_negocio || "Venta",
      propietario_id: input.propietario_id || null,
    });
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

  // Mismo guard anti-null-overwrite ya corregido una vez en useCaptaciones.ts: nunca upsertear
  // una fila vacía ni pisar valores reales con null solo porque el panel cargó vacío.
  async function saveEvaluacion(
    propiedadUuid: string,
    values: { valor_tasacion_uf: number | null; valor_publicacion_uf: number | null; valor_ajuste_uf: number | null }
  ) {
    if (values.valor_tasacion_uf == null && values.valor_publicacion_uf == null && values.valor_ajuste_uf == null) {
      return;
    }
    const diferencia_mercado =
      values.valor_publicacion_uf != null && values.valor_tasacion_uf != null
        ? values.valor_publicacion_uf - values.valor_tasacion_uf
        : null;
    const { error } = await supabase
      .from("evaluaciones_comerciales")
      .upsert({ propiedad_uuid: propiedadUuid, ...values, diferencia_mercado }, { onConflict: "propiedad_uuid" });
    if (error) throw error;
  }

  async function getVisitas(propiedadId: string): Promise<VisitaPropiedad[]> {
    const { data, error } = await supabase
      .from("interacciones_visitas")
      .select("id, propiedad_uuid, id_comprador, fecha_visita, feedback_cliente, estado_visita, leads_compradores ( nombre ), propiedades_inventario!propiedad_uuid ( titulo )")
      .eq("propiedad_uuid", propiedadId)
      .order("fecha_visita", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map(mapVisita);
  }

  // Todas las visitas de todas las propiedades (sin filtrar por una sola) — usado por el
  // Calendario para la vista unificada; getVisitas() sigue existiendo para la ficha individual.
  async function getAllVisitas(): Promise<VisitaPropiedad[]> {
    const { data, error } = await supabase
      .from("interacciones_visitas")
      .select("id, propiedad_uuid, id_comprador, fecha_visita, feedback_cliente, estado_visita, leads_compradores ( nombre ), propiedades_inventario!propiedad_uuid ( titulo )")
      .order("fecha_visita", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map(mapVisita);
  }

  function mapVisita(row: any): VisitaPropiedad {
    return {
      id: row.id,
      propiedad_id: row.propiedad_uuid,
      propiedad_titulo: row.propiedades_inventario?.titulo ?? null,
      id_comprador: row.id_comprador,
      comprador_nombre: row.leads_compradores?.nombre ?? null,
      fecha_visita: row.fecha_visita,
      feedback_cliente: row.feedback_cliente,
      estado_visita: row.estado_visita,
    };
  }

  async function getOfertas(propiedadId: string): Promise<OfertaPropiedad[]> {
    const { data, error } = await supabase
      .from("ofertas_propiedad")
      .select("id, propiedad_id, comprador_id, monto_ofertado_uf, medio_pago, estado_oferta, fecha_oferta, notas, leads_compradores ( nombre ), propiedades_inventario ( titulo )")
      .eq("propiedad_id", propiedadId)
      .order("fecha_oferta", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map(mapOferta);
  }

  // Todas las ofertas de todas las propiedades — mismo criterio que getAllVisitas().
  async function getAllOfertas(): Promise<OfertaPropiedad[]> {
    const { data, error } = await supabase
      .from("ofertas_propiedad")
      .select("id, propiedad_id, comprador_id, monto_ofertado_uf, medio_pago, estado_oferta, fecha_oferta, notas, leads_compradores ( nombre ), propiedades_inventario ( titulo )")
      .order("fecha_oferta", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map(mapOferta);
  }

  function mapOferta(row: any): OfertaPropiedad {
    return {
      id: row.id,
      propiedad_id: row.propiedad_id,
      propiedad_titulo: row.propiedades_inventario?.titulo ?? null,
      comprador_id: row.comprador_id,
      comprador_nombre: row.leads_compradores?.nombre ?? null,
      monto_ofertado_uf: row.monto_ofertado_uf,
      medio_pago: row.medio_pago,
      estado_oferta: row.estado_oferta,
      fecha_oferta: row.fecha_oferta,
      notas: row.notas,
    };
  }

  async function addOferta(
    propiedadId: string,
    input: { comprador_id: number | null; monto_ofertado_uf: number | null; medio_pago: string | null; notas: string | null }
  ) {
    const { error } = await supabase.from("ofertas_propiedad").insert({ propiedad_id: propiedadId, ...input });
    if (error) throw error;
  }

  async function updateOfertaEstado(ofertaId: number, estado_oferta: EstadoOferta) {
    const { error } = await supabase.from("ofertas_propiedad").update({ estado_oferta }).eq("id", ofertaId);
    if (error) throw error;
  }

  return {
    properties,
    loading,
    error,
    refresh,
    updateProperty,
    createProperty,
    getEvaluacion,
    saveEvaluacion,
    getVisitas,
    getAllVisitas,
    getOfertas,
    getAllOfertas,
    addOferta,
    updateOfertaEstado,
  };
}
