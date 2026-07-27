import { useState } from "react";
import { ROL_LABELS, ZONAS_COMUNES, type LeadRol } from "../../hooks/useLeads";
import { MOTIVO_CATEGORIAS, TIPO_PROPIEDAD_OPTIONS, ETAPA_COLUMNS, type EtapaCaptacion } from "../../hooks/useCaptaciones";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    rol: LeadRol;
    nombre: string;
    telefono: string;
    email?: string;
    origen?: string;
    direccion?: string;
    tipo_propiedad?: string;
    motivo_categoria?: string;
    urgencia_venta?: number;
    etapa_captacion?: string;
    valor_tasacion_uf?: number;
    zona_interes?: string;
    presupuesto_uf_num?: number;
    necesidades_clave?: string;
    nivel_calificacion?: number;
    ingreso_mensual?: number;
    complementa_renta?: boolean;
    tipo_persona?: string;
  }) => void;
}

const inputClass =
  "w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors";
const labelClass = "block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5";

const ROLES: LeadRol[] = ["vendedor", "comprador", "arrendatario"];
const ORIGEN_OPTIONS = ["Landing Page", "Portales", "RRSS", "Referido", "Otro"];
const NIVEL_LABELS: Record<number, string> = { 1: "Curioso", 2: "Activo", 3: "Crédito aprobado / Listo" };

export function LeadCreateModal({ open, onClose, onCreate }: Props) {
  const [rol, setRol] = useState<LeadRol>("comprador");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [origen, setOrigen] = useState("");

  // vendedor
  const [direccion, setDireccion] = useState("");
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [motivoCategoria, setMotivoCategoria] = useState("");
  const [urgencia, setUrgencia] = useState<number | null>(null);
  const [etapaInicial, setEtapaInicial] = useState<EtapaCaptacion>(ETAPA_COLUMNS[0].id);
  const [valorTasacion, setValorTasacion] = useState("");

  // comprador
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [zonaOtro, setZonaOtro] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [necesidades, setNecesidades] = useState("");
  const [nivel, setNivel] = useState<number | null>(null);

  // arrendatario
  const [ingreso, setIngreso] = useState("");
  const [tipoPersona, setTipoPersona] = useState("");
  const [complementaRenta, setComplementaRenta] = useState(false);

  if (!open) return null;

  function reset() {
    setRol("comprador");
    setNombre("");
    setTelefono("");
    setEmail("");
    setOrigen("");
    setDireccion("");
    setTipoPropiedad("");
    setMotivoCategoria("");
    setUrgencia(null);
    setEtapaInicial(ETAPA_COLUMNS[0].id);
    setValorTasacion("");
    setZonasSeleccionadas([]);
    setZonaOtro("");
    setPresupuesto("");
    setNecesidades("");
    setNivel(null);
    setIngreso("");
    setTipoPersona("");
    setComplementaRenta(false);
  }

  function toggleZona(z: string) {
    setZonasSeleccionadas((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return;

    const zonaFinal = [...zonasSeleccionadas, zonaOtro.trim()].filter(Boolean).join(", ");

    onCreate({
      rol,
      nombre: nombre.trim(),
      telefono: telefono.replace(/\D/g, ""),
      email: email.trim() || undefined,
      origen: origen || undefined,
      direccion: direccion.trim() || undefined,
      tipo_propiedad: tipoPropiedad || undefined,
      motivo_categoria: motivoCategoria || undefined,
      urgencia_venta: urgencia ?? undefined,
      etapa_captacion: etapaInicial,
      valor_tasacion_uf: valorTasacion ? Number(valorTasacion) : undefined,
      zona_interes: zonaFinal || undefined,
      presupuesto_uf_num: presupuesto ? Number(presupuesto) : undefined,
      necesidades_clave: necesidades.trim() || undefined,
      nivel_calificacion: nivel ?? undefined,
      ingreso_mensual: ingreso ? Number(ingreso) : undefined,
      complementa_renta: complementaRenta,
      tipo_persona: tipoPersona || undefined,
    });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-gold">Nuevo Lead</h2>
          <button aria-label="Cerrar modal" onClick={handleClose} className="text-on-surface-variant hover:text-gold transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="create-nombre">
                Nombre completo *
              </label>
              <input
                id="create-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="create-telefono">
                Teléfono (WhatsApp) *
              </label>
              <input
                id="create-telefono"
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="56912345678"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="create-email">
              Correo
            </label>
            <input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="create-origen">
                Origen del Lead
              </label>
              <select id="create-origen" value={origen} onChange={(e) => setOrigen(e.target.value)} className={inputClass}>
                <option value="">Sin especificar</option>
                {ORIGEN_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="create-rol">
                Tipo de Lead *
              </label>
              <select
                id="create-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as LeadRol)}
                className={`${inputClass} font-bold text-gold`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROL_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {rol === "vendedor" && (
            <>
              <div>
                <label className={labelClass} htmlFor="create-direccion">
                  Dirección de la Propiedad
                </label>
                <input
                  id="create-direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Calle Prat 450, Quillota"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="create-tipo-propiedad">
                    Tipo de Propiedad
                  </label>
                  <select
                    id="create-tipo-propiedad"
                    value={tipoPropiedad}
                    onChange={(e) => setTipoPropiedad(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccione...</option>
                    {TIPO_PROPIEDAD_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="create-motivo">
                    Motivación de Venta
                  </label>
                  <select
                    id="create-motivo"
                    value={motivoCategoria}
                    onChange={(e) => setMotivoCategoria(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sin especificar</option>
                    {MOTIVO_CATEGORIAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Urgencia de Venta</label>
                  <div className="flex items-center gap-1.5 h-[42px]">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setUrgencia(urgencia === n ? null : n)}
                        aria-label={`Urgencia ${n}`}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                          urgencia !== null && n <= urgencia
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
                  <label className={labelClass} htmlFor="create-valor-tasacion">
                    Valor tasación esperado (UF)
                  </label>
                  <input
                    id="create-valor-tasacion"
                    type="number"
                    value={valorTasacion}
                    onChange={(e) => setValorTasacion(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="create-etapa-inicial">
                  Etapa Inicial
                </label>
                <select
                  id="create-etapa-inicial"
                  value={etapaInicial}
                  onChange={(e) => setEtapaInicial(e.target.value as EtapaCaptacion)}
                  className={inputClass}
                >
                  {ETAPA_COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {rol === "comprador" && (
            <>
              <div>
                <label className={labelClass} htmlFor="create-presupuesto">
                  Presupuesto (UF)
                </label>
                <input
                  id="create-presupuesto"
                  type="number"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="Ej. 5000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Zona de Interés</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ZONAS_COMUNES.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggleZona(z)}
                      className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors ${
                        zonasSeleccionadas.includes(z)
                          ? "bg-gold text-primary-container"
                          : "bg-background border border-white/15 text-on-surface-variant"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={zonaOtro}
                  onChange={(e) => setZonaOtro(e.target.value)}
                  placeholder="Otro sector (opcional)"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="create-necesidades">
                  Necesidades clave
                </label>
                <textarea
                  id="create-necesidades"
                  rows={2}
                  value={necesidades}
                  onChange={(e) => setNecesidades(e.target.value)}
                  placeholder="Ej. 3 dormitorios, patio, cerca del centro..."
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>Nivel de Calificación</label>
                <div className="flex items-center gap-1.5">
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
                  <span className="text-[11px] text-on-surface-variant ml-1">
                    {nivel ? NIVEL_LABELS[nivel] : "1: Curioso · 2: Activo · 3: Crédito aprobado/Listo"}
                  </span>
                </div>
              </div>
            </>
          )}

          {rol === "arrendatario" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="create-ingreso">
                    Ingreso Mensual ($)
                  </label>
                  <input
                    id="create-ingreso"
                    type="number"
                    value={ingreso}
                    onChange={(e) => setIngreso(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="create-tipo-persona">
                    Tipo de Persona
                  </label>
                  <select
                    id="create-tipo-persona"
                    value={tipoPersona}
                    onChange={(e) => setTipoPersona(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sin especificar</option>
                    <option value="Natural">Natural</option>
                    <option value="Jurídica">Jurídica</option>
                  </select>
                </div>
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
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
