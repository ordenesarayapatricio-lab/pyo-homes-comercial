import { activityFeed } from "../lib/mockData";

export function ActivityFeed() {
  return (
    <div className="bg-surface-container border border-white/5 rounded-lg p-5 md:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-base font-bold text-white">Novedades</h3>
        <button className="text-on-surface-variant hover:text-gold transition-colors">
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
        </button>
      </div>
      <ul className="space-y-4 overflow-y-auto">
        {activityFeed.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-gold">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-on-surface truncate">{item.title}</p>
              <p className="text-xs text-on-surface-variant truncate">{item.subtitle}</p>
            </div>
            <span className="text-[11px] text-on-surface-variant/70 shrink-0">{item.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
