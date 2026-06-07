"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
} from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { fullName: string };
}

interface RespondForm {
  status: string;
  adminResponse: string;
}

const statusVariant: Record<string, "warning" | "info" | "success" | "muted"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "muted",
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const respondStatusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

function canAccessTickets(role: string) {
  return role === "SUPER_ADMIN" || role === "SUPPORT_ADMIN";
}

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const adminRole = useAuthStore((s) => s.admin?.role ?? "");
  const { toast } = useToast();

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";
  const limit = 20;

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [respondMode, setRespondMode] = useState(false);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.set("page", "1");
      router.replace(`/tickets?${params.toString()}`);
    },
    [searchParams, router],
  );

  const { data, isLoading, error } = useQuery<{
    data: Ticket[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["admin", "tickets", status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/api/admin/tickets?${params.toString()}`);
      return res.data;
    },
    enabled: canAccessTickets(adminRole),
  });

  if (!canAccessTickets(adminRole)) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Tickets</h1>
        <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  if (error) {
    const errStatus = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Tickets</h1>
        <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
          {errStatus === 403 ? "You do not have permission to access this page." : "Failed to load tickets."}
        </div>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Tickets</h1>
        <p className="text-sm text-muted mt-1">Support ticket management</p>
      </div>

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
            No tickets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Subject", "User", "Status", "Created", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {data.data.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-border-light/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {ticket.user?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[ticket.status] ?? "muted"}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDateTime(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setRespondMode(false);
                        }}
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
              Page {page} of {totalPages} ({data?.total} tickets)
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

      {/* Ticket Detail Modal */}
      <Modal
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject ?? "Ticket"}
      >
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            respondMode={respondMode}
            setRespondMode={setRespondMode}
            canRespond={canAccessTickets(adminRole)}
            onSuccess={(updated) => {
              setSelectedTicket(updated);
              setRespondMode(false);
              queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
              toast("Ticket updated", "success");
            }}
            onError={(msg) => toast(msg, "error")}
          />
        )}
      </Modal>
    </div>
  );
}

function TicketDetail({
  ticket,
  respondMode,
  setRespondMode,
  canRespond,
  onSuccess,
  onError,
}: {
  ticket: Ticket;
  respondMode: boolean;
  setRespondMode: (v: boolean) => void;
  canRespond: boolean;
  onSuccess: (updated: Ticket) => void;
  onError: (msg: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RespondForm>({
    defaultValues: {
      status: ticket.status,
      adminResponse: ticket.adminResponse ?? "",
    },
  });

  const onSubmit = async (values: RespondForm) => {
    try {
      const body: Record<string, string> = {};
      if (values.status !== ticket.status) body.status = values.status;
      if (values.adminResponse.trim() && values.adminResponse !== (ticket.adminResponse ?? "")) {
        body.adminResponse = values.adminResponse.trim();
      }
      if (Object.keys(body).length === 0) return;
      const res = await api.patch(`/api/admin/tickets/${ticket.id}`, body);
      onSuccess(res.data.ticket ?? { ...ticket, ...body });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      onError(status === 403 ? "You do not have permission to respond." : "Failed to update ticket.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[ticket.status] ?? "muted"}>
            {ticket.status}
          </Badge>
          <span className="text-xs text-muted">
            {ticket.user?.fullName ?? "Unknown user"}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {ticket.description}
        </p>
        <div className="flex gap-4 text-xs text-muted">
          <span>Created: {formatDateTime(ticket.createdAt)}</span>
          <span>Updated: {formatDateTime(ticket.updatedAt)}</span>
        </div>
      </div>

      {ticket.adminResponse && !respondMode && (
        <div className="bg-primary/5 border border-primary/15 rounded-[var(--radius-input)] p-3">
          <p className="text-xs font-medium text-primary mb-1">Admin Response</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {ticket.adminResponse}
          </p>
        </div>
      )}

      {canRespond && !respondMode && (
        <div className="flex justify-end pt-2">
          <Button
            className="text-xs"
            onClick={() => setRespondMode(true)}
          >
            <Send className="h-3.5 w-3.5" />
            Respond
          </Button>
        </div>
      )}

      {respondMode && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {respondStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Response
            </label>
            <textarea
              {...register("adminResponse")}
              rows={3}
              placeholder="Write a response..."
              className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => setRespondMode(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-xs"
              loading={isSubmitting}
            >
              Submit
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
