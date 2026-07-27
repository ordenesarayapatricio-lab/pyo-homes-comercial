// Tipos que reflejan la forma real de la vista `vista_progreso_leads` de
// Supabase, y un par de datos de ejemplo (rendimiento histórico y feed de
// novedades) que todavía no tienen una fuente real conectada.

export type EstadoWorkflow =
  | "Nuevo"
  | "Contactado"
  | "Calificado"
  | "En Visita"
  | "Negociación"
  | "Cerrado Ganado"
  | "Cerrado Perdido";

export interface Contacto {
  contacto_id: string;
  nombre: string;
  telefono: string;
  tipo_contacto: string[];
  rol_oportunidad: string;
  estado_workflow: EstadoWorkflow;
  ultimo_canal: string | null;
  ultima_fecha_contacto: string | null;
  proximo_seguimiento: string | null;
  codigo_propiedad: string | null;
  direccion: string | null;
  precio_venta_uf: number | null;
  estado_propiedad: string | null;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  avatar_url?: string;
}

export const performanceData = [
  { month: "Ene", revenue: 20, leads: 28 },
  { month: "Feb", revenue: 24, leads: 30 },
  { month: "Mar", revenue: 30, leads: 34 },
  { month: "Abr", revenue: 38, leads: 40 },
  { month: "May", revenue: 55, leads: 46 },
  { month: "Jun", revenue: 70, leads: 52 },
  { month: "Jul", revenue: 78, leads: 58 },
  { month: "Ago", revenue: 85, leads: 62 },
  { month: "Sep", revenue: 72, leads: 60 },
  { month: "Oct", revenue: 80, leads: 64 },
  { month: "Nov", revenue: 90, leads: 70 },
  { month: "Dic", revenue: 88, leads: 74 },
];

export const activityFeed: ActivityItem[] = [
  { id: "1", title: "Seguimiento con Ricardo Rojas", subtitle: "Casa Pudeto — coordinar visita", time: "12:30 pm" },
  { id: "2", title: "Nuevo contacto agregado", subtitle: "Marcela Arroyo", time: "hace 2h" },
  { id: "3", title: "Seguimiento con Carola Sepulveda", subtitle: "Casa El Sendero — tasación pendiente", time: "10:00 am" },
  { id: "4", title: "Nuevo contacto agregado", subtitle: "Carolina Oyanedel", time: "hace 1d" },
];

// Rampa semántica: de gris (sin avance) a verde (cerca del cierre), para que un
// vistazo rápido a la columna "Etapa" ya comunique qué tan avanzado está el lead —
// antes "Contactado" y "En Visita" compartían el mismo color (bg-tertiary), y
// "Calificado" no se distinguía lo suficiente de "Contactado".
export const estadoWorkflowColor: Record<EstadoWorkflow, string> = {
  Nuevo: "bg-outline/20 text-on-surface-variant",
  Contactado: "bg-tertiary/20 text-tertiary",
  Calificado: "bg-emerald-500/15 text-emerald-300",
  "En Visita": "bg-gold/15 text-gold",
  Negociación: "bg-gold/25 text-gold",
  "Cerrado Ganado": "bg-emerald-500/25 text-emerald-400",
  "Cerrado Perdido": "bg-error/15 text-error",
};
