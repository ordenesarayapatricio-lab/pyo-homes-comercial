import { useMemo, useState } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useCalendario, TIPO_EVENTO_COLOR, TIPO_EVENTO_LABEL, type CalendarEvent, type CalendarEventType } from "../hooks/useCalendario";
import { useActivitiesBoard, type ActivityCard } from "../hooks/useActivitiesBoard";
import { useLeads } from "../hooks/useLeads";
import { DiaDetallePanel } from "../components/calendario/DiaDetallePanel";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Las tarjetas de tipo "actividad" llevan este prefijo en su id de CalendarEvent
// (ver useCalendario.ts) — se necesita el id real de activity_cards para arrastrarlas.
const PREFIJO_ACTIVIDAD = "actividad-";

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const primerDia = new Date(year, month, 1);
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const offsetLunes = (primerDia.getDay() + 6) % 7; // 0 = Lunes
  const celdas: (Date | null)[] = [];
  for (let i = 0; i < offsetLunes; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(year, month, d));
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

interface EventoChipProps {
  evento: CalendarEvent;
}

function EventoChip({ evento }: EventoChipProps) {
  const esArrastrable = evento.tipo === "actividad";
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: evento.id,
    disabled: !esArrastrable,
  });

  return (
    <span
      ref={setNodeRef}
      title={evento.titulo}
      {...(esArrastrable ? { ...listeners, ...attributes } : {})}
      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate text-on-surface ${TIPO_EVENTO_COLOR[evento.tipo]}/20 ${
        esArrastrable ? "cursor-grab" : ""
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {evento.hora ? `${evento.hora} ` : ""}
      {evento.titulo}
    </span>
  );
}

interface DiaCeldaProps {
  fecha: Date;
  esHoy: boolean;
  eventos: CalendarEvent[];
  onAbrir: () => void;
}

function DiaCelda({ fecha, esHoy, eventos, onAbrir }: DiaCeldaProps) {
  const key = toDateKey(fecha);
  const { setNodeRef, isOver } = useDroppable({ id: key });

  return (
    <button
      ref={setNodeRef}
      onClick={onAbrir}
      className={`border-b border-r border-white/5 min-h-[110px] p-2 text-left transition-colors flex flex-col ${
        isOver ? "bg-gold/10" : "hover:bg-white/[0.03]"
      }`}
    >
      <span
        className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
          esHoy ? "bg-gold text-primary-container font-bold" : "text-on-surface-variant"
        }`}
      >
        {fecha.getDate()}
      </span>
      <div className="flex flex-col gap-0.5 mt-1.5 min-w-0">
        {eventos.slice(0, 2).map((ev) => (
          <EventoChip key={ev.id} evento={ev} />
        ))}
        {eventos.length > 2 && <span className="text-[9px] text-on-surface-variant/70 px-1">+{eventos.length - 2} más</span>}
      </div>
    </button>
  );
}

export function Calendario() {
  const { events, loading } = useCalendario();
  const { cards, updateCard } = useActivitiesBoard();
  const { leads } = useLeads();
  const [cursor, setCursor] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Solo se necesita para reagendar (arrastrar y soltar) — evita que un simple click
  // en un chip se trague como un arrastre de distancia cero, mismo criterio ya usado
  // en Activities.tsx/Captaciones.tsx.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const leadByKey = useMemo(() => Object.fromEntries(leads.map((lead) => [lead.key, lead])), [leads]);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const lista = map.get(ev.fecha) ?? [];
      lista.push(ev);
      map.set(ev.fecha, lista);
    }
    return map;
  }, [events]);

  const celdas = useMemo(() => buildGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const hoyKey = toDateKey(new Date());

  async function notifyReagendamiento(card: ActivityCard, fechaAnterior: string, fechaNueva: string) {
    const lead = card.lead_origen && card.lead_ref_id != null ? leadByKey[`${card.lead_origen}-${card.lead_ref_id}`] : undefined;
    if (!lead) return; // sin lead vinculado, no hay a quién avisar — no es un error
    try {
      await fetch("/api/webhooks/reagendamiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "activity.rescheduled",
          timestamp: new Date().toISOString(),
          reagendamiento: {
            contacto_id: lead.contacto_id,
            nombre: lead.nombre,
            telefono: lead.telefono,
            actividad_titulo: card.title,
            fecha_anterior: fechaAnterior,
            fecha_nueva: fechaNueva,
          },
        }),
      });
    } catch (err) {
      console.warn("No se pudo notificar el reagendamiento a n8n:", err);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (!String(active.id).startsWith(PREFIJO_ACTIVIDAD)) return;

    const cardId = String(active.id).slice(PREFIJO_ACTIVIDAD.length);
    const card = cards.find((c) => c.id === cardId);
    if (!card || !card.scheduled_at) return;

    const targetKey = String(over.id);
    const fechaAnterior = card.scheduled_at;
    if (toDateKey(new Date(fechaAnterior)) === targetKey) return; // mismo día, nada que hacer

    const [y, m, d] = targetKey.split("-").map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(y, m - 1, d) < hoy) return; // no reagendar hacia el pasado

    const nuevaFecha = new Date(fechaAnterior);
    nuevaFecha.setFullYear(y, m - 1, d); // conserva la hora original, solo cambia el día
    const fechaNueva = nuevaFecha.toISOString();

    updateCard(cardId, { scheduled_at: fechaNueva }).then(() => notifyReagendamiento(card, fechaAnterior, fechaNueva));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-white">Calendario</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Vista unificada de actividades, visitas, ofertas y alertas de seguimiento — arrastra una actividad a otro día para reagendarla.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Mes anterior"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-white/5 hover:text-gold transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-sm font-bold text-on-surface w-36 text-center">
            {MESES[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            aria-label="Mes siguiente"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-white/5 hover:text-gold transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
        {(Object.keys(TIPO_EVENTO_LABEL) as CalendarEventType[]).map((tipo) => (
          <span key={tipo} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${TIPO_EVENTO_COLOR[tipo]}`} />
            {TIPO_EVENTO_LABEL[tipo]}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="text-on-surface-variant text-sm">Cargando calendario...</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="bg-surface border border-white/5 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-white/10">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {celdas.map((fecha, i) => {
                if (!fecha) return <div key={i} className="border-b border-r border-white/5 min-h-[110px]" />;
                const key = toDateKey(fecha);
                return (
                  <DiaCelda
                    key={i}
                    fecha={fecha}
                    esHoy={key === hoyKey}
                    eventos={eventosPorDia.get(key) ?? []}
                    onAbrir={() => setSelectedDate(key)}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
      )}

      <DiaDetallePanel
        fecha={selectedDate}
        eventos={selectedDate ? eventosPorDia.get(selectedDate) ?? [] : []}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
