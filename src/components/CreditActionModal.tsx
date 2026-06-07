"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";

type Action = "add" | "deduct" | "refund";

interface CreditActionModalProps {
  open: boolean;
  onClose: () => void;
  action: Action;
  userId: string;
  onSuccess: () => void;
}

const titles: Record<Action, string> = {
  add: "Add Credits",
  deduct: "Deduct Credits",
  refund: "Refund Credits",
};

const endpoints: Record<Action, (id: string) => string> = {
  add: (id) => `/api/admin/users/${id}/credits/add`,
  deduct: (id) => `/api/admin/users/${id}/credits/deduct`,
  refund: (id) => `/api/admin/users/${id}/refund`,
};

export function CreditActionModal({
  open,
  onClose,
  action,
  userId,
  onSuccess,
}: CreditActionModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setAmount("");
    setNote("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    const rupees = parseFloat(amount);
    if (!rupees || rupees <= 0 || isNaN(rupees)) {
      setError("Amount must be greater than 0");
      return;
    }

    const amountPaise = Math.round(rupees * 100);
    setLoading(true);

    try {
      await api.post(endpoints[action](userId), {
        amountPaise,
        note: note.trim() || undefined,
      });
      toast(`${titles[action]} successful`, "success");
      reset();
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { error?: string } } })
        ?.response;
      if (resp?.status === 403) {
        setError("You don't have permission for this action");
      } else if (resp?.data?.error) {
        setError(resp.data.error);
      } else {
        setError("Operation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={titles[action]}>
      <div className="space-y-4">
        <Input
          label={`Amount (\u20B9)`}
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Enter amount in rupees"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error && !note ? undefined : undefined}
        />
        <Input
          label="Note (optional)"
          placeholder="Reason for this action"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && (
          <div className="bg-danger/8 text-danger text-sm px-3 py-2 rounded-[var(--radius-badge)]">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={action === "deduct" ? "danger" : "primary"}
            onClick={handleSubmit}
            loading={loading}
          >
            Confirm {titles[action]}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
