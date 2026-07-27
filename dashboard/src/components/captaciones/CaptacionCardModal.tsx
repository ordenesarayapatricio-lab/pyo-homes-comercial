import { useEffect, useState } from "react";
import type { CaptacionLead, EtapaCaptacion, EvaluacionComercial, MotivoCategoria } from "../../hooks/useCaptaciones";
import { ETAPA_COLUMNS, PARKING_ETAPAS, MOTIVO_CATEGORIAS, TIPO_PROPIEDAD_OPTIONS } from "../../hooks/useCaptaciones";

interface Props {
  open: boolean;
  lead: CaptacionLead | null;
  defaultEtapa: EtapaCaptacion;
  onClose: () => void;
  onSave: (changes: {
    motivacion_venta: string | null;
    motivo_categoria: MotivoCategoria | null;
    urgencia_venta: number | null;
    etapa_captacion: EtapaCaptacion;
  }) => void;
  onCreate: (input: {
    nombre_dueno: string;
    telefono: string;
    direccion: string;
    motivacion_venta: string | null;
    motivo_categoria: MotivoCategoria | null;
    etapa_captacion: EtapaCaptacion;
  }) => void;
  onSaveProperty: (changes: {
    direccion?: string;
    tipo_propiedad?: string;
    link_carpeta_drive?: string | null;
    certificado_cip?: boolean;
    certificado_gravamenes?: boolean;
    dominio_vigente?: boolean;
  }) => void;
  onMarkContactedToday: () => void;
  onLoadEvaluacion: (propiedadUuid: string) => Promise<EvaluacionComercial | null>;
  onSaveEvaluacion: (values: {
    valor_tasacion_uf: number | null;
    valor_publicacion_uf: number | null;
    valor_ajuste_uf: number | null;
  }) => void;
}

const ALL_ETAPAS: EtapaCaptacion[] = [...ETAPA_COLUMNS.map((c) => c.id), ...PARKING_ETAPAS];

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function CaptacionCardModal({
  open,
  lead,
  defaultEtapa,
  onClose,
  onSave,
  onCreate,
  onSaveProperty,
  onMarkContactedToday,
  onLoadEvaluacion,
  onSaveEvaluacion,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [certificadoCip, setCertificadoCip] = useState(false);
  const [certificadoGravamenes, setCertificadoGravamenes] = useState(false);
  const [dominioVigente, setDominioVigente] = useState(false);
  const [motivoCategoria, setMotivoCategoria] = useState<MotivoCategoria | "">("");
  const [notas, setNotas] = useState("");
  const [urgencia, setUrgencia] = useState<number | null>(null);
  const [etapa, setEtapa] = useState<EtapaCaptacion>("Prospección");

  // Reset form fields only when the modal opens or switches to a different
  // lead — NOT on every re-render of the same lead (e.g. a quick action like
  // "Marcar contacto hoy" refreshes `lead` from the DB, which would otherwise
  // wipe out any not-yet-saved edits in the rest of the form).
  useEffect(() => {
    if (!open) return;
    setNombre(lead?.nombre_dueno ?? "");
    setTelefono(lead?.telefono ?? "");
    setDireccion(lead?.propiedades_inventario?.direccion ?? "");
    setTipoPropiedad(lead?.propiedades_inventario?.tipo_propiedad ?? "");
    setDriveLink(lead?.propiedades_inventario?.link_carpeta_drive ?? "");
    setCertificadoCip(lead?.propiedades_inventario?.certificado_cip ?? false);
    setCertificadoGravamenes(lead?.propiedades_inventario?.certificado_gravamenes ?? false);
    setDominioVigente(lead?.propiedades_inventario?.dominio_vigente ?? false);
    setMotivoCategoria(lead?.motivo_categoria ?? "");
    setNotas(lead?.motivacion_venta ?? "");
    setUrgencia(lead?.urgencia_venta ?? null);
    setEtapa(lead?.etapa_captacion ?? defaultEtapa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id_lead]);

  // Evaluación Comercial lives in its own table (`evaluaciones_comerciales`), fetched
  // separately and keyed off the property id — not the `lead` reference — so a refresh
  // of the leads list (e.g. from another quick action) never resets these fields either.
  const [evalTasacion, setEvalTasacion] = useState("");
  const [evalPublicacion, setEvalPublicacion] = useState("");
  const [evalAjuste, setEvalAjuste] = useState("");
  const [evalLoading, setEvalLoading] = useState(false);

  useEffect(() => {
    if (!open || !lead?.propiedad_id) {
      setEvalTasacion("");
      setEvalPublicacion("");
      setEvalAjuste("");
      return;
    }
    let cancelled = false;
    setEvalLoading(true);
    onLoadEvaluacion(lead.propiedad_id).then((ev) => {
      if (cancelled) return;
      setEvalTasacion(ev?.valor_tasacion_uf != null ? String(ev.valor_tasacion_uf) : "");
      setEvalPublicacion(ev?.valor_publicacion_uf != null ? String(ev.valor_publicacion_uf) : "");
      setEvalAjuste(ev?.valor_ajuste_uf != null ? String(ev.valor_ajuste_uf) : "");
      setEvalLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.propiedad_id]);

  if (!open) return null;

  const diasSinContacto = lead ? daysSince(lead.fecha_ultimo_contacto) : null;

  const diferenciaMercado =
    evalTasacion && evalPublicacion ? Number(evalPublicacion) - Number(evalTasacion) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lead) {
      onSave({
        motivacion_venta: notas.trim() || null,
        motivo_categoria: motivoCategoria || null,
        urgencia_venta: urgencia,
        etapa_captacion: etapa,
      });
      if (lead.propiedad_id) {
        onSaveProperty({
          direccion: direccion.trim() || undefined,
          tipo_propiedad: tipoPropiedad || undefined,
          link_carpeta_drive: driveLink.trim() || null,
          certificado_cip: certificadoCip,
          certificado_gravamenes: certificadoGravamenes,
          dominio_vigente: dominioVigente,
        });
        onSaveEvaluacion({
          valor_tasacion_uf: evalTasacion ? Number(evalTasacion) : null,
          valor_publicacion_uf: evalPublicacion ? Number(evalPublicacion) : null,
          valor_ajuste_uf: evalAjuste ? Number(evalAjuste) : null,
        });
      }
    } else {
      if (!nombre.trim() || !telefono.trim()) return;
      onCreate({
        nombre_dueno: nombre.trim(),
        telefono: telefono.replace(/\D/g, ""),
        direccion: direccion.trim(),
        motivacion_venta: notas.trim() || null,
        motivo_categoria: motivoCategoria || null,
        etapa_captacion: etapa,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gold">{lead ? lead.nombre_dueno : "Nueva Captación"}</h2>
            {lead && <p className="text-xs text-on-surface-variant">{lead.telefono}</p>}
          </div>
          <button
            aria-label="Cerrar modal"
            onClick={onClose}
            className="text-on-surface-variant hover:text-gold transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {!lead && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="nombre">
                  Nombre *
                </label>
                <input
                  id="nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="telefono">
                  Teléfono *
                </label>
                <input
                  id="telefono"
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="56912345678"
                  className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="direccion">
              Dirección de la propiedad
            </label>
            <input
              id="direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Calle Prat 450, Quillota"
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="tipo-propiedad">
              Tipo de Propiedad
            </label>
            <select
              id="tipo-propiedad"
              value={tipoPropiedad}
              onChange={(e) => setTipoPropiedad(e.target.value)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
            >
              <option value="">Seleccione...</option>
              {TIPO_PROPIEDAD_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="motivo">
                Motivo de venta
              </label>
              <select
                id="motivo"
                value={motivoCategoria}
                onChange={(e) => setMotivoCategoria(e.target.value as MotivoCategoria)}
                className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
              >
                <option value="">Sin especificar</option>
                {MOTIVO_CATEGORIAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Urgencia de venta
              </label>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="notas">
              Notas
            </label>
            <textarea
              id="notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles de la conversación, contexto adicional..."
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors resize-none"
            />
          </div>

          {lead && (
            <div className="flex items-center justify-between bg-background/60 rounded px-3 py-2.5">
              <span className="text-xs text-on-surface-variant">
                {diasSinContacto === null
                  ? "Sin contacto registrado"
                  : diasSinContacto === 0
                    ? "Contacto registrado hoy"
                    : `Último contacto hace ${diasSinContacto} día${diasSinContacto === 1 ? "" : "s"}`}
              </span>
              <button
                type="button"
                onClick={onMarkContactedToday}
                className="text-xs font-bold text-gold hover:underline"
              >
                Marcar contacto hoy
              </button>
            </div>
          )}

          {lead?.propiedad_id && (
            <div className="bg-background/60 rounded p-3.5 space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                Evaluación Comercial {evalLoading && <span className="normal-case font-normal">(cargando...)</span>}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1" htmlFor="eval-tasacion">
                    Tasación (UF)
                  </label>
                  <input
                    id="eval-tasacion"
                    type="number"
                    value={evalTasacion}
                    onChange={(e) => setEvalTasacion(e.target.value)}
                    className="w-full bg-background border border-white/[0.15] rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1" htmlFor="eval-publicacion">
                    Publicación (UF)
                  </label>
                  <input
                    id="eval-publicacion"
                    type="number"
                    value={evalPublicacion}
                    onChange={(e) => setEvalPublicacion(e.target.value)}
                    className="w-full bg-background border border-white/[0.15] rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1" htmlFor="eval-ajuste">
                    Ajuste (UF)
                  </label>
                  <input
                    id="eval-ajuste"
                    type="number"
                    value={evalAjuste}
                    onChange={(e) => setEvalAjuste(e.target.value)}
                    className="w-full bg-background border border-white/[0.15] rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>
              </div>
              {diferenciaMercado !== null && (
                <p className="text-xs text-on-surface-variant">
                  Diferencia de mercado:{" "}
                  <span className={`font-bold ${diferenciaMercado >= 0 ? "text-tertiary" : "text-error"}`}>
                    {diferenciaMercado >= 0 ? "+" : ""}
                    UF {ufFormat.format(diferenciaMercado)}
                  </span>
                </p>
              )}
            </div>
          )}

          {lead?.propiedad_id && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Documentación</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 text-sm text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificadoCip}
                    onChange={(e) => setCertificadoCip(e.target.checked)}
                    className="accent-gold"
                  />
                  CIP
                </label>
                <label className="flex items-center gap-1.5 text-sm text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certificadoGravamenes}
                    onChange={(e) => setCertificadoGravamenes(e.target.checked)}
                    className="accent-gold"
                  />
                  Gravámenes
                </label>
                <label className="flex items-center gap-1.5 text-sm text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dominioVigente}
                    onChange={(e) => setDominioVigente(e.target.checked)}
                    className="accent-gold"
                  />
                  Dominio Vigente
                </label>
              </div>
            </div>
          )}

          {lead?.propiedad_id && (
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="drive-link">
                Carpeta de Drive
              </label>
              <div className="flex gap-2">
                <input
                  id="drive-link"
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors"
                />
                {driveLink && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 flex items-center justify-center px-3 rounded border border-white/15 text-on-surface-variant hover:text-gold hover:border-gold/40 transition-colors"
                    aria-label="Abrir carpeta de Drive"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="etapa">
              Etapa
            </label>
            <select
              id="etapa"
              value={etapa}
              onChange={(e) => setEtapa(e.target.value as EtapaCaptacion)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
            >
              {ALL_ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
