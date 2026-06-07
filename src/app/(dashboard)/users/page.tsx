"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import api from "@/lib/api";
import { formatPaise, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface UserRow {
  id: string;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  profilePicture: string | null;
  creditBalance: number;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  createdAt: string;
}

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  DEACTIVATED: "danger",
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const limit = 20;

  const [searchInput, setSearchInput] = useState(search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.replace(`/users?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.set("page", "1");
      router.replace(`/users?${params.toString()}`);
    },
    [searchParams, router],
  );

  const { data, isLoading } = useQuery<{
    data: UserRow[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["admin", "users", search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/api/admin/users?${params.toString()}`);
      return res.data;
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted mt-1">
          Manage and monitor user accounts
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-input)] border border-border bg-surface text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
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
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Mobile", "Email", "Status", "Balance", "Joined", ""].map(
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
                {data.data.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-border-light/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={user.fullName}
                          src={user.profilePicture}
                          size="sm"
                        />
                        <span className="font-medium text-foreground">
                          {user.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{user.mobileNumber}</td>
                    <td className="px-4 py-3 text-muted">
                      {user.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[user.status] ?? "muted"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPaise(user.creditBalance)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
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
              Page {page} of {totalPages} ({data?.total} users)
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
