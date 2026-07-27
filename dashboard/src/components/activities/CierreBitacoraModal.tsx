import { useState } from "react";

interface Props {
  open: boolean;
  cardTitle: string;
  onClose: () => void;
  onConfirm: (detalle: string) => void;
}

export function CierreBitacoraModal({ open, cardTitle, onClose, onConfirm }: Props) {
  const [detalle, setDetalle] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(detalle.trim());
    setDetalle("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden z-10">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-gold">Cerrar actividad</h2>
          <p className="text-xs text-on-surface-variant mt-1 truncate">{cardTitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="bitacoraDetalle">
              ¿Qué se acordó?
            </label>
            <textarea
              id="bitacoraDetalle"
              autoFocus
              rows={4}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Resumen de lo conversado o acordado con el cliente..."
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="text-on-surface-variant text-sm font-bold hover:text-on-surface transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors"
            >
              Guardar y Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
