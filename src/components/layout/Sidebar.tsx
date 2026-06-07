"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Phone,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: null },
  { label: "Users", href: "/users", icon: Users, roles: null },
  { label: "Payments", href: "/payments", icon: CreditCard, roles: ["SUPER_ADMIN", "FINANCE_ADMIN"] },
  { label: "Calls", href: "/calls", icon: Phone, roles: null },
  { label: "Tickets", href: "/tickets", icon: Ticket, roles: ["SUPER_ADMIN", "SUPPORT_ADMIN"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: null },
  { label: "Settings", href: "/settings", icon: Settings, roles: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuthStore();
  const role = admin?.role ?? "";

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-[var(--radius-badge)] bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">U</span>
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">
            UTLO
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button)] text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted hover:bg-border-light hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="border-t border-border p-3 pb-4 space-y-1">
        {admin && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={admin.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {admin.name}
              </p>
              <p className="text-xs text-muted truncate">{admin.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-button)] text-sm font-medium text-muted hover:bg-danger/8 hover:text-danger transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
