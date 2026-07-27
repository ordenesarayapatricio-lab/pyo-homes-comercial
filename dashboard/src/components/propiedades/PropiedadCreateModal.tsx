import { useState } from "react";
import { TIPO_PROPIEDAD_OPTIONS } from "../../hooks/useCaptaciones";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { titulo: string; direccion: string; tipo_propiedad?: string; tipo_negocio?: string }) => Promise<void>;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5";

export function PropiedadCreateModal({ open, onClose, onCreate }: Props) {
  const [titulo, setTitulo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [tipoNegocio, setTipoNegocio] = useState("Venta");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !direccion.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        titulo: titulo.trim(),
        direccion: direccion.trim(),
        tipo_propiedad: tipoPropiedad || undefined,
        tipo_negocio: tipoNegocio || undefined,
      });
      setTitulo("");
      setDireccion("");
      setTipoPropiedad("");
      setTipoNegocio("Venta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-gold">Nueva Propiedad</h2>
          <button onClick={onClose} aria-label="Cerrar modal" className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass} htmlFor="prop-titulo">
              Título *
            </label>
            <input id="prop-titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="prop-direccion">
              Dirección *
            </label>
            <input id="prop-direccion" required value={direccion} onChange={(e) => setDireccion(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="prop-tipo">
              Tipo de Propiedad
            </label>
            <select id="prop-tipo" value={tipoPropiedad} onChange={(e) => setTipoPropiedad(e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              {TIPO_PROPIEDAD_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="prop-negocio">
              Tipo de Negocio
            </label>
            <select id="prop-negocio" value={tipoNegocio} onChange={(e) => setTipoNegocio(e.target.value)} className={inputClass}>
              <option value="Venta">Venta</option>
              <option value="Arriendo">Arriendo</option>
              <option value="Venta/Arriendo">Venta/Arriendo</option>
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
