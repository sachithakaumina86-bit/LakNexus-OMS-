import { ReactNode } from "react";
import { motion } from "motion/react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "blue" | "indigo" | "emerald" | "rose" | "amber" | string;
}

export default function MetricCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "blue",
}: MetricCardProps) {
  const isUp = trend?.isPositive;

  // Static colors class extractor to ensure styling is bulletproof
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50/60", text: "text-blue-600", border: "border-blue-100/80" },
    indigo: { bg: "bg-indigo-50/60", text: "text-indigo-600", border: "border-indigo-100/80" },
    emerald: { bg: "bg-emerald-50/60", text: "text-emerald-600", border: "border-emerald-100/80" },
    rose: { bg: "bg-rose-50/60", text: "text-rose-600", border: "border-rose-100/80" },
    amber: { bg: "bg-amber-50/60", text: "text-amber-600", border: "border-amber-100/80" },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-950 mt-2 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 mt-4 text-[11px] font-medium">
          <span
            className={`font-semibold px-2 py-0.5 rounded-full ${
              isUp ? "bg-emerald-100/50 text-emerald-700" : "bg-rose-100/50 text-rose-700"
            }`}
          >
            {isUp ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-slate-400">vs last week</span>
        </div>
      )}

      {/* Soft gradient background overlay */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent opacity-10 rounded-full blur-xl pointer-events-none" />
    </motion.div>
  );
}
