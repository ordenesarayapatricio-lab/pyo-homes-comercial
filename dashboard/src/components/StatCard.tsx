export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: string;
}

export function StatCard({ label, value, delta, deltaPositive, icon }: StatCardProps) {
  return (
    <div className="bg-surface-container border border-white/5 rounded-lg p-5 flex flex-col gap-4 gold-border-glow">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center text-gold">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {delta && (
          <span
            className={`text-xs font-bold flex items-center gap-0.5 ${
              deltaPositive ? "text-emerald-400" : "text-error"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {deltaPositive ? "trending_up" : "trending_down"}
            </span>
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}
