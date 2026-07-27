import { useLocation, useNavigate } from "react-router-dom";

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const enActividades = location.pathname.startsWith("/actividades");

  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-8 h-20 border-b border-white/10 bg-surface">
      <div className="relative hidden sm:block w-full max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar leads, propiedades..."
          className="w-full bg-surface-container border border-white/10 rounded pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-gold/60 transition-colors"
        />
      </div>

      <div className="flex items-center gap-3 md:gap-5 ml-auto">
        <button
          aria-label="Notificaciones"
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-white/5 hover:text-gold transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>

        <button
          onClick={() => navigate(enActividades ? "/actividades?nuevo=1" : "/leads?nuevo=1")}
          className="hidden sm:flex items-center gap-2 bg-gold text-primary-container font-label-caps text-label-caps font-bold py-2.5 px-4 rounded uppercase tracking-widest hover:bg-gold/90 hover:shadow-[0_8px_24px_rgba(255,215,0,0.35)] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {enActividades ? "Nueva Actividad" : "Nuevo Lead"}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-gold">
            PO
          </div>
          <span className="hidden lg:block text-sm font-medium text-on-surface">PyO Homes</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
        </div>
      </div>
    </header>
  );
}
