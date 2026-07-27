import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface Props {
  id: string;
  title: string;
  count: number;
  onAddCard: () => void;
  showAddButton?: boolean;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, onAddCard, showAddButton = true, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-high rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        </div>
        {showAddButton && (
          <button
            aria-label={`Nueva tarjeta en ${title}`}
            onClick={onAddCard}
            className="text-on-surface-variant hover:text-gold transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-lg p-2 space-y-2 border transition-colors ${
          isOver ? "border-gold/50 bg-gold/5" : "border-white/5 bg-surface-container/40"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
