import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EstadoWorkflow } from "../../lib/mockData";
import type { LeadItem } from "../../hooks/useLeads";

const ESTADOS: EstadoWorkflow[] = ["Nuevo", "Contactado", "Calificado", "En Visita", "Negociación", "Cerrado Ganado", "Cerrado Perdido"];
const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export interface LeadChanges {
  estado_workflow?: EstadoWorkflow;
  presupuesto_uf?: string | null;
  valor_negociacion_uf?: number | null;
  zona_interes?: string | null;
  tipo_operacion?: string | null;
  necesidades_clave?: string | null;
  nivel_calificacion?: number | null;
  ingreso_mensual?: number | null;
  complementa_renta?: boolean | null;
  estado_calificacion?: string | null;
}

interface Props {
  open: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onSave: (changes: LeadChanges) => void;
  onSaveEmail: (email: string | null) => void;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5";

export function LeadDetailModal({ open, lead, onClose, onSave, onSaveEmail }: Props) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [estado, setEstado] = useState<EstadoWorkflow>("Nuevo");
  const [presupuesto, setPresupuesto] = useState("");
  const [valorNegociacion, setValorNegociacion] = useState("");
  const [zona, setZona] = useState("");
  const [tipoOperacion, setTipoOperacion] = useState("");
  const [necesidades, setNecesidades] = useState("");
  const [nivel, setNivel] = useState<number | null>(null);
  const [ingreso, setIngreso] = useState("");
  const [complementaRenta, setComplementaRenta] = useState(false);
  const [estadoCalificacion, setEstadoCalificacion] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open || !lead) return;
    setEstado(lead.estado_workflow);
    setPresupuesto(lead.presupuesto_uf ?? "");
    setValorNegociacion(lead.valor_negociacion_uf != null ? String(lead.valor_negociacion_uf) : "");
    setZona(lead.zona_interes ?? "");
    setTipoOperacion(lead.tipo_operacion ?? "");
    setNecesidades(lead.necesidades_clave ?? "");
    setNivel(lead.nivel_calificacion);
    setIngreso(lead.ingreso_mensual != null ? String(lead.ingreso_mensual) : "");
    setComplementaRenta(lead.complementa_renta ?? false);
    setEstadoCalificacion(lead.estado_calificacion ?? "");
    setEmail(lead.email ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.key]);

  // Panel lateral: se monta ya fuera de pantalla y un tick después se desliza a la
  // vista — sin esto React lo montaría directo en su posición final y no habría
  // transición que animar. Sin animación de salida (se desmonta al instante al cerrar,
  // mismo nivel de simplicidad que el resto de los modales de este proyecto).
  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open || !lead) return null;

  const esVendedor = lead.rol === "vendedor";
  const esArrendatarioCandidato = lead.origen === "candidatos_arriendo";
  const esCompradorOArriendoComprador = lead.origen === "leads_compradores";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (esVendedor) return;
    if (esArrendatarioCandidato) {
      onSave({
        estado_workflow: estado,
        ingreso_mensual: ingreso ? Number(ingreso) : null,
        complementa_renta: complementaRenta,
        estado_calificacion: estadoCalificacion || null,
      });
    } else if (esCompradorOArriendoComprador) {
      onSave({
        estado_workflow: estado,
        presupuesto_uf: presupuesto.trim() || null,
        valor_negociacion_uf: valorNegociacion ? Number(valorNegociacion) : null,
        zona_interes: zona.trim() || null,
        tipo_operacion: tipoOperacion || null,
        necesidades_clave: necesidades.trim() || null,
        nivel_calificacion: nivel,
      });
    }
  }

  function handleSaveEmail() {
    onSaveEmail(email.trim() || null);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-luxury-blue border-l border-white/10 shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gold">{lead.nombre}</h2>
            <p className="text-xs text-on-surface-variant">{lead.telefono}</p>
          </div>
          <button aria-label="Cerrar modal" onClick={onClose} className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className={labelClass} htmlFor="lead-email">
              Correo
            </label>
            <input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveEmail}
            className="shrink-0 px-3 py-2.5 rounded border border-white/15 text-xs font-bold text-on-surface-variant hover:text-gold hover:border-gold/40 transition-colors"
          >
            Guardar correo
          </button>
        </div>

        {esVendedor ? (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="bg-background/60 rounded p-3.5 space-y-2 text-sm">
              {lead.direccion && (
                <p>
                  <span className="text-on-surface-variant">Propiedad: </span>
                  <span className="text-on-surface">{lead.direccion}</span>
                </p>
              )}
              {lead.motivo_categoria && (
                <p>
                  <span className="text-on-surface-variant">Motivo de venta: </span>
                  <span className="text-on-surface">{lead.motivo_categoria}</span>
                </p>
              )}
              {(lead.valor_tasacion_uf || lead.valor_publicacion_uf) && (
                <p>
                  <span className="text-on-surface-variant">Valor: </span>
                  <span className="text-on-surface font-bold">
                    UF {ufFormat.format(lead.valor_publicacion_uf ?? lead.valor_tasacion_uf ?? 0)}
                  </span>
                </p>
              )}
              <p>
                <span className="text-on-surface-variant">Etapa de captación: </span>
                <span className="text-on-surface">{lead.etapa_captacion}</span>
              </p>
            </div>
            <p className="text-xs text-on-surface-variant">
              Los vendedores se gestionan en el tablero de Captaciones (documentos, evaluación comercial, etapas). Este resumen es
              de solo lectura.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/captaciones")}
                className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors"
              >
                Ver en Captaciones
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className={labelClass} htmlFor="lead-estado">
                Etapa
              </label>
              <select
                id="lead-estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoWorkflow)}
                className={inputClass}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {esCompradorOArriendoComprador && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="lead-presupuesto">
                      Presupuesto (UF)
                    </label>
                    <input
                      id="lead-presupuesto"
                      type="text"
                      value={presupuesto}
                      onChange={(e) => setPresupuesto(e.target.value)}
                      placeholder="Ej. UF 5.000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="lead-valor-negociacion">
                      Valor de Negociación/Cierre (UF)
                    </label>
                    <input
                      id="lead-valor-negociacion"
                      type="number"
                      value={valorNegociacion}
                      onChange={(e) => setValorNegociacion(e.target.value)}
                      placeholder="Ej. 1287"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Calificación</label>
                  <div className="flex items-center gap-1.5 h-[42px]">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNivel(nivel === n ? null : n)}
                        aria-label={`Nivel ${n}`}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                          nivel !== null && n <= nivel
                            ? "bg-gold text-primary-container"
                            : "bg-background border border-white/15 text-on-surface-variant"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="lead-zona">
                    Zona de interés
                  </label>
                  <input
                    id="lead-zona"
                    type="text"
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="lead-tipo-operacion">
                    Intención
                  </label>
                  <select id="lead-tipo-operacion" value={tipoOperacion} onChange={(e) => setTipoOperacion(e.target.value)} className={inputClass}>
                    <option value="">Sin especificar</option>
                    <option value="buy">Comprar</option>
                    <option value="rent">Arrendar</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="lead-necesidades">
                    Necesidades clave
                  </label>
                  <textarea
                    id="lead-necesidades"
                    rows={2}
                    value={necesidades}
                    onChange={(e) => setNecesidades(e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </>
            )}

            {esArrendatarioCandidato && (
              <>
                <div>
                  <label className={labelClass} htmlFor="lead-ingreso">
                    Ingreso mensual ($)
                  </label>
                  <input
                    id="lead-ingreso"
                    type="number"
                    value={ingreso}
                    onChange={(e) => setIngreso(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-1.5 text-sm text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={complementaRenta}
                    onChange={(e) => setComplementaRenta(e.target.checked)}
                    className="accent-gold"
                  />
                  Complementa renta con otro ingreso
                </label>
                <div>
                  <label className={labelClass} htmlFor="lead-calificacion">
                    Estado de calificación
                  </label>
                  <input
                    id="lead-calificacion"
                    type="text"
                    value={estadoCalificacion}
                    onChange={(e) => setEstadoCalificacion(e.target.value)}
                    placeholder="Ej. Pendiente, Aprobado..."
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
