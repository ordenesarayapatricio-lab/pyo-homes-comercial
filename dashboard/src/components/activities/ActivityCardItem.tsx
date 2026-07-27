import { useDraggable } from "@dnd-kit/core";
import type { ActivityCard } from "../../hooks/useActivitiesBoard";
import { DONE_COLUMN_ID, TIPO_ACTIVIDAD_ICONO } from "../../hooks/useActivitiesBoard";
import { ROL_LABELS, scoreRatio, type LeadItem } from "../../hooks/useLeads";

interface Props {
  card: ActivityCard;
  lead?: LeadItem;
  onClick: () => void;
}

const dateTimeFormat = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

const ROL_COLOR: Record<LeadItem["rol"], string> = {
  vendedor: "bg-gold/15 text-gold",
  comprador: "bg-tertiary/15 text-tertiary",
  arrendatario: "bg-secondary-container/20 text-secondary-fixed-dim",
};

function leadBadgeTexto(lead: LeadItem): string {
  const valor = lead.valor_negociacion_uf ?? lead.valor_publicacion_uf ?? lead.valor_tasacion_uf;
  if (valor) return `${ROL_LABELS[lead.rol]} · UF ${ufFormat.format(valor)}`;
  return ROL_LABELS[lead.rol];
}

export function ActivityCardItem({ card, lead, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const esAltaPrioridad = lead ? (scoreRatio(lead) ?? 0) >= 0.8 : false;
  const icono = card.tipo_actividad ? TIPO_ACTIVIDAD_ICONO[card.tipo_actividad] : undefined;
  const estaTerminada = card.column_id === DONE_COLUMN_ID;
  const estaVencida =
    !estaTerminada && !!card.scheduled_at && new Date(card.scheduled_at).getTime() < Date.now();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-surface-container-high border rounded-lg p-3.5 cursor-pointer hover:border-gold/40 transition-colors space-y-2 ${
        estaVencida ? "border-error animate-pulse" : "border-white/5"
      } ${estaTerminada ? "opacity-50" : ""} ${isDragging ? "opacity-40 z-10" : ""}`}
    >
      <div className="flex items-start gap-2">
        {esAltaPrioridad && (
          <span
            className="w-2 h-2 rounded-full bg-error mt-1.5 shrink-0"
            title="Alta prioridad — lead de máxima calificación"
          />
        )}
        <p className={`text-sm font-semibold leading-snug flex-1 ${estaTerminada ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
          {icono && <span className="material-symbols-outlined text-[15px] text-gold align-middle mr-1">{icono}</span>}
          {card.title}
        </p>
      </div>
      {card.content && (
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{card.content}</p>
      )}

      {lead && (
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold rounded px-2 py-1 ${ROL_COLOR[lead.rol]}`}>
            <span className="material-symbols-outlined text-[13px]">person</span>
            {leadBadgeTexto(lead)}
          </span>
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <a
              href={`https://wa.me/${lead.telefono}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-[#25D366] hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">chat</span>
            </a>
            <a
              href={`tel:${lead.telefono}`}
              aria-label="Llamar"
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-gold hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">call</span>
            </a>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                aria-label="Correo"
                className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-gold hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">mail</span>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1 text-on-surface-variant/80">
        {card.scheduled_at && (
          <span className={`flex items-center gap-1 text-[11px] ${estaVencida ? "text-error font-bold" : ""}`}>
            <span className={`material-symbols-outlined text-[14px] ${estaVencida ? "text-error" : "text-gold"}`}>
              schedule
            </span>
            {dateTimeFormat.format(new Date(card.scheduled_at))}
          </span>
        )}
        {card.recordatorio_whatsapp && (
          <span className="flex items-center gap-1 text-[11px]" title="Recordatorio automático por WhatsApp activado">
            <span className="material-symbols-outlined text-[14px] text-[#25D366]">notifications_active</span>
          </span>
        )}
        {card.activity_card_attachments.length > 0 && (
          <span className="flex items-center gap-1 text-[11px]">
            <span className="material-symbols-outlined text-[14px]">attach_file</span>
            {card.activity_card_attachments.length}
          </span>
        )}
      </div>
    </div>
  );
}
