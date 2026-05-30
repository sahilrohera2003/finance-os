"use client";

import * as React from "react";
import { settlementSchema } from "@/lib/validations";
import { createSettlementAction } from "@/server/actions/split.actions";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = { _id: string; name: string };

export function SettleDialog({
  target,
  accounts,
  groupId = null,
  onClose,
}: {
  target: { name: string; balance: number } | null;
  accounts: Account[];
  groupId?: string | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [direction, setDirection] = React.useState<"I_RECEIVED" | "I_PAID">("I_RECEIVED");
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState<string>("none");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (target) {
      setDirection(target.balance >= 0 ? "I_RECEIVED" : "I_PAID");
      setAmount(Math.abs(target.balance).toFixed(2));
      setAccountId("none");
      setDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [target]);

  async function submit() {
    setError(null);
    const payload = {
      contactName: target?.name ?? "",
      direction,
      amount: parseFloat(amount) || 0,
      accountId: accountId === "none" ? "" : accountId,
      groupId: groupId ?? "",
      date: new Date(date),
      note: "",
    };
    const parsed = settlementSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    setSaving(true);
    const res = await createSettlementAction(parsed.data);
    setSaving(false);
    if (res.success) {
      toast({ title: "Settled up", variant: "success" });
      onClose();
    } else setError(res.error);
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Settle up with {target?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "I_RECEIVED" | "I_PAID")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="I_RECEIVED">{target?.name} paid me</SelectItem>
                <SelectItem value="I_PAID">I paid {target?.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account (optional)</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Don&apos;t affect an account</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {direction === "I_RECEIVED" ? "Credits" : "Debits"} the chosen account so balances stay accurate.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Record settlement"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
