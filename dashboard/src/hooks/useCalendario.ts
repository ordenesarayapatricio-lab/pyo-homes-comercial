import { useEffect, useMemo, useState } from "react";
import { useActivitiesBoard, DONE_COLUMN_ID } from "./useActivitiesBoard";
import { useLeads, estaEnfriando } from "./useLeads";
import { useCaptaciones } from "./useCaptaciones";
import { useProperties, diasEnMercado } from "./useProperties";

export type CalendarEventType = "actividad" | "visita" | "oferta" | "alerta_lead" | "alerta_captacion" | "hito_dom";

export interface CalendarEvent {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: CalendarEventType;
  titulo: string;
  subtitulo: string | null;
  hora: string | null;
  href: string;
}

export const TIPO_EVENTO_COLOR: Record<CalendarEventType, string> = {
  actividad: "bg-gold",
  visita: "bg-tertiary",
  oferta: "bg-emerald-400",
  alerta_lead: "bg-error",
  alerta_captacion: "bg-error",
  hito_dom: "bg-secondary-fixed-dim",
};

export const TIPO_EVENTO_LABEL: Record<CalendarEventType, string> = {
  actividad: "Actividad",
  visita: "Visita",
  oferta: "Oferta",
  alerta_lead: "Lead sin seguimiento",
  alerta_captacion: "Captación estancada",
  hito_dom: "Hito de mercado",
};

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const dias = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(dias);
}

export function useCalendario() {
  // Una sola instancia de cada hook, compartida entre el listado de eventos y la
  // mutación de reagendar (arrastrar y soltar) — si Calendario.tsx abriera su propia
  // instancia aparte de useActivitiesBoard()/useLeads(), un cambio hecho a través de
  // esa segunda instancia (ej. updateCard) refrescaría SU PROPIO estado interno, pero
  // esta instancia de acá (la que realmente arma `events`) nunca se enteraría, y los
  // chips se verían desactualizados hasta recargar la página.
  const { cards, updateCard, loading: loadingActividades } = useActivitiesBoard();
  const { leads, loading: loadingLeads } = useLeads();
  const { leads: captaciones, loading: loadingCaptaciones } = useCaptaciones();
  const { properties, getAllVisitas, getAllOfertas, loading: loadingProperties } = useProperties();

  const [visitas, setVisitas] = useState<Awaited<ReturnType<typeof getAllVisitas>>>([]);
  const [ofertas, setOfertas] = useState<Awaited<ReturnType<typeof getAllOfertas>>>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  useEffect(() => {
    setLoadingHistorial(true);
    Promise.all([getAllVisitas(), getAllOfertas()])
      .then(([v, o]) => {
        setVisitas(v);
        setOfertas(o);
      })
      .finally(() => setLoadingHistorial(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events = useMemo<CalendarEvent[]>(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    const out: CalendarEvent[] = [];

    // 1. Actividades agendadas (activity_cards.scheduled_at)
    for (const card of cards) {
      if (!card.scheduled_at) continue;
      const fecha = toDateKey(card.scheduled_at);
      out.push({
        id: `actividad-${card.id}`,
        fecha,
        tipo: "actividad",
        titulo: card.title,
        subtitulo: card.column_id === DONE_COLUMN_ID ? "Terminada" : card.tipo_actividad,
        hora: card.scheduled_at.slice(11, 16),
        href: "/actividades",
      });
    }

    // 2. Visitas a propiedades (interacciones_visitas.fecha_visita)
    for (const v of visitas) {
      if (!v.fecha_visita) continue;
      out.push({
        id: `visita-${v.id}`,
        fecha: v.fecha_visita.slice(0, 10),
        tipo: "visita",
        titulo: v.propiedad_titulo ?? "Visita a propiedad",
        subtitulo: v.comprador_nombre ? `Con ${v.comprador_nombre}` : v.estado_visita,
        hora: null,
        href: "/propiedades",
      });
    }

    // 3. Ofertas recibidas (ofertas_propiedad.fecha_oferta)
    for (const o of ofertas) {
      out.push({
        id: `oferta-${o.id}`,
        fecha: o.fecha_oferta.slice(0, 10),
        tipo: "oferta",
        titulo: o.propiedad_titulo ?? "Oferta recibida",
        subtitulo: o.comprador_nombre ? `De ${o.comprador_nombre}` : o.estado_oferta,
        hora: null,
        href: "/propiedades",
      });
    }

    // 4. Leads sin seguimiento (estaEnfriando ya existente en useLeads.ts) — se ancla a hoy
    for (const lead of leads) {
      if (lead.archivado || !estaEnfriando(lead)) continue;
      out.push({
        id: `alerta-lead-${lead.key}`,
        fecha: hoy,
        tipo: "alerta_lead",
        titulo: `${lead.nombre} sin seguimiento`,
        subtitulo: "Lead enfriándose",
        hora: null,
        href: "/leads",
      });
    }

    // 5. Captaciones estancadas — mismo criterio ya usado en CaptacionCardItem.tsx
    // (Prospección hace más de 5 días sin avanzar de etapa), anclado a hoy.
    for (const captacion of captaciones) {
      const diasEnEtapa = daysSince(captacion.etapa_captacion_changed_at);
      const estancada = captacion.etapa_captacion === "Prospección" && diasEnEtapa !== null && diasEnEtapa > 5;
      if (!estancada) continue;
      out.push({
        id: `alerta-captacion-${captacion.id_lead}`,
        fecha: hoy,
        tipo: "alerta_captacion",
        titulo: `${captacion.nombre_dueno}: captación estancada`,
        subtitulo: `${diasEnEtapa}d en Prospección`,
        hora: null,
        href: "/captaciones",
      });
    }

    // 6. Hitos DOM (60/90 días en el mercado) — se ancla al día exacto en que se cruza el umbral
    for (const property of properties) {
      if (!property.fecha_publicacion) continue;
      const dias = diasEnMercado(property);
      if (dias == null) continue;
      for (const umbral of [60, 90] as const) {
        const fechaHito = new Date(property.fecha_publicacion);
        fechaHito.setDate(fechaHito.getDate() + umbral);
        out.push({
          id: `hito-dom-${property.id}-${umbral}`,
          fecha: fechaHito.toISOString().slice(0, 10),
          tipo: "hito_dom",
          titulo: property.titulo ?? "Propiedad",
          subtitulo: `${umbral} días en el mercado — revisar precio`,
          hora: null,
          href: "/propiedades",
        });
      }
    }

    return out;
  }, [cards, visitas, ofertas, leads, captaciones, properties]);

  const loading = loadingActividades || loadingLeads || loadingCaptaciones || loadingProperties || loadingHistorial;

  return { events, loading, cards, updateCard, leads };
}
