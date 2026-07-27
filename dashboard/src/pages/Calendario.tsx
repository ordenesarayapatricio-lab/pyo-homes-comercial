import { useMemo, useState } from "react";
import { useCalendario, TIPO_EVENTO_COLOR, TIPO_EVENTO_LABEL, type CalendarEventType } from "../hooks/useCalendario";
import { DiaDetallePanel } from "../components/calendario/DiaDetallePanel";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

export function Calendario() {
  const { events, loading } = useCalendario();
  const [cursor, setCursor] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const ev of events) {
      const lista = map.get(ev.fecha) ?? [];
      lista.push(ev);
      map.set(ev.fecha, lista);
    }
    return map;
  }, [events]);

  const celdas = useMemo(() => buildGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const hoyKey = toDateKey(new Date());

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-white">Calendario</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Vista unificada de actividades, visitas, ofertas y alertas de seguimiento.
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
              if (!fecha) return <div key={i} className="border-b border-r border-white/5 min-h-[90px]" />;
              const key = toDateKey(fecha);
              const eventosDia = eventosPorDia.get(key) ?? [];
              const esHoy = key === hoyKey;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(key)}
                  className="border-b border-r border-white/5 min-h-[90px] p-2 text-left hover:bg-white/[0.03] transition-colors flex flex-col"
                >
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                      esHoy ? "bg-gold text-primary-container font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {fecha.getDate()}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {eventosDia.slice(0, 4).map((ev) => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${TIPO_EVENTO_COLOR[ev.tipo]}`} title={ev.titulo} />
                    ))}
                    {eventosDia.length > 4 && (
                      <span className="text-[9px] text-on-surface-variant/70">+{eventosDia.length - 4}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <DiaDetallePanel
        fecha={selectedDate}
        eventos={selectedDate ? eventosPorDia.get(selectedDate) ?? [] : []}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
