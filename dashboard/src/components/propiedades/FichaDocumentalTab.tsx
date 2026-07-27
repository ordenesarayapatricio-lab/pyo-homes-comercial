import type { PropertyItem } from "../../hooks/useProperties";

interface Props {
  form: Partial<PropertyItem>;
  onChange: (changes: Partial<PropertyItem>) => void;
}

const CHECKS: { key: keyof PropertyItem; label: string }[] = [
  { key: "certificado_cip", label: "Certificado de Informes Previos (CIP)" },
  { key: "certificado_gravamenes", label: "Certificado de Hipotecas, Gravámenes y Prohibiciones" },
  { key: "dominio_vigente", label: "Dominio Vigente (Conservador de Bienes Raíces)" },
  { key: "mandato_exclusividad", label: "Mandato de Exclusividad / Corretaje Firmado" },
  { key: "cedula_identidad_verificada", label: "Cédula de Identidad del Propietario" },
];

export function FichaDocumentalTab({ form, onChange }: Props) {
  const completos = CHECKS.filter((c) => form[c.key]).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span
          className={`px-2.5 py-1 rounded text-xs font-bold ${
            completos === CHECKS.length ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {completos}/{CHECKS.length} completos
        </span>
      </div>

      <ul className="space-y-3">
        {CHECKS.map((c) => (
          <li key={c.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`doc-${c.key}`}
              checked={Boolean(form[c.key])}
              onChange={(e) => onChange({ [c.key]: e.target.checked } as Partial<PropertyItem>)}
              className="accent-gold w-4 h-4"
            />
            <label htmlFor={`doc-${c.key}`} className="text-sm text-on-surface cursor-pointer">
              {c.label}
            </label>
          </li>
        ))}
      </ul>

      <div>
        {form.link_carpeta_legal ? (
          <a
            href={form.link_carpeta_legal}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-tertiary/20 text-tertiary font-bold text-xs uppercase tracking-widest py-2.5 rounded hover:bg-tertiary/30 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            Abrir Carpeta Legal
          </a>
        ) : (
          <div className="w-full bg-surface-container-high text-on-surface-variant/60 font-bold text-xs uppercase tracking-widest py-2.5 rounded flex items-center justify-center gap-2 cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">folder_off</span>
            Sin carpeta legal configurada
          </div>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">
          Link de la Carpeta Legal en Drive
        </label>
        <input
          value={form.link_carpeta_legal ?? ""}
          onChange={(e) => onChange({ link_carpeta_legal: e.target.value || null })}
          placeholder="https://drive.google.com/..."
          className="w-full bg-background border border-white/[0.15] rounded px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors"
        />
      </div>
    </div>
  );
}
