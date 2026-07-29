import { useEffect, useState } from "react";
import type { PropertyItem } from "../../hooks/useProperties";
import { generarInformePropietarioPdf } from "../../lib/informePdf";

interface Props {
  open: boolean;
  properties: PropertyItem[];
  valorUf: number | null;
  onClose: () => void;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5";
const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export function InformePropietarioModal({ open, properties, valorUf, onClose }: Props) {
  const [propiedadId, setPropiedadId] = useState("");
  const [generado, setGenerado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPropiedadId("");
    setGenerado(false);
  }, [open]);

  if (!open) return null;

  const propiedad = properties.find((p) => p.id === propiedadId) ?? null;

  function handleGenerar() {
    if (!propiedad) return;
    generarInformePropietarioPdf(propiedad, valorUf);
    setGenerado(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-gold">Generar Informe para Propietario</h2>
          <button aria-label="Cerrar modal" onClick={onClose} className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className={labelClass} htmlFor="informe-propiedad">
              Propiedad
            </label>
            <select id="informe-propiedad" value={propiedadId} onChange={(e) => setPropiedadId(e.target.value)} className={inputClass}>
              <option value="">Seleccione...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo ?? p.codigo_interno} — {p.direccion ?? "sin dirección"}
                  {p.precio_venta_uf ? ` — UF ${ufFormat.format(p.precio_venta_uf)}` : ""}
                </option>
              ))}
            </select>
            {properties.length === 0 && <p className="text-[11px] text-on-surface-variant mt-1">No hay propiedades registradas.</p>}
          </div>

          {generado && (
            <div className="bg-tertiary/10 border border-tertiary/30 text-tertiary text-sm rounded-lg p-3">
              PDF generado y descargado.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!propiedad}
              onClick={handleGenerar}
              className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors disabled:opacity-40"
            >
              Generar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
