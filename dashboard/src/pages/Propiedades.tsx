import { useEffect, useState } from "react";
import { useProperties, diasEnMercado, ESTADO_PROPIEDAD_COLOR, type PropertyItem } from "../hooks/useProperties";
import { useLeads } from "../hooks/useLeads";
import { PropiedadCreateModal } from "../components/propiedades/PropiedadCreateModal";
import { PropiedadFichaModal } from "../components/propiedades/PropiedadFichaModal";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const clpFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function useValorUf() {
  const [valorUf, setValorUf] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/uf-hoy")
      .then((r) => r.json())
      .then((data) => setValorUf(data?.valor ?? null))
      .catch(() => setValorUf(null));
  }, []);
  return valorUf;
}

function DomBadge({ property }: { property: PropertyItem }) {
  const dias = diasEnMercado(property);
  if (dias == null) return <span className="text-on-surface-variant/40 text-xs">—</span>;
  const color = dias > 90 ? "text-error font-bold" : dias > 60 ? "text-gold font-bold" : "text-on-surface-variant";
  return <span className={`text-xs ${color}`}>{dias} días</span>;
}

export function Propiedades() {
  const {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    getEvaluacion,
    saveEvaluacion,
    getVisitas,
    getOfertas,
    addOferta,
    updateOfertaEstado,
  } = useProperties();
  const { leads, sendBulkCampaign } = useLeads();
  const valorUf = useValorUf();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = properties.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-white">Propiedades</h1>
          <p className="text-sm text-on-surface-variant mt-1">Ficha técnica, financiera y documental de cada activo.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-gold text-primary-container font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded hover:bg-gold/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Propiedad
        </button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-4 mt-4">
          No se pudieron cargar las propiedades: {error}
        </div>
      )}

      <div className="bg-surface border border-white/5 rounded-lg overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-on-surface-variant text-xs uppercase tracking-wide">
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Propiedad</th>
              <th className="py-3 px-4">Propietario</th>
              <th className="py-3 px-4">Precio</th>
              <th className="py-3 px-4">DOM</th>
              <th className="py-3 px-4">Dorm./Baños/m²</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-on-surface-variant text-sm">
                  Cargando propiedades...
                </td>
              </tr>
            )}
            {!loading && properties.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-on-surface-variant text-sm">
                  Todavía no hay propiedades.
                </td>
              </tr>
            )}
            {!loading &&
              properties.map((p) => {
                const precioClp = p.precio_venta_uf && valorUf ? p.precio_venta_uf * valorUf : null;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${ESTADO_PROPIEDAD_COLOR[p.estado_propiedad]}`}>
                        {p.estado_propiedad}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-on-surface font-medium">{p.titulo}</div>
                      <div className="text-on-surface-variant text-xs">
                        {[p.direccion, p.comuna].filter(Boolean).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-xs">{p.propietario_nombre ?? "—"}</td>
                    <td className="py-3 px-4 text-xs">
                      {p.precio_venta_uf ? (
                        <>
                          <div className="text-on-surface font-medium">UF {ufFormat.format(p.precio_venta_uf)}</div>
                          {precioClp && <div className="text-on-surface-variant">${clpFormat.format(precioClp)}</div>}
                        </>
                      ) : (
                        <span className="text-on-surface-variant/40">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <DomBadge property={p} />
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-xs whitespace-nowrap">
                      {p.habitaciones ?? "—"}D · {p.banos ?? "—"}B · {p.area_construida ?? "—"}m²
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <PropiedadCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (input) => {
          await createProperty(input);
          setCreateOpen(false);
        }}
      />

      <PropiedadFichaModal
        property={selected}
        valorUf={valorUf}
        leads={leads}
        onClose={() => setSelectedId(null)}
        updateProperty={updateProperty}
        getEvaluacion={getEvaluacion}
        saveEvaluacion={saveEvaluacion}
        getVisitas={getVisitas}
        getOfertas={getOfertas}
        addOferta={addOferta}
        updateOfertaEstado={updateOfertaEstado}
        sendBulkCampaign={sendBulkCampaign}
      />
    </>
  );
}
