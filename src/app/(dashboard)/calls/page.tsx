"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  PhoneOff,
  Clock,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { formatPaise, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";

interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  status: string;
  durationSeconds: number | null;
  creditsDeducted: number;
  latencyMs: number | null;
  createdAt: string;
  caller?: { fullName: string };
  receiver?: { fullName: string };
}

interface Overview {
  callsCount: number;
  completedCallsCount: number;
  failedCallsCount: number;
  totalCallSeconds: number;
}

const statusVariant: Record<string, "success" | "info" | "danger" | "muted"> = {
  COMPLETED: "success",
  ONGOING: "info",
  FAILED: "danger",
  MISSED: "danger",
  INITIATED: "muted",
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "FAILED", label: "Failed" },
  { value: "MISSED", label: "Missed" },
  { value: "INITIATED", label: "Initiated" },
];

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds === 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CallsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";
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
      router.replace(`/calls?${params.toString()}`);
    },
    [searchParams, router],
  );

  const { data: overview } = useQuery<Overview>({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const res = await api.get("/api/admin/analytics/overview");
      return res.data.overview;
    },
  });

  const { data, isLoading, error } = useQuery<{
    data: Call[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["admin", "calls", status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/api/admin/calls?${params.toString()}`);
      return res.data;
    },
  });

  if (error) {
    const errStatus = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Calls</h1>
        <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
          {errStatus === 403 ? "You do not have permission to access this page." : "Failed to load calls."}
        </div>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Calls</h1>
        <p className="text-sm text-muted mt-1">Monitor voice call activity</p>
      </div>

      {/* Stat Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Calls"
            value={overview.callsCount.toLocaleString()}
            icon={<Phone className="h-5 w-5" />}
          />
          <StatCard
            label="Completed"
            value={overview.completedCallsCount.toLocaleString()}
            badgeColor="success"
            icon={<Phone className="h-5 w-5" />}
          />
          <StatCard
            label="Failed"
            value={overview.failedCallsCount.toLocaleString()}
            badgeColor="danger"
            icon={<PhoneOff className="h-5 w-5" />}
          />
          <StatCard
            label="Total Duration"
            value={formatDuration(overview.totalCallSeconds)}
            badge={`${overview.totalCallSeconds}s`}
            badgeColor="muted"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="rounded-[var(--radius-input)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          {statusOptions.map((o) => (
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
            No calls found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Date/Time", "Caller", "Receiver", "Status", "Duration", "Cost", "Latency"].map(
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
                {data.data.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-border-light/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDateTime(call.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {call.caller?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {call.receiver?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[call.status] ?? "muted"}>
                        {call.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDuration(call.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {call.creditsDeducted ? formatPaise(call.creditsDeducted) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {call.latencyMs != null ? `${call.latencyMs}ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {page} of {totalPages} ({data?.total} calls)
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
