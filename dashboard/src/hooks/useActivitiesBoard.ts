import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { LeadOrigen } from "./useLeads";

export interface ActivityColumn {
  id: string;
  title: string;
  order: number;
}

export interface ActivityAttachment {
  id: string;
  file_name: string;
  file_path: string;
  size: number;
}

export interface ActivityCard {
  id: string;
  title: string;
  content: string | null;
  column_id: string;
  contacto_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  tipo_actividad: string | null;
  lead_origen: LeadOrigen | null;
  lead_ref_id: number | null;
  recordatorio_whatsapp: boolean;
  activity_card_attachments: ActivityAttachment[];
}

const ATTACHMENTS_BUCKET = "activity-attachments";

// Id fijo de la columna "Terminadas" en `activity_columns` — compartido entre
// Activities.tsx y ActivityCardItem.tsx (opacidad/tachado, KPI, filtro del selector "Mover a").
export const DONE_COLUMN_ID = "done";

// Un solo campo unifica el ícono de la tarjeta y las píldoras de filtro por módulo
// (confirmado con el usuario: no se pide el tipo de actividad dos veces).
export const TIPO_ACTIVIDAD_OPCIONES = [
  "Cita captación",
  "Propietarios",
  "Compradores",
  "Arriendos",
  "Legales/Notaría",
  "Llamadas en frío",
  "Sacar fotografías",
  "Salida Terreno/Búsqueda pistas",
  "Marketing y Publicidad",
  "Visita venta y Negociación",
  "Presentación cierre",
  "Administrativo",
  "Reunión",
  "Creación de contenido y edición",
  "Actividades posteriores al cierre",
] as const;

export const TIPO_ACTIVIDAD_ICONO: Record<string, string> = {
  "Cita captación": "home_work",
  Propietarios: "real_estate_agent",
  Compradores: "shopping_cart",
  Arriendos: "key",
  "Legales/Notaría": "gavel",
  "Llamadas en frío": "phone_in_talk",
  "Sacar fotografías": "photo_camera",
  "Salida Terreno/Búsqueda pistas": "travel_explore",
  "Marketing y Publicidad": "campaign",
  "Visita venta y Negociación": "handshake",
  "Presentación cierre": "task_alt",
  Administrativo: "description",
  Reunión: "groups",
  "Creación de contenido y edición": "edit_note",
  "Actividades posteriores al cierre": "verified",
};

const TIPO_ACTIVIDAD_A_INTERACCION: Record<string, string> = {
  "Cita captación": "Visita",
  Propietarios: "Llamada",
  Compradores: "Llamada",
  Arriendos: "Llamada",
  "Legales/Notaría": "Visita",
  "Llamadas en frío": "Llamada",
  "Sacar fotografías": "Visita",
  "Salida Terreno/Búsqueda pistas": "Visita",
  "Marketing y Publicidad": "Correo",
  "Visita venta y Negociación": "Visita",
  "Presentación cierre": "Visita",
  Administrativo: "Correo",
  Reunión: "Visita",
  "Creación de contenido y edición": "Correo",
  "Actividades posteriores al cierre": "Llamada",
};

export function tipoActividadAInteraccion(tipo: string | null): string {
  if (tipo && TIPO_ACTIVIDAD_A_INTERACCION[tipo]) return TIPO_ACTIVIDAD_A_INTERACCION[tipo];
  return "Llamada";
}

export function useActivitiesBoard() {
  const [columns, setColumns] = useState<ActivityColumn[]>([]);
  const [cards, setCards] = useState<ActivityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [columnsRes, cardsRes] = await Promise.all([
      supabase.from("activity_columns").select("*").order("order", { ascending: true }),
      supabase
        .from("activity_cards")
        .select("*, activity_card_attachments(*)")
        .order("created_at", { ascending: true }),
    ]);

    if (columnsRes.error) setError(columnsRes.error.message);
    else if (cardsRes.error) setError(cardsRes.error.message);
    else setError(null);

    setColumns((columnsRes.data ?? []) as ActivityColumn[]);
    setCards((cardsRes.data ?? []) as ActivityCard[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addCard(input: {
    title: string;
    content: string | null;
    column_id: string;
    contacto_id: string | null;
    scheduled_at: string | null;
    tipo_actividad: string | null;
    lead_origen: LeadOrigen | null;
    lead_ref_id: number | null;
    recordatorio_whatsapp: boolean;
  }) {
    const { data, error } = await supabase.from("activity_cards").insert(input).select("*, activity_card_attachments(*)").single();
    if (error) throw error;
    await refresh();
    return data as ActivityCard;
  }

  async function updateCard(
    id: string,
    changes: Partial<
      Pick<
        ActivityCard,
        | "title"
        | "content"
        | "column_id"
        | "contacto_id"
        | "scheduled_at"
        | "tipo_actividad"
        | "lead_origen"
        | "lead_ref_id"
        | "recordatorio_whatsapp"
      >
    >
  ) {
    const { error } = await supabase.from("activity_cards").update(changes).eq("id", id);
    if (error) throw error;
    await refresh();
  }

  async function moveCard(id: string, columnId: string) {
    await updateCard(id, { column_id: columnId });
  }

  async function closeCardWithBitacora(card: ActivityCard, detalle: string) {
    if (card.contacto_id) {
      const { error: insertError } = await supabase.from("interacciones_seguimiento").insert({
        contacto_id: card.contacto_id,
        tipo_interaccion: tipoActividadAInteraccion(card.tipo_actividad),
        detalle_conversacion: detalle,
        fecha_contacto: new Date().toISOString(),
      });
      if (insertError) throw insertError;
    }
    await moveCard(card.id, "done");
  }

  async function deleteCard(id: string) {
    const card = cards.find((c) => c.id === id);
    if (card) {
      for (const attachment of card.activity_card_attachments) {
        await supabase.storage.from(ATTACHMENTS_BUCKET).remove([attachment.file_path]);
      }
    }
    const { error } = await supabase.from("activity_cards").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }

  async function uploadAttachment(cardId: string, file: File) {
    const path = `${cardId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file);
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("activity_card_attachments").insert({
      card_id: cardId,
      file_name: file.name,
      file_path: path,
      size: file.size,
    });
    if (insertError) throw insertError;
    await refresh();
  }

  async function deleteAttachment(attachmentId: string, filePath: string) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([filePath]);
    const { error } = await supabase.from("activity_card_attachments").delete().eq("id", attachmentId);
    if (error) throw error;
    await refresh();
  }

  return {
    columns,
    cards,
    loading,
    error,
    addCard,
    updateCard,
    moveCard,
    closeCardWithBitacora,
    deleteCard,
    uploadAttachment,
    deleteAttachment,
  };
}
