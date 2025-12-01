import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
  color?: "primary" | "accent" | "success" | "warning";
}

export const MetricCard = ({
  icon: Icon,
  label,
  value,
  description,
  color = "primary",
}: MetricCardProps) => {
  const percentage = (value * 100).toFixed(2);

  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6 hover:shadow-medical transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground font-outfit">
          {percentage}%
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
