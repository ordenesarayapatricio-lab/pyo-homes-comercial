import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useCaptaciones, ETAPA_COLUMNS, PARKING_ETAPAS, type CaptacionLead, type EtapaCaptacion } from "../hooks/useCaptaciones";
import { KanbanColumn } from "../components/activities/KanbanColumn";
import { CaptacionCardItem } from "../components/captaciones/CaptacionCardItem";
import { CaptacionCardModal } from "../components/captaciones/CaptacionCardModal";

const ufFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function sumUf(leads: CaptacionLead[]) {
  return leads.reduce((sum, l) => sum + (l.valor_publicacion_uf ?? l.valor_tasacion_uf ?? 0), 0);
}

export function Captaciones() {
  const { leads, loading, error, updateLead, moveLead, createLead, markContactedToday, updateProperty, getEvaluacion, saveEvaluacion } =
    useCaptaciones();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLeadId, setModalLeadId] = useState<number | null>(null);
  const [targetEtapa, setTargetEtapa] = useState<EtapaCaptacion>("Prospección");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const modalLead = leads.find((l) => l.id_lead === modalLeadId) ?? null;

  const activeLeads = leads.filter((l) => !PARKING_ETAPAS.includes(l.etapa_captacion));
  const parkingLeads = leads.filter((l) => PARKING_ETAPAS.includes(l.etapa_captacion));

  const totalActivo = sumUf(activeLeads);
  const totalNegociacionCierre = sumUf(
    leads.filter((l) => l.etapa_captacion === "En Negociación" || l.etapa_captacion === "Cierre Legal")
  );
  const totalEntregado = sumUf(leads.filter((l) => l.etapa_captacion === "Entregada"));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const validIds = [...ETAPA_COLUMNS.map((c) => c.id), "parking"];
    if (!validIds.includes(overId)) return;
    const etapaDestino: EtapaCaptacion = overId === "parking" ? "En Pausa" : (overId as EtapaCaptacion);
    moveLead(Number(active.id), etapaDestino);
  }

  function openCreateModal(etapa: EtapaCaptacion) {
    setModalLeadId(null);
    setTargetEtapa(etapa);
    setModalOpen(true);
  }

  function openEditModal(lead: CaptacionLead) {
    setModalLeadId(lead.id_lead);
    setTargetEtapa(lead.etapa_captacion);
    setModalOpen(true);
  }

  async function handleSave(changes: Parameters<typeof updateLead>[1]) {
    if (modalLead) {
      await updateLead(modalLead.id_lead, changes);
      setModalOpen(false);
    }
  }

  async function handleCreate(input: Parameters<typeof createLead>[0]) {
    await createLead(input);
    setModalOpen(false);
  }

  function handleSaveProperty(changes: Parameters<typeof updateProperty>[1]) {
    if (modalLead?.propiedad_id) {
      updateProperty(modalLead.propiedad_id, changes);
    }
  }

  function handleMarkContactedToday() {
    if (modalLead) markContactedToday(modalLead.id_lead);
  }

  function handleLoadEvaluacion(propiedadUuid: string) {
    return getEvaluacion(propiedadUuid);
  }

  function handleSaveEvaluacion(values: Parameters<typeof saveEvaluacion>[2]) {
    if (modalLead?.propiedad_id) {
      return saveEvaluacion(modalLead.id_lead, modalLead.propiedad_id, values);
    }
    return Promise.resolve();
  }

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-white">Captaciones</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Embudo de captación de propiedades — arrastra un contacto entre etapas para actualizar su avance.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-4 mt-4">
          No se pudo cargar Captaciones: {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface-container border border-white/5 rounded-lg px-5 py-3.5 my-4 text-sm text-on-surface-variant">
        <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70">Valor en el embudo</span>
        <span>
          <b className="text-gold font-bold">UF {ufFormat.format(totalActivo)}</b> total activo
        </span>
        <span className="w-px h-5 bg-white/10" />
        <span>
          <b className="text-gold font-bold">UF {ufFormat.format(totalNegociacionCierre)}</b> en negociación / cierre
        </span>
        <span className="w-px h-5 bg-white/10" />
        <span>
          <b className="text-gold font-bold">UF {ufFormat.format(totalEntregado)}</b> entregado
        </span>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {loading && <p className="text-on-surface-variant text-sm">Cargando...</p>}
          {!loading &&
            ETAPA_COLUMNS.map((column) => {
              const columnLeads = leads.filter((l) => l.etapa_captacion === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  count={columnLeads.length}
                  onAddCard={() => openCreateModal(column.id)}
                >
                  {columnLeads.map((lead) => (
                    <CaptacionCardItem key={lead.id_lead} lead={lead} onClick={() => openEditModal(lead)} />
                  ))}
                </KanbanColumn>
              );
            })}
          {!loading && (
            <KanbanColumn
              id="parking"
              title="En Pausa / Perdida"
              count={parkingLeads.length}
              onAddCard={() => openCreateModal("En Pausa")}
            >
              {parkingLeads.map((lead) => (
                <CaptacionCardItem key={lead.id_lead} lead={lead} onClick={() => openEditModal(lead)} />
              ))}
            </KanbanColumn>
          )}
        </div>
      </DndContext>

      <CaptacionCardModal
        open={modalOpen}
        lead={modalLead}
        defaultEtapa={targetEtapa}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onCreate={handleCreate}
        onSaveProperty={handleSaveProperty}
        onMarkContactedToday={handleMarkContactedToday}
        onLoadEvaluacion={handleLoadEvaluacion}
        onSaveEvaluacion={handleSaveEvaluacion}
      />
    </>
  );
}
