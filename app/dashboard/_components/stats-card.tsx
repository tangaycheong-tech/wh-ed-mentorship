// ============================================================
// app/dashboard/_components/stats-card.tsx
// Reusable stat card for dashboard overviews
// ============================================================

import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  className?: string;
  subtitle?: string;
}

export function StatsCard({ label, value, icon, className, subtitle }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
