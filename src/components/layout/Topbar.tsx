"use client";

import { Search, Bell, Settings } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";

export function Topbar() {
  const admin = useAuthStore((s) => s.admin);

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border px-6 py-3 flex items-center gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-background text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-[var(--radius-button)] text-muted hover:bg-border-light transition-colors">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button className="p-2 rounded-[var(--radius-button)] text-muted hover:bg-border-light transition-colors">
          <Settings className="h-[18px] w-[18px]" />
        </button>
        {admin && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <Avatar name={admin.name} size="sm" />
            <span className="text-sm font-medium text-foreground">
              {admin.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
