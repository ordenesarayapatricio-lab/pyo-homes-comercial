import { TIPO_PROPIEDAD_OPTIONS } from "../../hooks/useCaptaciones";
import type { PropertyItem } from "../../hooks/useProperties";

interface Props {
  form: Partial<PropertyItem>;
  onChange: (changes: Partial<PropertyItem>) => void;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1";

export function FichaTecnicaTab({ form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Datos Físicos</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Dormitorios</label>
            <input
              type="number"
              value={form.habitaciones ?? ""}
              onChange={(e) => onChange({ habitaciones: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Baños</label>
            <input
              type="number"
              value={form.banos ?? ""}
              onChange={(e) => onChange({ banos: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Estacionamientos</label>
            <input
              type="number"
              value={form.estacionamientos ?? ""}
              onChange={(e) => onChange({ estacionamientos: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Bodegas</label>
            <input
              type="number"
              value={form.bodegas ?? ""}
              onChange={(e) => onChange({ bodegas: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>m² Útiles (construida)</label>
            <input
              type="number"
              value={form.area_construida ?? ""}
              onChange={(e) => onChange({ area_construida: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>m² Totales (terreno)</label>
            <input
              type="number"
              value={form.area_terreno ?? ""}
              onChange={(e) => onChange({ area_terreno: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Gastos Comunes ($)</label>
            <input
              type="number"
              value={form.gastos_comunes ?? ""}
              onChange={(e) => onChange({ gastos_comunes: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contribuciones ($/año)</label>
            <input
              type="number"
              value={form.contribuciones ?? ""}
              onChange={(e) => onChange({ contribuciones: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tipo de Propiedad</label>
            <select
              value={form.tipo_propiedad ?? ""}
              onChange={(e) => onChange({ tipo_propiedad: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Sin especificar</option>
              {TIPO_PROPIEDAD_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Ubicación Técnica</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Dirección Exacta</label>
            <input value={form.direccion ?? ""} onChange={(e) => onChange({ direccion: e.target.value || null })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Comuna</label>
            <input value={form.comuna ?? ""} onChange={(e) => onChange({ comuna: e.target.value || null })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sector</label>
            <input value={form.sector ?? ""} onChange={(e) => onChange({ sector: e.target.value || null })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rol del SII</label>
            <input value={form.rol_sii ?? ""} onChange={(e) => onChange({ rol_sii: e.target.value || null })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Link Google Maps</label>
            <input
              value={form.link_google_maps ?? ""}
              onChange={(e) => onChange({ link_google_maps: e.target.value || null })}
              className={inputClass}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div>
            <label className={labelClass}>Latitud</label>
            <input
              type="number"
              step="any"
              value={form.latitud ?? ""}
              onChange={(e) => onChange({ latitud: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
              placeholder="-32.8816"
            />
          </div>
          <div>
            <label className={labelClass}>Longitud</label>
            <input
              type="number"
              step="any"
              value={form.longitud ?? ""}
              onChange={(e) => onChange({ longitud: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
              placeholder="-71.2488"
            />
          </div>
        </div>

        {form.latitud != null && form.longitud != null ? (
          <div className="mt-3 rounded-lg overflow-hidden border border-white/[0.15]">
            <iframe
              title="Ubicación de la propiedad"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${form.latitud},${form.longitud}&z=16&output=embed`}
            />
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-on-surface-variant/60 border border-dashed border-white/10 rounded-lg py-6 text-center">
            Ingresa latitud y longitud para ver el mapa con el pin de la propiedad — útil para revisar a simple vista
            colegios, supermercados o clínicas cercanas.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Descripción Pública</h3>
        <textarea
          rows={4}
          value={form.caracteristicas_clave ?? ""}
          onChange={(e) => onChange({ caracteristicas_clave: e.target.value || null })}
          placeholder="Texto comercial para publicar en portales o enviar por correo..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Galería de Medios</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelClass}>Carpeta Drive (fotos HD)</label>
            <input
              value={form.link_carpeta_drive ?? ""}
              onChange={(e) => onChange({ link_carpeta_drive: e.target.value || null })}
              className={inputClass}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div>
            <label className={labelClass}>Tour Virtual 360° / Video</label>
            <input
              value={form.link_tour_virtual ?? ""}
              onChange={(e) => onChange({ link_tour_virtual: e.target.value || null })}
              className={inputClass}
              placeholder="https://youtube.com/... o Matterport"
            />
          </div>
          <div>
            <label className={labelClass}>Link Portal Inmobiliario</label>
            <input
              value={form.link_portal_inmobiliario ?? ""}
              onChange={(e) => onChange({ link_portal_inmobiliario: e.target.value || null })}
              className={inputClass}
              placeholder="https://portalinmobiliario.com/..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
