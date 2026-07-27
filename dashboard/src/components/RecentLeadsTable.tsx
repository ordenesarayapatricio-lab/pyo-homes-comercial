import { estadoWorkflowColor, type Contacto } from "../lib/mockData";

const dateFormat = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" });
const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

interface Props {
  contactos: Contacto[];
  loading: boolean;
}

export function RecentLeadsTable({ contactos, loading }: Props) {
  return (
    <div className="bg-surface-container border border-white/5 rounded-lg p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-base font-bold text-white">Contactos Recientes</h3>
        <button className="text-xs font-bold text-gold flex items-center gap-1 hover:underline">
          Ver todos
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-on-surface-variant border-b border-white/10">
              <th className="font-medium py-2 pr-4">Contacto</th>
              <th className="font-medium py-2 pr-4">Propiedad</th>
              <th className="font-medium py-2 pr-4">Etapa</th>
              <th className="font-medium py-2 pr-4">Valor (UF)</th>
              <th className="font-medium py-2 pr-4">Último contacto</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  Cargando contactos...
                </td>
              </tr>
            )}
            {!loading && contactos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  Todavía no hay contactos registrados.
                </td>
              </tr>
            )}
            {contactos.slice(0, 8).map((contacto) => (
              <tr key={contacto.contacto_id} className="border-b border-white/5 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-gold shrink-0">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                    </div>
                    <span className="text-on-surface font-medium whitespace-nowrap">{contacto.nombre}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-on-surface-variant whitespace-nowrap">
                  {contacto.direccion ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${estadoWorkflowColor[contacto.estado_workflow]}`}
                  >
                    {contacto.estado_workflow}
                  </span>
                </td>
                <td className="py-3 pr-4 text-on-surface whitespace-nowrap">
                  {contacto.precio_venta_uf ? `UF ${ufFormat.format(contacto.precio_venta_uf)}` : "—"}
                </td>
                <td className="py-3 pr-4 text-on-surface-variant whitespace-nowrap">
                  {contacto.ultima_fecha_contacto
                    ? `${dateFormat.format(new Date(contacto.ultima_fecha_contacto))}${contacto.ultimo_canal ? ` — ${contacto.ultimo_canal}` : ""}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
