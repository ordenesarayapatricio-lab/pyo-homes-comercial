import { useEffect, useRef, useState } from "react";
import type { ActivityCard, ActivityColumn } from "../../hooks/useActivitiesBoard";
import { TIPO_ACTIVIDAD_OPCIONES } from "../../hooks/useActivitiesBoard";
import { ROL_LABELS, scoreRatio, type LeadItem, type LeadOrigen } from "../../hooks/useLeads";

interface Props {
  open: boolean;
  columns: ActivityColumn[];
  leads: LeadItem[];
  defaultColumnId: string;
  card: ActivityCard | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string | null;
    column_id: string;
    contacto_id: string | null;
    scheduled_at: string | null;
    tipo_actividad: string | null;
    lead_origen: LeadOrigen | null;
    lead_ref_id: number | null;
    recordatorio_whatsapp: boolean;
  }) => void;
  onMoveNow?: (columnId: string) => void;
  onDelete?: () => void;
  onUploadAttachment?: (file: File) => Promise<void>;
  onDeleteAttachment?: (attachmentId: string, filePath: string) => Promise<void>;
}

const ACCEPTED_TYPES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function leadKey(lead: LeadItem) {
  return lead.key;
}

export function ActivityCardModal({
  open,
  columns,
  leads,
  defaultColumnId,
  card,
  onClose,
  onSave,
  onMoveNow,
  onDelete,
  onUploadAttachment,
  onDeleteAttachment,
}: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tipoActividad, setTipoActividad] = useState("");
  const [leadSelKey, setLeadSelKey] = useState<string>("");
  const [columnId, setColumnId] = useState(defaultColumnId);
  const [scheduledAt, setScheduledAt] = useState("");
  const [recordatorioWhatsapp, setRecordatorioWhatsapp] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(card?.title ?? "");
    setContent(card?.content ?? "");
    setTipoActividad(card?.tipo_actividad ?? "");
    const preselected =
      card?.lead_origen && card.lead_ref_id != null ? `${card.lead_origen}-${card.lead_ref_id}` : "";
    setLeadSelKey(preselected);
    setColumnId(card?.column_id ?? defaultColumnId);
    setScheduledAt(card?.scheduled_at ?? "");
    setRecordatorioWhatsapp(card?.recordatorio_whatsapp ?? false);
    setFileError(null);
  }, [open, card, defaultColumnId]);

  if (!open) return null;

  const selectedLead = leads.find((l) => leadKey(l) === leadSelKey) ?? null;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !card || !onUploadAttachment) return;
    setFileError(null);
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" supera los 5MB permitidos.`);
        continue;
      }
      const validType = ACCEPTED_TYPES.some((type) => file.type.startsWith(type));
      if (!validType) {
        setFileError(`"${file.name}" no tiene un tipo de archivo permitido.`);
        continue;
      }
      try {
        setUploading(true);
        await onUploadAttachment(file);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
      } finally {
        setUploading(false);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim() || null,
      column_id: columnId,
      contacto_id: selectedLead?.contacto_id ?? null,
      scheduled_at: scheduledAt || null,
      tipo_actividad: tipoActividad || null,
      lead_origen: selectedLead?.origen ?? null,
      lead_ref_id: selectedLead?.id ?? null,
      recordatorio_whatsapp: recordatorioWhatsapp,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-gold">{card ? "Editar Actividad" : "Nueva Actividad"}</h2>
          <button
            aria-label="Cerrar modal"
            onClick={onClose}
            className="text-on-surface-variant hover:text-gold transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="cardTitle">
              Título *
            </label>
            <input
              id="cardTitle"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la actividad"
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="cardTipo">
              Tipo de Actividad
            </label>
            <select
              id="cardTipo"
              value={tipoActividad}
              onChange={(e) => setTipoActividad(e.target.value)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
            >
              <option value="">Sin especificar</option>
              {TIPO_ACTIVIDAD_OPCIONES.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="cardContent">
              Contenido
            </label>
            <textarea
              id="cardContent"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descripción o contenido de la actividad"
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-gold/60 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="cardLead">
              Asociado a
            </label>
            <select
              id="cardLead"
              value={leadSelKey}
              onChange={(e) => setLeadSelKey(e.target.value)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
            >
              <option value="">Sin lead asociado</option>
              {leads.map((lead) => (
                <option key={leadKey(lead)} value={leadKey(lead)}>
                  {lead.nombre} — {ROL_LABELS[lead.rol]}
                </option>
              ))}
            </select>
            {selectedLead && (
              <p className="text-[11px] text-on-surface-variant/70 mt-1.5">
                {selectedLead.telefono}
                {scoreRatio(selectedLead) != null && (
                  <> · Calificación {Math.round((scoreRatio(selectedLead) ?? 0) * 100)}%</>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="cardScheduledAt">
              Fecha y Hora
            </label>
            <input
              id="cardScheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={recordatorioWhatsapp}
              onChange={(e) => setRecordatorioWhatsapp(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-xs text-on-surface-variant">
              Enviar recordatorio automático al cliente por WhatsApp
            </span>
          </label>

          {card && (
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Mover a
              </label>
              <div className="flex gap-2">
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="flex-1 bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onMoveNow?.(columnId)}
                  className="bg-tertiary/20 text-tertiary text-sm font-bold px-4 rounded hover:bg-tertiary/30 transition-colors"
                >
                  Mover
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant/70 mt-1.5">
                Para cerrar, arrastra la tarjeta a "Terminadas" — así se registra la bitácora.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Agregar archivos
            </label>
            {card ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                className="border border-dashed border-white/20 rounded-lg py-6 px-4 text-center cursor-pointer hover:border-gold/50 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                  {uploading ? "progress_activity" : "upload_file"}
                </span>
                <p className="text-sm text-on-surface mt-1">
                  {uploading ? "Subiendo archivo..." : "Arrastra archivos aquí o haz clic para seleccionar"}
                </p>
                <p className="text-[11px] text-on-surface-variant/70 mt-1">
                  Imágenes, PDF, Word, Excel, PowerPoint — máx. 5MB por archivo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            ) : (
              <div className="border border-dashed border-white/10 rounded-lg py-6 px-4 text-center text-on-surface-variant/60 text-sm">
                Guarda la actividad primero para poder agregar archivos.
              </div>
            )}
            {fileError && <p className="text-xs text-error mt-1.5">{fileError}</p>}

            {card && card.activity_card_attachments.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {card.activity_card_attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between bg-background/60 rounded px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-on-surface truncate">
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      {file.file_name}
                      <span className="text-on-surface-variant/60">({formatSize(file.size)})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteAttachment?.(file.id, file.file_path)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            {card && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-error text-sm font-bold hover:underline"
              >
                Eliminar
              </button>
            ) : (
              <span />
            )}
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
