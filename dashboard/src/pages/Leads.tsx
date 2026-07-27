import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLeads, scoreRatio, ZONAS_COMUNES, ETAPA_ORDEN, type LeadRol, type LeadItem, type PropiedadResumen } from "../hooks/useLeads";
import { LeadRow } from "../components/leads/LeadRow";
import { LeadDetailModal, type LeadChanges } from "../components/leads/LeadDetailModal";
import { LeadCreateModal } from "../components/leads/LeadCreateModal";
import { BulkSendModal } from "../components/leads/BulkSendModal";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" });

const FILTROS: { id: LeadRol | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "vendedor", label: "Vendedores" },
  { id: "comprador", label: "Compradores" },
  { id: "arrendatario", label: "Arrendatarios" },
];

type NivelFiltro = "todas" | "alta" | "media" | "baja";
type SortBy = "calificacion" | "etapa" | "actualizacion" | null;
const LEADS_POR_PAGINA = 20;

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function Leads() {
  const navigate = useNavigate();
  const {
    leads,
    loading,
    error,
    updateEstado,
    updateComprador,
    updateArrendatario,
    updateContactoEmail,
    updateArchivado,
    deleteLead,
    promoverAVendedor,
    createLead,
    sendBulkCampaign,
  } = useLeads();
  const [filtroRol, setFiltroRol] = useState<LeadRol | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [presupuestoMin, setPresupuestoMin] = useState("");
  const [presupuestoMax, setPresupuestoMax] = useState("");
  const [zonaFiltro, setZonaFiltro] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<NivelFiltro>("todas");
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);
  const [modalLeadKey, setModalLeadKey] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // El botón "+ Nuevo Lead" del Topbar (global, visible en todas las páginas) navega
  // aquí con ?nuevo=1 para abrir este modal directamente, en vez de duplicar la lógica
  // de creación en el layout.
  useEffect(() => {
    if (searchParams.has("nuevo")) {
      setCreateOpen(true);
      setSearchParams((params) => {
        params.delete("nuevo");
        return params;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const modalLead = leads.find((l) => l.key === modalLeadKey) ?? null;

  const counts = useMemo(() => {
    const base: Record<LeadRol, number> = { vendedor: 0, comprador: 0, arrendatario: 0 };
    leads.forEach((l) => base[l.rol]++);
    return base;
  }, [leads]);

  const poderCompra = useMemo(
    () =>
      leads
        .filter((l) => l.rol === "comprador")
        .reduce((sum, l) => sum + (l.valor_negociacion_uf ?? l.presupuesto_uf_num ?? 0), 0),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const min = presupuestoMin ? Number(presupuestoMin) : null;
    const max = presupuestoMax ? Number(presupuestoMax) : null;
    return leads.filter((l) => {
      if (!mostrarArchivados && l.archivado) return false;
      if (filtroRol !== "todos" && l.rol !== filtroRol) return false;
      if (q && !l.nombre.toLowerCase().includes(q) && !l.telefono.includes(q)) return false;
      if ((min != null || max != null) && (l.presupuesto_uf_num == null || (min != null && l.presupuesto_uf_num < min) || (max != null && l.presupuesto_uf_num > max))) {
        return false;
      }
      if (zonaFiltro && !(l.zona_interes ?? "").includes(zonaFiltro)) return false;
      if (nivelFiltro !== "todas") {
        const ratio = scoreRatio(l);
        if (ratio == null) return false;
        if (nivelFiltro === "alta" && ratio < 0.66) return false;
        if (nivelFiltro === "media" && (ratio < 0.33 || ratio >= 0.66)) return false;
        if (nivelFiltro === "baja" && ratio >= 0.33) return false;
      }
      return true;
    });
  }, [leads, filtroRol, busqueda, presupuestoMin, presupuestoMax, zonaFiltro, nivelFiltro, mostrarArchivados]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    const copia = [...filtered];
    copia.sort((a, b) => {
      if (sortBy === "calificacion") {
        const ra = scoreRatio(a) ?? -1;
        const rb = scoreRatio(b) ?? -1;
        return (ra - rb) * dir;
      }
      if (sortBy === "etapa") {
        const ia = ETAPA_ORDEN.indexOf(a.estado_workflow);
        const ib = ETAPA_ORDEN.indexOf(b.estado_workflow);
        return (ia - ib) * dir;
      }
      // actualizacion
      return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
    });
    return copia;
  }, [filtered, sortBy, sortDir]);

  // Cualquier cambio de filtro/orden vuelve a la página 1 — evita quedar en una
  // página vacía si el nuevo filtro tiene menos resultados.
  useEffect(() => {
    setPagina(1);
  }, [filtroRol, busqueda, presupuestoMin, presupuestoMax, zonaFiltro, nivelFiltro, mostrarArchivados, sortBy, sortDir]);

  const totalPaginas = Math.max(1, Math.ceil(sorted.length / LEADS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginado = sorted.slice((paginaSegura - 1) * LEADS_POR_PAGINA, paginaSegura * LEADS_POR_PAGINA);

  function handleSort(columna: NonNullable<SortBy>) {
    if (sortBy === columna) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columna);
      setSortDir("desc");
    }
  }

  function sortIcon(columna: NonNullable<SortBy>) {
    if (sortBy !== columna) {
      // Ícono sutil (↕) para dejar claro que la columna es clicable, aun sin ser
      // la que ordena actualmente.
      return <span className="material-symbols-outlined text-[14px] align-middle text-on-surface-variant/40">unfold_more</span>;
    }
    return <span className="material-symbols-outlined text-[14px] align-middle text-gold">{sortDir === "asc" ? "arrow_upward" : "arrow_downward"}</span>;
  }

  const seleccionados = useMemo(() => sorted.filter((l) => selected.has(l.key)), [sorted, selected]);
  const todosVisiblesSeleccionados = paginado.length > 0 && paginado.every((l) => selected.has(l.key));

  function toggleSeleccionTodos() {
    setSelected((prev) => {
      if (todosVisiblesSeleccionados) {
        const next = new Set(prev);
        paginado.forEach((l) => next.delete(l.key));
        return next;
      }
      const next = new Set(prev);
      paginado.forEach((l) => next.add(l.key));
      return next;
    });
  }

  function toggleSeleccion(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSaveLead(changes: LeadChanges) {
    if (!modalLead) return;
    if (changes.estado_workflow && changes.estado_workflow !== modalLead.estado_workflow) {
      await updateEstado(modalLead, changes.estado_workflow);
    }
    if (modalLead.origen === "candidatos_arriendo") {
      await updateArrendatario(modalLead, {
        ingreso_mensual: changes.ingreso_mensual,
        complementa_renta: changes.complementa_renta,
        estado_calificacion: changes.estado_calificacion,
      });
    } else if (modalLead.origen === "leads_compradores") {
      await updateComprador(modalLead, {
        presupuesto_uf: changes.presupuesto_uf,
        valor_negociacion_uf: changes.valor_negociacion_uf,
        zona_interes: changes.zona_interes,
        tipo_operacion: changes.tipo_operacion,
        necesidades_clave: changes.necesidades_clave,
        nivel_calificacion: changes.nivel_calificacion,
      });
    }
    setModalLeadKey(null);
  }

  async function handleSaveEmail(email: string | null) {
    if (!modalLead) return;
    await updateContactoEmail(modalLead, email);
  }

  async function handleCreate(input: Parameters<typeof createLead>[0]) {
    await createLead(input);
    setCreateOpen(false);
  }

  async function handleBulkSend(propiedad: PropiedadResumen, canal: "whatsapp" | "correo") {
    await sendBulkCampaign(seleccionados, propiedad, canal);
  }

  async function handleMoverACaptaciones(lead: LeadItem) {
    await promoverAVendedor(lead);
    navigate("/captaciones");
  }

  function handleExportCsv() {
    const headers = ["Nombre", "Teléfono", "Correo", "Tipo", "Etapa", "Calificación", "Detalle", "Origen", "Asignado a", "Última actualización"];
    const rows = sorted.map((l) => {
      const calificacion = l.urgencia_venta ?? l.nivel_calificacion ?? l.estado_calificacion ?? "";
      const detalle =
        l.rol === "vendedor"
          ? [l.direccion, l.valor_publicacion_uf ?? l.valor_tasacion_uf].filter(Boolean).join(" / ")
          : l.origen === "candidatos_arriendo"
            ? l.ingreso_mensual != null
              ? `Ingreso $${l.ingreso_mensual}/mes`
              : ""
            : [l.zona_interes, l.valor_negociacion_uf ?? l.presupuesto_uf].filter(Boolean).join(" / ");
      return [
        l.nombre,
        l.telefono,
        l.email ?? "",
        l.rol,
        l.estado_workflow,
        String(calificacion),
        detalle,
        l.fuente ?? "",
        l.asignado_a ?? "",
        l.updated_at ? dateFormat.format(new Date(l.updated_at)) : "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Feed unificado de contactos — vendedores, compradores y arrendatarios en un solo lugar. Usa "+ Nuevo Lead" arriba para
            agregar uno.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-4 mt-4">
          No se pudo cargar Leads: {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface-container border border-white/5 rounded-lg px-5 py-3.5 my-4 text-sm text-on-surface-variant">
        <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70">Resumen</span>
        <span>
          <b className="text-gold font-bold">{counts.vendedor}</b> vendedores
        </span>
        <span className="w-px h-5 bg-white/10" />
        <span>
          <b className="text-gold font-bold">{counts.comprador}</b> compradores
        </span>
        <span className="w-px h-5 bg-white/10" />
        <span>
          <b className="text-gold font-bold">{counts.arrendatario}</b> arrendatarios
        </span>
        <span className="w-px h-5 bg-white/10" />
        <span>
          <b className="text-gold font-bold">UF {ufFormat.format(poderCompra)}</b> poder de compra estimado
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1 bg-surface-container border border-white/5 rounded-lg p-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroRol(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                filtroRol === f.id ? "bg-gold text-primary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f.label}
              <span className="opacity-70">{f.id === "todos" ? leads.length : counts[f.id as LeadRol]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full bg-surface-container border border-white/10 rounded pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-white/10 text-xs font-bold text-on-surface-variant hover:text-gold hover:border-gold/40 transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 bg-surface-container/60 border border-white/5 rounded-lg px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70">Filtros avanzados</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={presupuestoMin}
            onChange={(e) => setPresupuestoMin(e.target.value)}
            placeholder="UF mín"
            className="w-24 bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-gold/60"
          />
          <span className="text-on-surface-variant text-xs">–</span>
          <input
            type="number"
            value={presupuestoMax}
            onChange={(e) => setPresupuestoMax(e.target.value)}
            placeholder="UF máx"
            className="w-24 bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-gold/60"
          />
        </div>
        <select
          value={zonaFiltro}
          onChange={(e) => setZonaFiltro(e.target.value)}
          className="bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-gold/60"
        >
          <option value="">Todas las zonas</option>
          {ZONAS_COMUNES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <select
          value={nivelFiltro}
          onChange={(e) => setNivelFiltro(e.target.value as NivelFiltro)}
          className="bg-background border border-white/10 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-gold/60"
        >
          <option value="todas">Cualquier calificación</option>
          <option value="alta">Calificación alta</option>
          <option value="media">Calificación media</option>
          <option value="baja">Calificación baja</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer">
          <input
            type="checkbox"
            checked={mostrarArchivados}
            onChange={(e) => setMostrarArchivados(e.target.checked)}
            className="accent-gold"
          />
          Mostrar archivados
        </label>
        {(presupuestoMin || presupuestoMax || zonaFiltro || nivelFiltro !== "todas") && (
          <button
            onClick={() => {
              setPresupuestoMin("");
              setPresupuestoMax("");
              setZonaFiltro("");
              setNivelFiltro("todas");
            }}
            className="text-xs font-bold text-gold hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-gold/10 border border-gold/30 rounded-lg px-4 py-3">
          <span className="text-sm font-bold text-gold">{selected.size} seleccionados</span>
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-1.5 bg-gold text-primary-container font-bold text-xs uppercase tracking-widest py-2 px-4 rounded hover:bg-gold/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Enviar Propiedad
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs font-bold text-on-surface-variant hover:text-on-surface">
            Cancelar selección
          </button>
        </div>
      )}

      <div className="bg-surface-container border border-white/5 rounded-lg p-5 md:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-on-surface-variant border-b border-white/10">
                <th className="py-2 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={todosVisiblesSeleccionados}
                    onChange={toggleSeleccionTodos}
                    className="accent-gold"
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="font-medium py-2 pr-4">Nombre y contacto</th>
                <th className="font-medium py-2 pr-4">Tipo</th>
                <th className="font-medium py-2 pr-4 cursor-pointer select-none hover:text-on-surface" onClick={() => handleSort("calificacion")}>
                  Calificación {sortIcon("calificacion")}
                </th>
                <th className="font-medium py-2 pr-4">Detalle</th>
                <th className="font-medium py-2 pr-4 cursor-pointer select-none hover:text-on-surface" onClick={() => handleSort("etapa")}>
                  Etapa {sortIcon("etapa")}
                </th>
                <th
                  className="font-medium py-2 pr-4 cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort("actualizacion")}
                >
                  Últ. actualización {sortIcon("actualizacion")}
                </th>
                <th className="font-medium py-2 pl-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-on-surface-variant">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && paginado.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-on-surface-variant">
                    No hay leads que coincidan con el filtro.
                  </td>
                </tr>
              )}
              {!loading &&
                paginado.map((lead: LeadItem) => (
                  <LeadRow
                    key={lead.key}
                    lead={lead}
                    onClick={() => setModalLeadKey(lead.key)}
                    selected={selected.has(lead.key)}
                    onToggleSelect={() => toggleSeleccion(lead.key)}
                    onArchivar={() => updateArchivado(lead, true)}
                    onDesarchivar={() => updateArchivado(lead, false)}
                    onEliminar={() => deleteLead(lead)}
                    onMoverACaptaciones={() => handleMoverACaptaciones(lead)}
                  />
                ))}
            </tbody>
          </table>
        </div>
        {!loading && sorted.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs text-on-surface-variant">
            <span>
              Mostrando {(paginaSegura - 1) * LEADS_POR_PAGINA + 1}-{Math.min(paginaSegura * LEADS_POR_PAGINA, sorted.length)} de{" "}
              {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={paginaSegura <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded border border-white/10 font-bold hover:text-gold hover:border-gold/40 transition-colors disabled:opacity-30 disabled:hover:text-on-surface-variant disabled:hover:border-white/10"
              >
                Anterior
              </button>
              <span>
                Página {paginaSegura} de {totalPaginas}
              </span>
              <button
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="px-2.5 py-1.5 rounded border border-white/10 font-bold hover:text-gold hover:border-gold/40 transition-colors disabled:opacity-30 disabled:hover:text-on-surface-variant disabled:hover:border-white/10"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <LeadDetailModal
        open={!!modalLead}
        lead={modalLead}
        onClose={() => setModalLeadKey(null)}
        onSave={handleSaveLead}
        onSaveEmail={handleSaveEmail}
      />
      <LeadCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <BulkSendModal open={bulkOpen} leads={seleccionados} onClose={() => setBulkOpen(false)} onSend={handleBulkSend} />
    </>
  );
}
