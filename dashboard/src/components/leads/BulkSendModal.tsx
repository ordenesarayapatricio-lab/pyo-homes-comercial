import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { LeadItem, PropiedadResumen } from "../../hooks/useLeads";

interface Props {
  open: boolean;
  leads: LeadItem[];
  onClose: () => void;
  onSend: (propiedad: PropiedadResumen, canal: "whatsapp" | "correo") => Promise<void>;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5";
const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export function BulkSendModal({ open, leads, onClose, onSend }: Props) {
  const [propiedades, setPropiedades] = useState<PropiedadResumen[]>([]);
  const [loadingPropiedades, setLoadingPropiedades] = useState(false);
  const [propiedadId, setPropiedadId] = useState("");
  const [canal, setCanal] = useState<"whatsapp" | "correo">("whatsapp");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPropiedadId("");
    setCanal("whatsapp");
    setError(null);
    setSent(false);
    setLoadingPropiedades(true);
    supabase
      .from("propiedades_inventario")
      .select("id, codigo_interno, titulo, direccion, tipo_propiedad, precio_venta_uf, link_carpeta_drive")
      .eq("estado_propiedad", "Publicada")
      .order("updated_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!fetchError) setPropiedades((data ?? []) as PropiedadResumen[]);
        setLoadingPropiedades(false);
      });
  }, [open]);

  if (!open) return null;

  const propiedad = propiedades.find((p) => p.id === propiedadId) ?? null;

  async function handleSend() {
    if (!propiedad) return;
    setSending(true);
    setError(null);
    try {
      await onSend(propiedad, canal);
      setSent(true);
    } catch {
      setError("No se pudo enviar la campaña. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gold">Enviar Propiedad</h2>
            <p className="text-xs text-on-surface-variant">{leads.length} leads seleccionados</p>
          </div>
          <button aria-label="Cerrar modal" onClick={onClose} className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {sent ? (
            <div className="bg-tertiary/10 border border-tertiary/30 text-tertiary text-sm rounded-lg p-4">
              Campaña enviada a n8n para {leads.length} lead{leads.length === 1 ? "" : "s"}.
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass} htmlFor="bulk-propiedad">
                  Propiedad a enviar
                </label>
                <select
                  id="bulk-propiedad"
                  value={propiedadId}
                  onChange={(e) => setPropiedadId(e.target.value)}
                  className={inputClass}
                  disabled={loadingPropiedades}
                >
                  <option value="">{loadingPropiedades ? "Cargando..." : "Seleccione..."}</option>
                  {propiedades.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo ?? p.codigo_interno} — {p.direccion ?? "sin dirección"}
                      {p.precio_venta_uf ? ` — UF ${ufFormat.format(p.precio_venta_uf)}` : ""}
                    </option>
                  ))}
                </select>
                {!loadingPropiedades && propiedades.length === 0 && (
                  <p className="text-[11px] text-on-surface-variant mt-1">No hay propiedades con estado "Publicada".</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Canal</label>
                <div className="flex gap-2">
                  {(["whatsapp", "correo"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCanal(c)}
                      className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                        canal === c ? "bg-gold text-primary-container" : "bg-background border border-white/15 text-on-surface-variant"
                      }`}
                    >
                      {c === "whatsapp" ? "WhatsApp" : "Correo"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-background/60 rounded p-3 text-xs text-on-surface-variant max-h-32 overflow-y-auto">
                {leads.map((l) => (
                  <p key={l.key}>
                    {l.nombre} — {l.telefono}
                  </p>
                ))}
              </div>

              {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3">{error}</div>}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!propiedad || sending}
                  onClick={handleSend}
                  className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors disabled:opacity-40"
                >
                  {sending ? "Enviando..." : `Enviar a ${leads.length}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
