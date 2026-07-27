import { useState } from "react";
import type { LeadItem, PropiedadResumen } from "../../hooks/useLeads";
import type { PropertyItem } from "../../hooks/useProperties";
import { matchesCompradores } from "../../hooks/useProperties";

interface Props {
  open: boolean;
  property: PropertyItem;
  leads: LeadItem[];
  onClose: () => void;
  onSend: (leads: LeadItem[], propiedad: PropiedadResumen, canal: "whatsapp" | "correo") => Promise<void>;
}

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export function MatchInteligentePanel({ open, property, leads, onClose, onSend }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const matches = matchesCompradores(property, leads);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSend(canal: "whatsapp" | "correo") {
    const leadsSeleccionados = matches.filter((l) => selected.has(l.key));
    if (leadsSeleccionados.length === 0) return;
    setSending(true);
    try {
      await onSend(leadsSeleccionados, {
        id: property.id,
        codigo_interno: property.codigo_interno,
        titulo: property.titulo,
        direccion: property.direccion,
        tipo_propiedad: property.tipo_propiedad,
        precio_venta_uf: property.precio_venta_uf,
        link_carpeta_drive: property.link_carpeta_drive,
      }, canal);
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-gold">Match Inteligente</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-on-surface-variant">
            Compradores con presupuesto dentro de ±10% de UF {ufFormat.format(property.precio_venta_uf ?? 0)}
            {property.comuna ? ` y zona de interés en ${property.comuna}` : ""}, ordenados por calificación.
          </p>
          {matches.length === 0 && (
            <p className="text-sm text-on-surface-variant/60 text-center py-6">
              Sin coincidencias hoy (revisa que la propiedad tenga precio de venta y comuna).
            </p>
          )}
          {matches.map((lead) => (
            <label
              key={lead.key}
              className="flex items-center gap-3 bg-surface-container-high rounded px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <input type="checkbox" checked={selected.has(lead.key)} onChange={() => toggle(lead.key)} className="accent-gold w-4 h-4" />
              <div className="flex-1">
                <div className="text-sm text-on-surface font-medium">{lead.nombre}</div>
                <div className="text-xs text-on-surface-variant">
                  {lead.zona_interes ?? "—"} · UF {ufFormat.format(lead.valor_negociacion_uf ?? lead.presupuesto_uf_num ?? 0)}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="p-5 border-t border-white/10 shrink-0 space-y-2">
          {sent && <p className="text-xs text-emerald-400">Campaña enviada.</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleSend("whatsapp")}
              disabled={sending || selected.size === 0}
              className="flex-1 bg-gold text-primary-container font-bold text-xs uppercase tracking-widest py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {sending ? "Enviando..." : `Enviar por WhatsApp (${selected.size})`}
            </button>
            <button
              onClick={() => handleSend("correo")}
              disabled={sending || selected.size === 0}
              className="bg-tertiary/20 text-tertiary font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded hover:bg-tertiary/30 transition-colors disabled:opacity-50"
            >
              Correo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
