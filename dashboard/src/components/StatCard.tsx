export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  deltaInfo?: string;
  valueClassName?: string;
  icon: string;
}

export function StatCard({ label, value, delta, deltaPositive, deltaInfo, valueClassName, icon }: StatCardProps) {
  return (
    <div className="bg-surface-container border border-white/5 rounded-lg p-5 flex flex-col gap-4 gold-border-glow">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center text-gold">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {delta ? (
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
        ) : deltaInfo ? (
          <span className="text-[10px] text-on-surface-variant/60">{deltaInfo}</span>
        ) : null}
      </div>
      <div>
        <p className={`text-2xl font-bold ${valueClassName ?? "text-white"}`}>{value}</p>
        <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}
