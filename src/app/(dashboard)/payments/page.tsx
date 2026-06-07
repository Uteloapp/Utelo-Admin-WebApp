"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  CreditCard,
  ArrowDownLeft,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { formatPaise, formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  feature: string | null;
  createdAt: string;
  user?: { fullName: string };
}

interface Overview {
  totalRevenuePaise: number;
  totalCreditsOutstandingPaise: number;
  revenueTodayPaise: number;
}

const txTypeVariant: Record<string, "success" | "danger" | "info" | "warning"> = {
  RECHARGE: "success",
  DEDUCTION: "danger",
  REFUND: "info",
  ADMIN_ADJUSTMENT: "warning",
};

const typeOptions = [
  { value: "", label: "All types" },
  { value: "RECHARGE", label: "Recharge" },
  { value: "DEDUCTION", label: "Deduction" },
  { value: "REFUND", label: "Refund" },
  { value: "ADMIN_ADJUSTMENT", label: "Admin Adjustment" },
];

function isDebit(type: string) {
  return type === "DEDUCTION";
}

function canAccessPayments(role: string) {
  return role === "SUPER_ADMIN" || role === "FINANCE_ADMIN";
}

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminRole = useAuthStore((s) => s.admin?.role ?? "");

  const page = Number(searchParams.get("page")) || 1;
  const type = searchParams.get("type") || "";
  const limit = 20;

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.set("page", "1");
      router.replace(`/payments?${params.toString()}`);
    },
    [searchParams, router],
  );

  const { data: overview } = useQuery<Overview>({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const res = await api.get("/api/admin/analytics/overview");
      return res.data.overview;
    },
    enabled: canAccessPayments(adminRole),
  });

  const { data, isLoading, error } = useQuery<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["admin", "transactions", type, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/api/admin/transactions?${params.toString()}`);
      return res.data;
    },
    enabled: canAccessPayments(adminRole),
  });

  if (!canAccessPayments(adminRole)) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Payments</h1>
        <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Payments</h1>
        <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
          {status === 403 ? "You do not have permission to access this page." : "Failed to load transactions."}
        </div>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Payments</h1>
        <p className="text-sm text-muted mt-1">Revenue and transaction management</p>
      </div>

      {/* Stat Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={formatPaise(overview.totalRevenuePaise)}
            badge={`${formatPaise(overview.revenueTodayPaise)} today`}
            badgeColor="success"
            icon={<IndianRupee className="h-5 w-5" />}
          />
          <StatCard
            label="Credits Outstanding"
            value={formatPaise(overview.totalCreditsOutstandingPaise)}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            label="Total Transactions"
            value={data?.total?.toLocaleString() ?? "—"}
            icon={<ArrowDownLeft className="h-5 w-5" />}
          />
          <StatCard
            label="Recent Activity"
            value={data?.data?.length?.toString() ?? "—"}
            badge="this page"
            badgeColor="muted"
            icon={<Activity className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
          className="rounded-[var(--radius-input)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner />
          </div>
        ) : !data?.data.length ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Date/Time", "User", "Type", "Amount", "Feature", "Balance After"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {data.data.map((tx) => {
                  const debit = isDebit(tx.type);
                  const signed = debit ? `-${formatPaise(Math.abs(tx.amount))}` : `+${formatPaise(Math.abs(tx.amount))}`;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-border-light/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {tx.user?.fullName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={txTypeVariant[tx.type] ?? "muted"}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${debit ? "text-danger" : "text-success"}`}>
                          {signed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {tx.feature ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatPaise(tx.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {page} of {totalPages} ({data?.total} transactions)
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setParam("page", String(page - 1))}
                className="p-1.5 rounded-[var(--radius-badge)] text-muted hover:bg-border-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p =
                  totalPages <= 5
                    ? i + 1
                    : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setParam("page", String(p))}
                    className={`h-8 w-8 rounded-[var(--radius-badge)] text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "text-muted hover:bg-border-light"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setParam("page", String(page + 1))}
                className="p-1.5 rounded-[var(--radius-badge)] text-muted hover:bg-border-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
