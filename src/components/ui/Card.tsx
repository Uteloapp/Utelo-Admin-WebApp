import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}
