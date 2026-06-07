import { Card } from "./Card";
import type { ReactNode } from "react";

type BadgeColor = "success" | "warning" | "danger" | "info" | "muted";

interface StatCardProps {
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: BadgeColor;
  icon?: ReactNode;
}

const badgeStyles: Record<BadgeColor, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  muted: "bg-border-light text-muted",
};

export function StatCard({ label, value, badge, badgeColor = "info", icon }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted font-medium">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {icon && (
          <div className="p-2.5 rounded-[var(--radius-badge)] bg-primary/8 text-primary">
            {icon}
          </div>
        )}
      </div>
      {badge && (
        <div className="mt-3">
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-[var(--radius-badge)] ${badgeStyles[badgeColor]}`}
          >
            {badge}
          </span>
        </div>
      )}
    </Card>
  );
}
