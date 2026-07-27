import { useEffect, useState } from "react";
import {
  ESTADO_PROPIEDAD_COLOR,
  ESTADO_PROPIEDAD_OPCIONES,
  diasEnMercado,
  type EstadoOferta,
  type EstadoPropiedad,
  type OfertaPropiedad,
  type PropertyItem,
  type VisitaPropiedad,
} from "../../hooks/useProperties";
import type { LeadItem, PropiedadResumen } from "../../hooks/useLeads";
import { FichaTecnicaTab } from "./FichaTecnicaTab";
import { FichaFinancieroTab } from "./FichaFinancieroTab";
import { FichaDocumentalTab } from "./FichaDocumentalTab";
import { FichaHistorialTab } from "./FichaHistorialTab";
import { MatchInteligentePanel } from "./MatchInteligentePanel";
import { CompartirFichaButton } from "./CompartirFichaButton";

interface EvalForm {
  valor_tasacion_uf: number | null;
  valor_publicacion_uf: number | null;
  valor_ajuste_uf: number | null;
}

interface Props {
  property: PropertyItem | null;
  valorUf: number | null;
  leads: LeadItem[];
  onClose: () => void;
  onNavigateCaptacion?: (leadId: number) => void;
  updateProperty: (id: string, changes: Partial<PropertyItem>) => Promise<void>;
  getEvaluacion: (propiedadUuid: string) => Promise<{ valor_tasacion_uf: number | null; valor_publicacion_uf: number | null; valor_ajuste_uf: number | null } | null>;
  saveEvaluacion: (propiedadUuid: string, values: EvalForm) => Promise<void>;
  getVisitas: (propiedadId: string) => Promise<VisitaPropiedad[]>;
  getOfertas: (propiedadId: string) => Promise<OfertaPropiedad[]>;
  addOferta: (propiedadId: string, input: { comprador_id: number | null; monto_ofertado_uf: number | null; medio_pago: string | null; notas: string | null }) => Promise<void>;
  updateOfertaEstado: (ofertaId: number, estado: EstadoOferta) => Promise<void>;
  sendBulkCampaign: (leads: LeadItem[], propiedad: PropiedadResumen, canal: "whatsapp" | "correo") => Promise<void>;
}

type Tab = "tecnica" | "financiero" | "documental" | "historial";

// `form` se inicializa como una copia completa de `property` (incluye campos calculados
// como propietario_nombre/propietario_telefono/lead_propietario_id que NO son columnas
// reales de propiedades_inventario) — enviar el objeto completo a updateProperty rompe
// el update con un 400 de PostgREST ("column does not exist"). Se filtra explícitamente
// a solo las columnas editables antes de guardar.
const EDITABLE_KEYS = [
  "titulo",
  "direccion",
  "comuna",
  "sector",
  "rol_sii",
  "latitud",
  "longitud",
  "tipo_propiedad",
  "tipo_negocio",
  "estado_propiedad",
  "precio_venta_uf",
  "precio_arriendo_clp",
  "area_construida",
  "area_terreno",
  "habitaciones",
  "banos",
  "estacionamientos",
  "bodegas",
  "gastos_comunes",
  "contribuciones",
  "margen_negociacion_uf",
  "fecha_publicacion",
  "link_carpeta_drive",
  "link_carpeta_legal",
  "link_google_maps",
  "link_tour_virtual",
  "link_portal_inmobiliario",
  "caracteristicas_clave",
  "certificado_cip",
  "certificado_gravamenes",
  "dominio_vigente",
  "mandato_exclusividad",
  "cedula_identidad_verificada",
] as const satisfies readonly (keyof PropertyItem)[];

function pickEditable(form: Partial<PropertyItem>): Partial<PropertyItem> {
  const out: Partial<PropertyItem> = {};
  for (const key of EDITABLE_KEYS) {
    if (key in form) (out as any)[key] = form[key];
  }
  return out;
}

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const clpFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "tecnica", label: "Ficha Técnica", icon: "description" },
  { id: "financiero", label: "Financiero", icon: "payments" },
  { id: "documental", label: "Documental", icon: "gavel" },
  { id: "historial", label: "Historial", icon: "history" },
];

export function PropiedadFichaModal({
  property,
  valorUf,
  leads,
  onClose,
  updateProperty,
  getEvaluacion,
  saveEvaluacion,
  getVisitas,
  getOfertas,
  addOferta,
  updateOfertaEstado,
  sendBulkCampaign,
}: Props) {
  const [tab, setTab] = useState<Tab>("tecnica");
  const [form, setForm] = useState<Partial<PropertyItem>>({});
  const [evalForm, setEvalForm] = useState<EvalForm>({ valor_tasacion_uf: null, valor_publicacion_uf: null, valor_ajuste_uf: null });
  const [visitas, setVisitas] = useState<VisitaPropiedad[]>([]);
  const [ofertas, setOfertas] = useState<OfertaPropiedad[]>([]);
  const [saving, setSaving] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);

  // Clave por id (no por referencia del objeto) — property es un dato fresco en cada
  // refresh(), y no queremos perder ediciones sin guardar solo porque otra parte del
  // hook se refrescó (misma lección ya documentada en CaptacionCardModal).
  useEffect(() => {
    if (!property) return;
    setForm({ ...property });
    setTab("tecnica");
    getEvaluacion(property.id).then((ev) =>
      setEvalForm({
        valor_tasacion_uf: ev?.valor_tasacion_uf ?? null,
        valor_publicacion_uf: ev?.valor_publicacion_uf ?? null,
        valor_ajuste_uf: ev?.valor_ajuste_uf ?? null,
      })
    );
    getVisitas(property.id).then(setVisitas);
    getOfertas(property.id).then(setOfertas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  if (!property) return null;

  const dias = diasEnMercado(property);
  const precioClp = form.precio_venta_uf && valorUf ? form.precio_venta_uf * valorUf : null;
  const compradores = leads.filter((l) => l.rol === "comprador");

  async function handleGuardar() {
    if (!property) return;
    setSaving(true);
    try {
      await updateProperty(property.id, pickEditable(form));
      await saveEvaluacion(property.id, evalForm);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10">
        <div className="p-5 border-b border-white/10 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">{form.titulo}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {[form.direccion, form.comuna].filter(Boolean).join(", ") || "Sin dirección"}
                {property.propietario_nombre && <> · Propietario: {property.propietario_nombre}</>}
              </p>
            </div>
            <button onClick={onClose} aria-label="Cerrar modal" className="text-on-surface-variant hover:text-gold transition-colors shrink-0">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={form.estado_propiedad ?? property.estado_propiedad}
              onChange={(e) => setForm((f) => ({ ...f, estado_propiedad: e.target.value as EstadoPropiedad }))}
              className={`text-xs font-bold rounded px-2.5 py-1 border-0 ${ESTADO_PROPIEDAD_COLOR[(form.estado_propiedad as EstadoPropiedad) ?? property.estado_propiedad]}`}
            >
              {ESTADO_PROPIEDAD_OPCIONES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {form.precio_venta_uf && (
              <span className="text-sm font-bold text-gold">
                UF {ufFormat.format(form.precio_venta_uf)}
                {precioClp && <span className="text-on-surface-variant font-normal"> (${clpFormat.format(precioClp)})</span>}
              </span>
            )}
            {dias != null && (
              <span className={`text-xs ${dias > 90 ? "text-error font-bold" : dias > 60 ? "text-gold font-bold" : "text-on-surface-variant"}`}>
                {dias} días en el mercado
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-white/10 shrink-0 px-5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-4 py-3 border-b-2 transition-colors ${
                    tab === t.id ? "border-gold text-gold" : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {tab === "tecnica" && <FichaTecnicaTab form={form} onChange={(c) => setForm((f) => ({ ...f, ...c }))} />}
              {tab === "financiero" && (
                <FichaFinancieroTab
                  form={form}
                  onChange={(c) => setForm((f) => ({ ...f, ...c }))}
                  evalForm={evalForm}
                  onEvalChange={(c) => setEvalForm((f) => ({ ...f, ...c }))}
                  valorUf={valorUf}
                />
              )}
              {tab === "documental" && <FichaDocumentalTab form={form} onChange={(c) => setForm((f) => ({ ...f, ...c }))} />}
              {tab === "historial" && (
                <FichaHistorialTab
                  visitas={visitas}
                  ofertas={ofertas}
                  compradores={compradores}
                  onAddOferta={async (input) => {
                    await addOferta(property.id, input);
                    setOfertas(await getOfertas(property.id));
                  }}
                  onUpdateOfertaEstado={async (id, estado) => {
                    await updateOfertaEstado(id, estado);
                    setOfertas(await getOfertas(property.id));
                  }}
                />
              )}
            </div>
            <div className="p-4 border-t border-white/10 shrink-0 flex justify-end">
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="bg-gold text-primary-container font-bold text-xs uppercase tracking-widest py-2.5 px-6 rounded hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          <div className="w-56 border-l border-white/10 p-4 space-y-3 shrink-0">
            <button
              onClick={() => setMatchOpen(true)}
              className="w-full bg-gold text-primary-container font-bold text-xs uppercase tracking-widest py-2.5 rounded hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Match Inteligente
            </button>
            <CompartirFichaButton property={{ ...property, ...form } as PropertyItem} valorUf={valorUf} />
          </div>
        </div>
      </div>

      <MatchInteligentePanel
        open={matchOpen}
        property={{ ...property, ...form } as PropertyItem}
        leads={leads}
        onClose={() => setMatchOpen(false)}
        onSend={sendBulkCampaign}
      />
    </div>
  );
}
