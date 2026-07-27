import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid_view", end: true },
  { to: "/actividades", label: "Actividades", icon: "checklist" },
  { to: "/captaciones", label: "Captaciones", icon: "swap_horiz" },
  { to: "/leads", label: "Leads", icon: "groups" },
  { to: "/propiedades", label: "Propiedades", icon: "apartment" },
  { to: "/calendario", label: "Calendario", icon: "calendar_month" },
  { to: "/reportes", label: "Reportes", icon: "bar_chart" },
];

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col justify-between bg-surface-container-lowest border-r border-white/10 h-screen sticky top-0">
      <div>
        <div className="flex items-center gap-2 px-6 h-20 border-b border-white/10">
          <span className="material-symbols-outlined text-gold text-2xl">real_estate_agent</span>
          <span className="font-headline-md text-lg font-bold text-white tracking-tight">
            PyO <span className="text-gold">CRM</span>
          </span>
        </div>

        <nav className="px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-4 py-6 border-t border-white/10 space-y-1">
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
              isActive ? "bg-gold/10 text-gold" : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          Configuración
        </NavLink>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium text-error/80 hover:bg-error/10 hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
