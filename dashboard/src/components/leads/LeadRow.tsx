import { estadoWorkflowColor } from "../../lib/mockData";
import { ROL_LABELS, estaEnfriando, type LeadItem } from "../../hooks/useLeads";
import { ScoreIndicator } from "./ScoreIndicator";
import { RowActionsMenu } from "./RowActionsMenu";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const clpFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" });

const ROL_COLOR: Record<LeadItem["rol"], string> = {
  vendedor: "bg-gold/15 text-gold",
  comprador: "bg-tertiary/15 text-tertiary",
  arrendatario: "bg-secondary-container/20 text-secondary-fixed-dim",
};

interface Props {
  lead: LeadItem;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  onArchivar: () => void;
  onDesarchivar: () => void;
  onEliminar: () => void;
  onMoverACaptaciones: () => void;
}

function detalleTexto(lead: LeadItem): string {
  if (lead.rol === "vendedor") {
    const valor = lead.valor_publicacion_uf ?? lead.valor_tasacion_uf;
    return [lead.direccion, valor ? `UF ${ufFormat.format(valor)}` : null].filter(Boolean).join(" · ") || "—";
  }
  if (lead.origen === "candidatos_arriendo") {
    return lead.ingreso_mensual ? `Ingreso $${clpFormat.format(lead.ingreso_mensual)}/mes` : "—";
  }
  // comprador o arrendatario vía leads_compradores
  const valor = lead.valor_negociacion_uf
    ? `UF ${ufFormat.format(lead.valor_negociacion_uf)} (negociación)`
    : lead.presupuesto_uf;
  return [lead.zona_interes, valor].filter(Boolean).join(" · ") || "—";
}

export function LeadRow({
  lead,
  onClick,
  selected,
  onToggleSelect,
  onArchivar,
  onDesarchivar,
  onEliminar,
  onMoverACaptaciones,
}: Props) {
  const enfriando = estaEnfriando(lead);
  return (
    <tr
      onClick={onClick}
      className={`border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors ${
        enfriando ? "bg-error/5" : ""
      }`}
    >
      <td className="py-3 pr-2 w-8" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect} className="accent-gold" aria-label={`Seleccionar ${lead.nombre}`} />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-gold shrink-0">
            <span className="material-symbols-outlined text-[14px]">person</span>
          </div>
          <span className="text-on-surface font-medium whitespace-nowrap">{lead.nombre}</span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
      </td>
      <td className="py-3 pr-4">
        <span className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${ROL_COLOR[lead.rol]}`}>
          {ROL_LABELS[lead.rol]}
        </span>
      </td>
      <td className="py-3 pr-4">
        {lead.rol === "vendedor" && lead.urgencia_venta ? (
          <ScoreIndicator value={lead.urgencia_venta} max={5} label={`Urgencia ${lead.urgencia_venta}/5`} />
        ) : lead.nivel_calificacion ? (
          <ScoreIndicator value={lead.nivel_calificacion} max={3} label={`Calificación ${lead.nivel_calificacion}/3`} />
        ) : lead.estado_calificacion ? (
          <span className="text-xs text-on-surface-variant">{lead.estado_calificacion}</span>
        ) : (
          <span className="text-xs text-on-surface-variant/40">—</span>
        )}
      </td>
      <td className="py-3 pr-4 text-on-surface-variant whitespace-nowrap text-xs">{detalleTexto(lead)}</td>
      <td className="py-3 pr-4">
        <span className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${estadoWorkflowColor[lead.estado_workflow]}`}>
          {lead.estado_workflow}
        </span>
      </td>
      <td className="py-3 pr-4 text-on-surface-variant whitespace-nowrap text-xs">
        <span className="inline-flex items-center gap-1">
          {enfriando && (
            <span className="material-symbols-outlined text-[14px] text-error" title="Sin seguimiento hace más de 14 días">
              warning
            </span>
          )}
          {lead.updated_at ? dateFormat.format(new Date(lead.updated_at)) : "—"}
        </span>
      </td>
      <td className="py-3 pl-2 w-10">
        <RowActionsMenu
          lead={lead}
          onArchivar={onArchivar}
          onDesarchivar={onDesarchivar}
          onEliminar={onEliminar}
          onMoverACaptaciones={onMoverACaptaciones}
        />
      </td>
    </tr>
  );
}
