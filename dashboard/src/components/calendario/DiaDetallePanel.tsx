import { useNavigate } from "react-router-dom";
import type { CalendarEvent } from "../../hooks/useCalendario";
import { TIPO_EVENTO_COLOR, TIPO_EVENTO_LABEL } from "../../hooks/useCalendario";

interface Props {
  fecha: string | null;
  eventos: CalendarEvent[];
  onClose: () => void;
}

const dateFormat = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "2-digit", month: "long" });

export function DiaDetallePanel({ fecha, eventos, onClose }: Props) {
  const navigate = useNavigate();
  if (!fecha) return null;

  const titulo = dateFormat.format(new Date(`${fecha}T12:00:00`));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-luxury-blue border-l border-white/10 h-full overflow-y-auto z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-base font-bold text-gold capitalize">{titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {eventos.length === 0 && <p className="text-sm text-on-surface-variant/60">Sin eventos este día.</p>}
          {eventos.map((ev) => (
            <button
              key={ev.id}
              onClick={() => navigate(ev.href)}
              className="w-full text-left bg-surface-container-high rounded-lg p-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${TIPO_EVENTO_COLOR[ev.tipo]}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                  {TIPO_EVENTO_LABEL[ev.tipo]}
                </span>
                {ev.hora && <span className="text-[10px] text-on-surface-variant/70 ml-auto">{ev.hora}</span>}
              </div>
              <p className="text-sm text-on-surface font-medium mt-1">{ev.titulo}</p>
              {ev.subtitulo && <p className="text-xs text-on-surface-variant mt-0.5">{ev.subtitulo}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
