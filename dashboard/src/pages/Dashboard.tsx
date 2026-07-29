import { StatCard } from "../components/StatCard";
import { PerformanceChart } from "../components/PerformanceChart";
import { ActivityFeed } from "../components/ActivityFeed";
import { RecentLeadsTable } from "../components/RecentLeadsTable";
import { useContactos } from "../hooks/useContactos";
import type { Contacto, EstadoWorkflow } from "../lib/mockData";
import { bucketPorMes, formatDelta } from "../lib/deltas";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function countByStage(contactos: { estado_workflow: EstadoWorkflow }[], stage: EstadoWorkflow) {
  return contactos.filter((c) => c.estado_workflow === stage).length;
}

// Tendencia mes vs mes anterior — usa fecha_ingreso (la vista vista_progreso_leads
// ya la expone) como proxy del mes en que ocurrió cada fila, ver lib/deltas.ts.
function deltaConteo(contactos: Contacto[], stage: EstadoWorkflow) {
  const filas = contactos.filter((c) => c.estado_workflow === stage);
  return formatDelta(bucketPorMes(filas, (c) => c.fecha_ingreso));
}

export function Dashboard() {
  const { contactos, loading, error } = useContactos();

  const cerrados = contactos.filter((c) => c.estado_workflow === "Cerrado Ganado" && c.precio_venta_uf);
  const ingresosCerrados = cerrados.reduce((sum, c) => sum + (c.precio_venta_uf ?? 0), 0);
  const deltaIngresos = formatDelta(bucketPorMes(cerrados, (c) => c.fecha_ingreso, (c) => c.precio_venta_uf ?? 0));

  const stats = [
    { label: "Ingresos Cerrados (UF)", value: `UF ${ufFormat.format(ingresosCerrados)}`, icon: "payments", ...deltaIngresos },
    { label: "Nuevos", value: String(countByStage(contactos, "Nuevo")), icon: "person_add", ...deltaConteo(contactos, "Nuevo") },
    { label: "Contactados", value: String(countByStage(contactos, "Contactado")), icon: "call", ...deltaConteo(contactos, "Contactado") },
    {
      label: "Negociación",
      value: String(countByStage(contactos, "Negociación")),
      icon: "handshake",
      ...deltaConteo(contactos, "Negociación"),
    },
    {
      label: "Cerrados",
      value: String(countByStage(contactos, "Cerrado Ganado")),
      icon: "task_alt",
      ...deltaConteo(contactos, "Cerrado Ganado"),
    },
  ];

  return (
    <>
      <div>
        <h1 className="font-headline-lg text-2xl font-bold text-white">Resumen del Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Bienvenido de nuevo, aquí está el estado de tu negocio.</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-4">
          No se pudieron cargar los contactos: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart />
        <ActivityFeed />
      </div>

      <RecentLeadsTable contactos={contactos} loading={loading} />
    </>
  );
}
