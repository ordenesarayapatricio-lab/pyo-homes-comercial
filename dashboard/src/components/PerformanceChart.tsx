import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { performanceData } from "../lib/mockData";

export function PerformanceChart() {
  return (
    <div className="bg-surface-container border border-white/5 rounded-lg p-5 md:p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-base font-bold text-white">Análisis de Rendimiento</h3>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold inline-block" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary inline-block" /> Leads
          </span>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData} margin={{ left: -20, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b7c7e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#b7c7e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#282a2b" vertical={false} />
            <XAxis dataKey="month" stroke="#c5c6cd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#c5c6cd" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#1d2021",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: "#e1e3e4" }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#FFD700" fill="url(#revenueGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="leads" stroke="#b7c7e9" fill="url(#leadsGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
