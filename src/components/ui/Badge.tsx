type BadgeVariant = "success" | "warning" | "danger" | "info" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  muted: "bg-border-light text-muted",
};

export function Badge({ children, variant = "muted" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-[var(--radius-badge)] ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
