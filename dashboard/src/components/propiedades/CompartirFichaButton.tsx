import { useState } from "react";
import type { PropertyItem } from "../../hooks/useProperties";

interface Props {
  property: PropertyItem;
  valorUf: number | null;
}

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const clpFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function buildTexto(property: PropertyItem, valorUf: number | null): string {
  const lineas = [`🏡 *${property.titulo ?? "Propiedad"}*`];
  const ubicacion = [property.direccion, property.comuna].filter(Boolean).join(", ");
  if (ubicacion) lineas.push(`📍 ${ubicacion}`);
  if (property.precio_venta_uf) {
    const clp = valorUf ? ` (≈ $${clpFormat.format(property.precio_venta_uf * valorUf)})` : "";
    lineas.push(`💰 UF ${ufFormat.format(property.precio_venta_uf)}${clp}`);
  }
  const caracteristicas = [
    property.habitaciones ? `${property.habitaciones} dorm.` : null,
    property.banos ? `${property.banos} baños` : null,
    property.area_construida ? `${property.area_construida} m² construidos` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (caracteristicas) lineas.push(`🛏️ ${caracteristicas}`);
  if (property.caracteristicas_clave) lineas.push(`\n${property.caracteristicas_clave}`);
  if (property.link_carpeta_drive) lineas.push(`\n📸 Fotos: ${property.link_carpeta_drive}`);
  if (property.link_tour_virtual) lineas.push(`🎥 Tour virtual: ${property.link_tour_virtual}`);
  return lineas.join("\n");
}

export function CompartirFichaButton({ property, valorUf }: Props) {
  const [open, setOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const texto = buildTexto(property, valorUf);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-tertiary/20 text-tertiary font-bold text-xs uppercase tracking-widest py-2.5 rounded hover:bg-tertiary/30 transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[16px]">share</span>
        Compartir Ficha Rápida
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-luxury-blue border border-white/10 rounded-lg shadow-2xl p-3 z-20 space-y-2">
          <textarea readOnly rows={8} value={texto} className="w-full bg-background border border-white/[0.15] rounded px-2 py-2 text-xs text-on-surface resize-none" />
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center bg-[#25D366]/20 text-[#25D366] text-xs font-bold py-2 rounded hover:bg-[#25D366]/30 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(property.titulo ?? "Propiedad")}&body=${encodeURIComponent(texto)}`}
              className="flex-1 text-center bg-gold/20 text-gold text-xs font-bold py-2 rounded hover:bg-gold/30 transition-colors"
            >
              Correo
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(texto);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1500);
              }}
              className="flex-1 bg-white/10 text-on-surface text-xs font-bold py-2 rounded hover:bg-white/15 transition-colors"
            >
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
