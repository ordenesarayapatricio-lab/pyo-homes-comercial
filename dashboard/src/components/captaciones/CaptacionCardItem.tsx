import { useDraggable } from "@dnd-kit/core";
import type { CaptacionLead } from "../../hooks/useCaptaciones";

interface Props {
  lead: CaptacionLead;
  onClick: () => void;
}

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

const URGENCY_COLORS = ["bg-outline/40", "bg-tertiary/60", "bg-secondary-fixed-dim", "bg-gold", "bg-error"];

export function CaptacionCardItem({ lead, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(lead.id_lead),
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const value = lead.valor_publicacion_uf ?? lead.valor_tasacion_uf;
  const propiedad = lead.propiedades_inventario;
  const direccion = propiedad?.direccion;
  const email = lead.contactos?.email;
  const driveLink = propiedad?.link_carpeta_drive;
  const docsCompletos =
    !!propiedad && propiedad.certificado_cip && propiedad.certificado_gravamenes && propiedad.dominio_vigente;
  const docsCount = propiedad
    ? [propiedad.certificado_cip, propiedad.certificado_gravamenes, propiedad.dominio_vigente].filter(Boolean).length
    : 0;

  const diasEnEtapa = daysSince(lead.etapa_captacion_changed_at);
  const diasEnEtapaVencido = lead.etapa_captacion === "Prospección" && diasEnEtapa !== null && diasEnEtapa > 5;

  const diasSinContacto = daysSince(lead.fecha_ultimo_contacto);
  const enfriando = diasSinContacto === null || diasSinContacto > 7;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-surface-container-high border rounded-lg p-3.5 cursor-pointer hover:border-gold/40 transition-colors space-y-2 ${
        isDragging ? "opacity-40 z-10" : ""
      } ${enfriando ? "border-error/50" : "border-white/5"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-gold shrink-0">
            <span className="material-symbols-outlined text-[15px]">person</span>
          </div>
          <span className="text-sm font-semibold text-on-surface leading-snug truncate">{lead.nombre_dueno}</span>
        </div>
        {diasEnEtapa !== null && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${
              diasEnEtapaVencido ? "text-error" : "text-on-surface-variant/60"
            }`}
            title="Días en esta etapa"
          >
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            {diasEnEtapa}d
          </span>
        )}
      </div>

      {direccion && <p className="text-xs text-on-surface-variant line-clamp-1">{direccion}</p>}

      {propiedad && (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold ${docsCompletos ? "text-tertiary" : "text-on-surface-variant/60"}`}
          title="Documentación: CIP, Gravámenes, Dominio Vigente"
        >
          <span className="material-symbols-outlined text-[12px]">{docsCompletos ? "verified" : "description"}</span>
          Docs {docsCount}/3
        </span>
      )}

      {(lead.motivo_categoria || lead.urgencia_venta) && (
        <div className="flex items-center gap-2 flex-wrap">
          {lead.motivo_categoria && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-tertiary bg-tertiary/10 rounded px-1.5 py-0.5">
              <span className="material-symbols-outlined text-[11px]">sell</span>
              {lead.motivo_categoria}
            </span>
          )}
          {lead.urgencia_venta && (
            <span className="flex items-center gap-0.5" title={`Urgencia ${lead.urgencia_venta}/5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`w-1.5 h-2.5 rounded-sm ${n <= lead.urgencia_venta! ? URGENCY_COLORS[lead.urgencia_venta! - 1] : "bg-white/10"}`}
                />
              ))}
            </span>
          )}
        </div>
      )}

      {enfriando && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-error">
          <span className="material-symbols-outlined text-[12px]">ac_unit</span>
          {diasSinContacto === null ? "Sin contacto registrado" : `Sin contacto hace ${diasSinContacto}d`}
        </span>
      )}

      <div className="flex items-center justify-between pt-1">
        {value ? (
          <span className="font-bold text-on-surface text-xs">UF {ufFormat.format(value)}</span>
        ) : (
          <span className="text-[11px] text-on-surface-variant/50">Sin valor</span>
        )}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://wa.me/${lead.telefono}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-gold hover:bg-white/5 transition-colors"
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
          {email && (
            <a
              href={`mailto:${email}`}
              aria-label="Correo"
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-gold hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">mail</span>
            </a>
          )}
          {driveLink && (
            <a
              href={driveLink}
              target="_blank"
              rel="noreferrer"
              aria-label="Carpeta de Drive"
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-gold hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">folder</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
