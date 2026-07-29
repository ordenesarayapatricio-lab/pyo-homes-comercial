import type { PropertyItem } from "../../hooks/useProperties";
import { comisionArriendoClp, comisionVentaUf } from "../../lib/comisiones";

interface EvalForm {
  valor_tasacion_uf: number | null;
  valor_publicacion_uf: number | null;
  valor_ajuste_uf: number | null;
}

interface Props {
  form: Partial<PropertyItem>;
  onChange: (changes: Partial<PropertyItem>) => void;
  evalForm: EvalForm;
  onEvalChange: (changes: Partial<EvalForm>) => void;
  valorUf: number | null;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1";
const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const clpFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export function FichaFinancieroTab({ form, onChange, evalForm, onEvalChange, valorUf }: Props) {
  const diferenciaUf =
    evalForm.valor_publicacion_uf != null && evalForm.valor_tasacion_uf != null
      ? evalForm.valor_publicacion_uf - evalForm.valor_tasacion_uf
      : null;
  const diferenciaPct =
    diferenciaUf != null && evalForm.valor_tasacion_uf ? (diferenciaUf / evalForm.valor_tasacion_uf) * 100 : null;

  const arriendoMensual = form.precio_arriendo_clp ?? null;
  const gastosAnuales = (form.gastos_comunes ?? 0) * 12 + (form.contribuciones ?? 0);
  const noiAnual = arriendoMensual != null ? arriendoMensual * 12 - gastosAnuales : null;
  const precioVentaClp = form.precio_venta_uf && valorUf ? form.precio_venta_uf * valorUf : null;
  const capRate = noiAnual != null && precioVentaClp ? (noiAnual / precioVentaClp) * 100 : null;

  const comisionVenta = comisionVentaUf(form.precio_venta_uf ?? null);
  const comisionArriendo = comisionArriendoClp({
    precioArriendoClp: form.precio_arriendo_clp ?? null,
    plazoContratoMeses: form.plazo_contrato_meses ?? null,
    mesesGarantia: form.meses_garantia ?? null,
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Evaluación Comercial</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Valor Tasación (UF)</label>
            <input
              type="number"
              value={evalForm.valor_tasacion_uf ?? ""}
              onChange={(e) => onEvalChange({ valor_tasacion_uf: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Valor Publicación (UF)</label>
            <input
              type="number"
              value={evalForm.valor_publicacion_uf ?? ""}
              onChange={(e) => onEvalChange({ valor_publicacion_uf: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ajuste (UF)</label>
            <input
              type="number"
              value={evalForm.valor_ajuste_uf ?? ""}
              onChange={(e) => onEvalChange({ valor_ajuste_uf: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Diferencia de Mercado</label>
            <div className="bg-surface-container-high rounded px-3 py-2 text-sm text-on-surface">
              {diferenciaUf != null ? (
                <>
                  UF {ufFormat.format(diferenciaUf)}{" "}
                  <span className={diferenciaPct != null && diferenciaPct >= 0 ? "text-emerald-400" : "text-error"}>
                    ({diferenciaPct?.toFixed(1)}%)
                  </span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Precio y Margen</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Precio de Venta (UF)</label>
            <input
              type="number"
              value={form.precio_venta_uf ?? ""}
              onChange={(e) => onChange({ precio_venta_uf: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Margen de Negociación (UF)</label>
            <input
              type="number"
              value={form.margen_negociacion_uf ?? ""}
              onChange={(e) => onChange({ margen_negociacion_uf: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Comisión de Venta (2%+IVA ambas puntas)</label>
            <div className="bg-surface-container-high rounded px-3 py-2 text-sm font-bold text-gold">
              {comisionVenta != null ? `UF ${ufFormat.format(comisionVenta)}` : "— (falta precio de venta)"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Contrato de Arriendo y Comisión</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Plazo del Contrato (meses)</label>
            <input
              type="number"
              value={form.plazo_contrato_meses ?? ""}
              onChange={(e) => onChange({ plazo_contrato_meses: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Meses de Garantía</label>
            <input
              type="number"
              value={form.meses_garantia ?? ""}
              onChange={(e) => onChange({ meses_garantia: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>
              Comisión de Arriendo ({(form.plazo_contrato_meses ?? 0) >= 24 ? "2%+IVA del total del contrato" : "50%+IVA de la garantía"})
            </label>
            <div className="bg-surface-container-high rounded px-3 py-2 text-sm font-bold text-gold">
              {comisionArriendo != null ? `$${clpFormat.format(comisionArriendo)}` : "— (faltan datos del contrato)"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gold uppercase tracking-wide mb-2">Módulo de Inversión (Cap Rate)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Arriendo Estimado/Real ($/mes)</label>
            <input
              type="number"
              value={form.precio_arriendo_clp ?? ""}
              onChange={(e) => onChange({ precio_arriendo_clp: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>NOI Anual (estimado)</label>
            <div className="bg-surface-container-high rounded px-3 py-2 text-sm text-on-surface">
              {noiAnual != null ? `$${clpFormat.format(noiAnual)}` : "—"}
            </div>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Cap Rate Estimado</label>
            <div className="bg-surface-container-high rounded px-3 py-2 text-lg font-bold text-gold">
              {capRate != null ? `${capRate.toFixed(2)}%` : "— (falta precio de venta, arriendo o valor UF del día)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
