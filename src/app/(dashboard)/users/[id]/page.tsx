"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Plus,
  Minus,
  RotateCcw,
  MessageSquare,
  Mic,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { formatPaise, formatDate, formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { CreditActionModal } from "@/components/CreditActionModal";

interface UserDetail {
  id: string;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  gender: string | null;
  profession: string | null;
  preferredLanguage: string;
  profilePicture: string | null;
  isProfileComplete: boolean;
  creditBalance: number;
  freeChatWordsUsed: number;
  freeVoiceMsgSecondsUsed: number;
  freeCallSecondsUsed: number;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  createdAt: string;
}

interface FreeUsage {
  chatWordsUsed: number;
  chatWordsRemaining: number;
  chatWordsTotal: number;
  voiceMsgSecondsUsed: number;
  voiceMsgSecondsRemaining: number;
  voiceMsgSecondsTotal: number;
  callSecondsUsed: number;
  callSecondsRemaining: number;
  callSecondsTotal: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  feature: string | null;
  createdAt: string;
}

interface CreditBatch {
  id: string;
  originalAmount: number;
  remainingAmount: number;
  expiresAt: string;
  createdAt: string;
}

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  DEACTIVATED: "danger",
};

const txTypeVariant: Record<string, "success" | "danger" | "info" | "warning"> = {
  RECHARGE: "success",
  DEDUCTION: "danger",
  REFUND: "info",
  ADMIN_ADJUSTMENT: "warning",
};

function canManageCredits(role: string) {
  return role === "SUPER_ADMIN" || role === "FINANCE_ADMIN";
}

function canChangeStatus(role: string) {
  return role === "SUPER_ADMIN" || role === "SUPPORT_ADMIN";
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const adminRole = useAuthStore((s) => s.admin?.role ?? "");
  const { toast } = useToast();

  const [creditAction, setCreditAction] = useState<"add" | "deduct" | "refund" | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => {
      const res = await api.get(`/api/admin/users/${id}`);
      return res.data as {
        user: UserDetail;
        freeUsage: FreeUsage;
        recentTransactions: Transaction[];
        messagesCount: number;
        ticketCount: number;
        activeBatches: CreditBatch[];
      };
    },
  });

  const { data: txData } = useQuery({
    queryKey: ["admin", "user", id, "transactions", txPage],
    queryFn: async () => {
      const res = await api.get(
        `/api/admin/users/${id}/transactions?page=${txPage}&limit=10`,
      );
      return res.data as {
        data: Transaction[];
        total: number;
        page: number;
        limit: number;
      };
    },
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "user", id] });
    queryClient.invalidateQueries({
      queryKey: ["admin", "user", id, "transactions"],
    });
  }, [queryClient, id]);

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/api/admin/users/${id}/status`, { status: newStatus });
      toast("Status updated", "success");
      setStatusModal(false);
      invalidateAll();
    } catch {
      toast("Failed to update status", "error");
    } finally {
      setStatusLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
          Failed to load user details.
        </div>
      </div>
    );
  }

  const { user, freeUsage, activeBatches } = data;
  const txTotalPages = txData ? Math.ceil(txData.total / txData.limit) : 0;
  const transactions = txData?.data ?? data.recentTransactions;

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <Avatar name={user.fullName} src={user.profilePicture} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                {user.fullName}
              </h1>
              <Badge variant={statusVariant[user.status] ?? "muted"}>
                {user.status}
              </Badge>
            </div>
            {user.profession && (
              <p className="text-sm text-muted mt-0.5">{user.profession}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted">
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {user.mobileNumber}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
          {canChangeStatus(adminRole) && (
            <div>
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  setNewStatus(user.status);
                  setStatusModal(true);
                }}
              >
                Change Status
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Credits + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Credit Balance */}
        <Card className="p-5">
          <p className="text-sm text-muted font-medium">Available Credits</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {formatPaise(user.creditBalance)}
          </p>
          {activeBatches.length > 0 && (
            <div className="mt-3 space-y-1">
              {activeBatches.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between text-xs text-muted"
                >
                  <span>{formatPaise(b.remainingAmount)} remaining</span>
                  <span>exp {formatDate(b.expiresAt)}</span>
                </div>
              ))}
            </div>
          )}
          {canManageCredits(adminRole) && (
            <div className="flex gap-2 mt-4">
              <Button
                className="text-xs flex-1"
                onClick={() => setCreditAction("add")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
              <Button
                variant="danger"
                className="text-xs flex-1"
                onClick={() => setCreditAction("deduct")}
              >
                <Minus className="h-3.5 w-3.5" />
                Deduct
              </Button>
              <Button
                variant="secondary"
                className="text-xs flex-1"
                onClick={() => setCreditAction("refund")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Refund
              </Button>
            </div>
          )}
        </Card>

        {/* Free Tier Usage */}
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm text-muted font-medium mb-3">
            Free Tier Usage
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UsageBar
              icon={<MessageSquare className="h-4 w-4" />}
              label="Chat Words"
              used={freeUsage.chatWordsUsed}
              total={freeUsage.chatWordsTotal}
            />
            <UsageBar
              icon={<Mic className="h-4 w-4" />}
              label="Voice Msg (s)"
              used={freeUsage.voiceMsgSecondsUsed}
              total={freeUsage.voiceMsgSecondsTotal}
            />
            <UsageBar
              icon={<PhoneCall className="h-4 w-4" />}
              label="Call (s)"
              used={freeUsage.callSecondsUsed}
              total={freeUsage.callSecondsTotal}
            />
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Transaction History
          </h2>
        </div>
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted">
            No transactions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Type", "Amount", "Feature", "Balance After"].map(
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
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={txTypeVariant[tx.type] ?? "muted"}
                      >
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${tx.type === "DEDUCTION" ? "text-danger" : "text-success"}`}
                      >
                        {tx.type === "DEDUCTION" ? "-" : "+"}
                        {formatPaise(Math.abs(tx.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {tx.feature ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPaise(tx.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {txTotalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {txPage} of {txTotalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={txPage <= 1}
                onClick={() => setTxPage((p) => p - 1)}
                className="p-1.5 rounded-[var(--radius-badge)] text-muted hover:bg-border-light disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={txPage >= txTotalPages}
                onClick={() => setTxPage((p) => p + 1)}
                className="p-1.5 rounded-[var(--radius-badge)] text-muted hover:bg-border-light disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Credit Action Modal */}
      {creditAction && (
        <CreditActionModal
          open={!!creditAction}
          onClose={() => setCreditAction(null)}
          action={creditAction}
          userId={id}
          onSuccess={invalidateAll}
        />
      )}

      {/* Status Change Modal */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Change User Status"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Changing status for <strong>{user.fullName}</strong>
          </p>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setStatusModal(false)}
              disabled={statusLoading}
            >
              Cancel
            </Button>
            <Button
              variant={newStatus === "ACTIVE" ? "primary" : "danger"}
              onClick={handleStatusChange}
              loading={statusLoading}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function UsageBar({
  icon,
  label,
  used,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color =
    pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-primary";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted">
        {used.toLocaleString()} / {total.toLocaleString()} used
      </p>
    </div>
  );
}
