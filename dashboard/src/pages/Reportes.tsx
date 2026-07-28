import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { StatCard } from "../components/StatCard";
import { useLeads, ETAPA_ORDEN, estaEnfriando, type LeadRol } from "../hooks/useLeads";
import { useCaptaciones, PARKING_ETAPAS } from "../hooks/useCaptaciones";
import { useProperties, diasEnMercado, type EstadoPropiedad } from "../hooks/useProperties";
import { useActivitiesBoard, DONE_COLUMN_ID } from "../hooks/useActivitiesBoard";

// Mismo estilo ya usado en PerformanceChart.tsx — un solo color (gold, el acento de
// esta app) para gráficos de una sola serie: no hay identidad categórica que
// distinguir con más de un color, solo una magnitud (cantidad) por categoría.
const GOLD = "#FFD700";
const GRID_STROKE = "#282a2b";
const AXIS_STROKE = "#c5c6cd";
const TOOLTIP_STYLE = {
  contentStyle: { background: "#1d2021", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "#e1e3e4" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const dias = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(dias);
}

function sumUf(valores: (number | null)[]): number {
  return valores.reduce((sum: number, v) => sum + (v ?? 0), 0);
}

// Mismo patrón ya usado en Propiedades.tsx — se duplica en vez de compartir porque
// es un fetch de solo lectura sin mutación, sin riesgo de quedar desincronizado
// entre páginas (a diferencia del bug de instancias duplicadas de useActivitiesBoard
// ya corregido en Calendario.tsx).
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

function ReportSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-gold uppercase tracking-wide">{titulo}</h2>
      {children}
    </div>
  );
}

export function Reportes() {
  const { leads, loading: loadingLeads } = useLeads();
  const { leads: captaciones, loading: loadingCaptaciones } = useCaptaciones();
  const { properties, loading: loadingProperties } = useProperties();
  const { cards, loading: loadingActividades } = useActivitiesBoard();
  const valorUf = useValorUf();

  const loading = loadingLeads || loadingCaptaciones || loadingProperties || loadingActividades;

  // 1. Resumen Operativo
  const leadsPorRol = useMemo(() => {
    const base: Record<LeadRol, number> = { vendedor: 0, comprador: 0, arrendatario: 0 };
    for (const l of leads) if (!l.archivado) base[l.rol]++;
    return base;
  }, [leads]);

  const captacionesActivas = useMemo(() => captaciones.filter((c) => !PARKING_ETAPAS.includes(c.etapa_captacion)), [captaciones]);
  const pipelineActivoUf = useMemo(
    () => sumUf(captacionesActivas.map((c) => c.valor_publicacion_uf ?? c.valor_tasacion_uf)),
    [captacionesActivas]
  );

  const propiedadesPorEstado = useMemo(() => {
    const map = new Map<EstadoPropiedad, number>();
    for (const p of properties) map.set(p.estado_propiedad, (map.get(p.estado_propiedad) ?? 0) + 1);
    return map;
  }, [properties]);

  // 2. Alertas de Seguimiento
  const leadsEnfriando = useMemo(() => leads.filter((l) => !l.archivado && estaEnfriando(l)).length, [leads]);
  const captacionesEstancadas = useMemo(
    () =>
      captacionesActivas.filter((c) => {
        const dias = daysSince(c.etapa_captacion_changed_at);
        return c.etapa_captacion === "Prospección" && dias !== null && dias > 5;
      }).length,
    [captacionesActivas]
  );
  const actividadesVencidas = useMemo(
    () =>
      cards.filter((c) => c.column_id !== DONE_COLUMN_ID && c.scheduled_at && new Date(c.scheduled_at).getTime() < Date.now()).length,
    [cards]
  );

  // 3. Tiempo en Etapa de Captación
  const tiempoPorEtapa = useMemo(
    () =>
      captacionesActivas
        .map((c) => ({ nombre: c.nombre_dueno, etapa: c.etapa_captacion, dias: daysSince(c.etapa_captacion_changed_at) }))
        .sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0)),
    [captacionesActivas]
  );

  // 4. Embudo de Conversión — combina los 3 roles, una sola serie (cantidad) por etapa
  const embudoData = useMemo(
    () =>
      ETAPA_ORDEN.map((etapa) => ({
        etapa,
        cantidad: leads.filter((l) => !l.archivado && l.estado_workflow === etapa).length,
      })),
    [leads]
  );
  const hayDatosEmbudo = embudoData.some((d) => d.cantidad > 0);

  // 5. Fuente de Leads — contactos.origen (mapeado como `fuente` en LeadItem)
  const origenData = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      if (l.archivado) continue;
      const clave = l.fuente ?? "Sin origen registrado";
      map.set(clave, (map.get(clave) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([origen, cantidad]) => ({ origen, cantidad }));
  }, [leads]);
  const sinOrigenPct =
    leads.length > 0 ? Math.round(((origenData.find((d) => d.origen === "Sin origen registrado")?.cantidad ?? 0) / leads.length) * 100) : 0;

  // 6. Cierres y Rendimiento del Portafolio
  const propiedadesCerradas = useMemo(
    () => properties.filter((p) => p.estado_propiedad === "Vendida" || p.estado_propiedad === "En Arriendo"),
    [properties]
  );
  const cerradasUf = sumUf(propiedadesCerradas.map((p) => p.precio_venta_uf));

  const domPromedio = useMemo(() => {
    const dias = properties.filter((p) => p.fecha_publicacion).map((p) => diasEnMercado(p) ?? 0);
    if (dias.length === 0) return null;
    return Math.round(dias.reduce((s, d) => s + d, 0) / dias.length);
  }, [properties]);

  const capRatePromedio = useMemo(() => {
    if (!valorUf) return null;
    const tasas = properties
      .filter((p) => p.precio_venta_uf && p.precio_arriendo_clp)
      .map((p) => {
        const noiAnual = (p.precio_arriendo_clp ?? 0) * 12 - (p.gastos_comunes ?? 0) * 12 - (p.contribuciones ?? 0);
        const precioVentaClp = (p.precio_venta_uf ?? 0) * valorUf;
        return precioVentaClp > 0 ? (noiAnual / precioVentaClp) * 100 : null;
      })
      .filter((v): v is number => v !== null);
    if (tasas.length === 0) return null;
    return tasas.reduce((s, v) => s + v, 0) / tasas.length;
  }, [properties, valorUf]);

  if (loading) {
    return <p className="text-on-surface-variant text-sm">Cargando reportes...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-lg text-2xl font-bold text-white">Reportes</h1>
        <p className="text-sm text-on-surface-variant mt-1">Estado operativo del negocio a partir de los datos reales del CRM.</p>
      </div>

      <ReportSection titulo="Resumen Operativo">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Vendedores activos" value={String(leadsPorRol.vendedor)} icon="sell" />
          <StatCard label="Compradores activos" value={String(leadsPorRol.comprador)} icon="shopping_cart" />
          <StatCard label="Arrendatarios activos" value={String(leadsPorRol.arrendatario)} icon="key" />
          <StatCard label="Pipeline Captaciones (activo)" value={`UF ${ufFormat.format(pipelineActivoUf)}`} icon="payments" />
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant pt-1">
          {Array.from(propiedadesPorEstado.entries()).map(([estado, cantidad]) => (
            <span key={estado} className="bg-surface-container-high rounded px-3 py-1.5">
              {cantidad} {estado}
            </span>
          ))}
          {properties.length === 0 && <span>Sin propiedades registradas todavía.</span>}
        </div>
      </ReportSection>

      <ReportSection titulo="Alertas de Seguimiento">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Leads sin seguimiento" value={String(leadsEnfriando)} icon="warning" />
          <StatCard label="Captaciones estancadas" value={String(captacionesEstancadas)} icon="hourglass_top" />
          <StatCard label="Actividades vencidas" value={String(actividadesVencidas)} icon="event_busy" />
        </div>
      </ReportSection>

      <ReportSection titulo="Tiempo en Etapa de Captación">
        {tiempoPorEtapa.length === 0 ? (
          <p className="text-sm text-on-surface-variant/60">Sin captaciones activas.</p>
        ) : (
          <div className="bg-surface border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-on-surface-variant text-xs uppercase tracking-wide">
                  <th className="py-2.5 px-4">Propietario</th>
                  <th className="py-2.5 px-4">Etapa</th>
                  <th className="py-2.5 px-4">Días en la etapa</th>
                </tr>
              </thead>
              <tbody>
                {tiempoPorEtapa.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 px-4 text-on-surface">{row.nombre}</td>
                    <td className="py-2.5 px-4 text-on-surface-variant">{row.etapa}</td>
                    <td className={`py-2.5 px-4 font-bold ${(row.dias ?? 0) > 5 ? "text-error" : "text-on-surface"}`}>
                      {row.dias ?? "—"}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      <ReportSection titulo="Embudo de Conversión">
        {!hayDatosEmbudo ? (
          <p className="text-sm text-on-surface-variant/60">Sin leads registrados todavía.</p>
        ) : (
          <div className="bg-surface-container border border-white/5 rounded-lg p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={embudoData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke={AXIS_STROKE} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="etapa"
                    stroke={AXIS_STROKE}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="cantidad" name="Leads" fill={GOLD} radius={[0, 4, 4, 0]} barSize={18}>
                    <LabelList dataKey="cantidad" position="right" style={{ fill: "#e1e3e4", fontSize: 12, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </ReportSection>

      <ReportSection titulo="Fuente de Leads">
        <div className="bg-surface-container border border-white/5 rounded-lg p-5">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origenData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke={AXIS_STROKE} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="origen"
                  stroke={AXIS_STROKE}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="cantidad" name="Leads" fill={GOLD} radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList dataKey="cantidad" position="right" style={{ fill: "#e1e3e4", fontSize: 12, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {sinOrigenPct > 0 && (
            <p className="text-xs text-on-surface-variant/70 mt-2">
              {sinOrigenPct}% de los leads todavía no tiene un origen registrado — este reporte se vuelve más útil a medida que se
              complete ese campo al crear nuevos leads.
            </p>
          )}
        </div>
      </ReportSection>

      <ReportSection titulo="Cierres y Rendimiento del Portafolio">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Vendidas / arrendadas"
            value={propiedadesCerradas.length > 0 ? `${propiedadesCerradas.length} (UF ${ufFormat.format(cerradasUf)})` : "—"}
            icon="sell"
          />
          <StatCard label="DOM promedio" value={domPromedio !== null ? `${domPromedio}d` : "—"} icon="schedule" />
          <StatCard label="Cap Rate promedio" value={capRatePromedio !== null ? `${capRatePromedio.toFixed(1)}%` : "—"} icon="percent" />
        </div>
        {propiedadesCerradas.length === 0 && (
          <p className="text-xs text-on-surface-variant/70">
            Todavía no hay cierres reales registrados — este panel se completa solo a medida que se marquen propiedades como
            "Vendida" o "En Arriendo".
          </p>
        )}
      </ReportSection>
    </div>
  );
}
