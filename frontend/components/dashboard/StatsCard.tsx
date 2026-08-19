import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  iconColor?: "emerald" | "orange" | "rose" | "amber" | "slate";
}

const iconColorMap = {
  emerald: "bg-emerald-100 text-emerald-600",
  orange: "bg-orange-100 text-orange-600",
  rose: "bg-rose-100 text-rose-600",
  amber: "bg-amber-100 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "emerald",
}: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            {change && (
              <div className="mt-2 flex items-center space-x-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    change.value >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {change.value >= 0 ? "+" : ""}
                  {change.value}%
                </span>
                <span className="text-xs text-slate-500">{change.label}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              iconColorMap[iconColor],
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
      {/* Gradient accent */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          iconColor === "emerald" &&
            "bg-gradient-to-r from-emerald-400 to-emerald-600",
          iconColor === "orange" &&
            "bg-gradient-to-r from-orange-400 to-orange-600",
          iconColor === "rose" && "bg-gradient-to-r from-rose-400 to-rose-600",
          iconColor === "amber" &&
            "bg-gradient-to-r from-amber-400 to-amber-600",
          iconColor === "slate" &&
            "bg-gradient-to-r from-slate-400 to-slate-600",
        )}
      />
    </Card>
  );
}
