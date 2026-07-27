import { useEffect, useRef, useState } from "react";
import type { LeadItem } from "../../hooks/useLeads";

interface Props {
  lead: LeadItem;
  onArchivar: () => void;
  onDesarchivar: () => void;
  onEliminar: () => void;
  onMoverACaptaciones: () => void;
}

export function RowActionsMenu({ lead, onArchivar, onDesarchivar, onEliminar, onMoverACaptaciones }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleEliminar() {
    if (window.confirm(`¿Eliminar a ${lead.nombre}? Esta acción no se puede deshacer.`)) {
      onEliminar();
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Más acciones"
        className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-gold hover:bg-white/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-52 bg-luxury-blue border border-white/10 rounded-lg shadow-2xl overflow-hidden py-1">
          {lead.rol !== "vendedor" && (
            <button
              onClick={() => {
                onMoverACaptaciones();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-white/5 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] text-gold">swap_horiz</span>
              Mover a Captaciones
            </button>
          )}
          {lead.archivado ? (
            <button
              onClick={() => {
                onDesarchivar();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-white/5 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">unarchive</span>
              Desarchivar
            </button>
          ) : (
            <button
              onClick={() => {
                onArchivar();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-white/5 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">archive</span>
              Archivar
            </button>
          )}
          <button
            onClick={handleEliminar}
            className="w-full text-left px-3 py-2 text-xs text-error hover:bg-error/10 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
