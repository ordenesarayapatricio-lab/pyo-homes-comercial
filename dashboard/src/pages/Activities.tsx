import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  useActivitiesBoard,
  DONE_COLUMN_ID,
  TIPO_ACTIVIDAD_OPCIONES,
  TIPO_ACTIVIDAD_ICONO,
  type ActivityCard,
} from "../hooks/useActivitiesBoard";
import { useLeads, scoreRatio } from "../hooks/useLeads";
import { KanbanColumn } from "../components/activities/KanbanColumn";
import { ActivityCardItem } from "../components/activities/ActivityCardItem";
import { ActivityCardModal } from "../components/activities/ActivityCardModal";
import { CierreBitacoraModal } from "../components/activities/CierreBitacoraModal";

function esHoy(iso: string): boolean {
  const fecha = new Date(iso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

export function Activities() {
  const {
    columns,
    cards,
    loading,
    error,
    addCard,
    updateCard,
    moveCard,
    closeCardWithBitacora,
    deleteCard,
    uploadAttachment,
    deleteAttachment,
  } = useActivitiesBoard();
  const { leads } = useLeads();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [targetColumnId, setTargetColumnId] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todas");
  const [pendingCloseCard, setPendingCloseCard] = useState<ActivityCard | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Fuerza un re-render cada 30s para que el estado "vencida" de cada tarjeta
  // (comparación contra Date.now() en ActivityCardItem) se recalcule sin recargar la página.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Requires a small drag distance before activating, so a plain click (no
  // movement) reaches the card's onClick instead of being swallowed as a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const editingCard = cards.find((c) => c.id === editingCardId) ?? null;
  const leadByKey = useMemo(() => Object.fromEntries(leads.map((lead) => [lead.key, lead])), [leads]);

  function leadDeLaTarjeta(card: ActivityCard) {
    if (!card.lead_origen || card.lead_ref_id == null) return undefined;
    return leadByKey[`${card.lead_origen}-${card.lead_ref_id}`];
  }

  const cardsFiltradas = useMemo(
    () => (filtroTipo === "Todas" ? cards : cards.filter((c) => c.tipo_actividad === filtroTipo)),
    [cards, filtroTipo]
  );

  const pendientesHoy = useMemo(
    () =>
      cards.filter((c) => c.column_id !== DONE_COLUMN_ID && c.scheduled_at && esHoy(c.scheduled_at)),
    [cards]
  );
  const hayAltaPrioridadHoy = pendientesHoy.some((c) => {
    const lead = leadDeLaTarjeta(c);
    return lead ? (scoreRatio(lead) ?? 0) >= 0.8 : false;
  });

  function openCreateModal(columnId: string) {
    setEditingCardId(null);
    setTargetColumnId(columnId);
    setModalOpen(true);
  }

  // El botón "+ Nueva Actividad" del Topbar navega aquí con ?nuevo=1 para abrir
  // este modal directamente — mismo patrón ya usado en Leads.tsx.
  useEffect(() => {
    if (searchParams.has("nuevo") && sortedColumns.length > 0) {
      openCreateModal(sortedColumns[0].id);
      setSearchParams((params) => {
        params.delete("nuevo");
        return params;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, columns]);

  function openEditModal(card: ActivityCard) {
    setEditingCardId(card.id);
    setTargetColumnId(card.column_id);
    setModalOpen(true);
  }

  async function handleSave(data: {
    title: string;
    content: string | null;
    column_id: string;
    contacto_id: string | null;
    scheduled_at: string | null;
    tipo_actividad: string | null;
    lead_origen: ActivityCard["lead_origen"];
    lead_ref_id: number | null;
    recordatorio_whatsapp: boolean;
  }) {
    if (editingCard) {
      await updateCard(editingCard.id, data);
    } else {
      await addCard(data);
    }
    setModalOpen(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const card = cards.find((c) => c.id === String(active.id));
    if (over.id === DONE_COLUMN_ID && card) {
      setPendingCloseCard(card);
      return;
    }
    moveCard(String(active.id), String(over.id));
  }

  async function handleConfirmCierre(detalle: string) {
    if (!pendingCloseCard) return;
    await closeCardWithBitacora(pendingCloseCard, detalle);
    setPendingCloseCard(null);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-white">Actividades</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Organiza tus tareas y haz seguimiento arrastrando las tarjetas entre columnas.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 bg-surface-container-high border border-white/10 rounded-lg px-4 py-2 ${
            hayAltaPrioridadHoy ? "ring-2 ring-error animate-pulse" : ""
          }`}
        >
          <span className="material-symbols-outlined text-gold text-[20px]">today</span>
          <span className="text-sm text-on-surface-variant">Pendientes Hoy</span>
          <span className={`text-lg font-bold ${hayAltaPrioridadHoy ? "text-error" : "text-on-surface"}`}>
            {pendientesHoy.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-4">
          No se pudo cargar el tablero: {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroTipo("Todas")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
            filtroTipo === "Todas"
              ? "bg-gold text-primary-container border-gold"
              : "bg-transparent text-on-surface-variant border-white/15 hover:border-gold/50"
          }`}
        >
          Todas
        </button>
        {TIPO_ACTIVIDAD_OPCIONES.map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              filtroTipo === tipo
                ? "bg-gold text-primary-container border-gold"
                : "bg-transparent text-on-surface-variant border-white/15 hover:border-gold/50"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{TIPO_ACTIVIDAD_ICONO[tipo]}</span>
            {tipo}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {loading && <p className="text-on-surface-variant text-sm">Cargando tablero...</p>}
          {!loading &&
            sortedColumns.map((column) => {
              const columnCards = cardsFiltradas.filter((card) => card.column_id === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  count={columnCards.length}
                  onAddCard={() => openCreateModal(column.id)}
                  showAddButton={column.id !== DONE_COLUMN_ID}
                >
                  {columnCards.map((card) => (
                    <ActivityCardItem
                      key={card.id}
                      card={card}
                      lead={leadDeLaTarjeta(card)}
                      onClick={() => openEditModal(card)}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
        </div>
      </DndContext>

      <ActivityCardModal
        open={modalOpen}
        columns={sortedColumns.filter((c) => c.id !== DONE_COLUMN_ID)}
        leads={leads}
        defaultColumnId={targetColumnId}
        card={editingCard}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onMoveNow={editingCard ? (columnId) => moveCard(editingCard.id, columnId) : undefined}
        onDelete={
          editingCard
            ? () => {
                deleteCard(editingCard.id);
                setModalOpen(false);
              }
            : undefined
        }
        onUploadAttachment={editingCard ? (file) => uploadAttachment(editingCard.id, file) : undefined}
        onDeleteAttachment={deleteAttachment}
      />

      <CierreBitacoraModal
        open={pendingCloseCard != null}
        cardTitle={pendingCloseCard?.title ?? ""}
        onClose={() => setPendingCloseCard(null)}
        onConfirm={handleConfirmCierre}
      />
    </>
  );
}
