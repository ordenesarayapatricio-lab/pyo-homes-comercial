import { useState } from "react";
import type { VisitaPropiedad, OfertaPropiedad, EstadoOferta } from "../../hooks/useProperties";
import type { LeadItem } from "../../hooks/useLeads";

interface Props {
  visitas: VisitaPropiedad[];
  ofertas: OfertaPropiedad[];
  compradores: LeadItem[];
  onAddOferta: (input: { comprador_id: number | null; monto_ofertado_uf: number | null; medio_pago: string | null; notas: string | null }) => Promise<void>;
  onUpdateOfertaEstado: (ofertaId: number, estado: EstadoOferta) => Promise<void>;
}

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" });

const ESTADO_OFERTA_COLOR: Record<EstadoOferta, string> = {
  Pendiente: "bg-surface-container-high text-on-surface-variant",
  Aceptada: "bg-emerald-500/20 text-emerald-400",
  Rechazada: "bg-error/20 text-error",
  Contraoferta: "bg-gold/20 text-gold",
};

export function FichaHistorialTab({ visitas, ofertas, compradores, onAddOferta, onUpdateOfertaEstado }: Props) {
  const [compradorId, setCompradorId] = useState("");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddOferta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onAddOferta({
        comprador_id: compradorId ? Number(compradorId) : null,
        monto_ofertado_uf: monto ? Number(monto) : null,
        medio_pago: medioPago || null,
        notas: notas || null,
      });
      setCompradorId("");
      setMonto("");
      setMedioPago("");
      setNotas("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Bitácora de Visitas</h3>
        {visitas.length === 0 ? (
          <p className="text-xs text-on-surface-variant/60">Sin visitas registradas.</p>
        ) : (
          <ul className="space-y-2">
            {visitas.map((v) => (
              <li key={v.id} className="bg-surface-container-high rounded px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-on-surface">{v.comprador_nombre ?? "Sin nombre"}</span>
                  <span className="text-on-surface-variant">{v.fecha_visita ? dateFormat.format(new Date(v.fecha_visita)) : "—"}</span>
                </div>
                {v.feedback_cliente && <p className="text-on-surface-variant mt-1">{v.feedback_cliente}</p>}
                <span className="text-on-surface-variant/70">{v.estado_visita}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Historial de Ofertas</h3>
        {ofertas.length === 0 ? (
          <p className="text-xs text-on-surface-variant/60 mb-3">Sin ofertas registradas.</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {ofertas.map((o) => (
              <li key={o.id} className="bg-surface-container-high rounded px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-on-surface">
                    {o.comprador_nombre ?? "Sin nombre"} · UF {o.monto_ofertado_uf ? ufFormat.format(o.monto_ofertado_uf) : "—"}
                  </span>
                  <select
                    value={o.estado_oferta}
                    onChange={(e) => onUpdateOfertaEstado(o.id, e.target.value as EstadoOferta)}
                    className={`text-[11px] font-bold rounded px-2 py-0.5 border-0 ${ESTADO_OFERTA_COLOR[o.estado_oferta]}`}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aceptada">Aceptada</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Contraoferta">Contraoferta</option>
                  </select>
                </div>
                <div className="text-on-surface-variant mt-1">
                  {o.medio_pago ?? "—"} · {dateFormat.format(new Date(o.fecha_oferta))}
                </div>
                {o.notas && <p className="text-on-surface-variant/80 mt-1">{o.notas}</p>}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddOferta} className="grid grid-cols-2 gap-2 bg-background/40 rounded p-3">
          <select
            value={compradorId}
            onChange={(e) => setCompradorId(e.target.value)}
            className="col-span-2 bg-background border border-white/[0.15] rounded px-2 py-1.5 text-xs text-on-surface"
          >
            <option value="">Comprador (opcional)</option>
            {compradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Monto ofertado (UF)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="bg-background border border-white/[0.15] rounded px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40"
          />
          <input
            placeholder="Medio de pago"
            value={medioPago}
            onChange={(e) => setMedioPago(e.target.value)}
            className="bg-background border border-white/[0.15] rounded px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40"
          />
          <input
            placeholder="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="col-span-2 bg-background border border-white/[0.15] rounded px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40"
          />
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 bg-tertiary/20 text-tertiary text-xs font-bold py-1.5 rounded hover:bg-tertiary/30 transition-colors disabled:opacity-50"
          >
            {saving ? "Agregando..." : "Agregar Oferta"}
          </button>
        </form>
      </div>
    </div>
  );
}
