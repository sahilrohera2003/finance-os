"use client";

import * as React from "react";
import {
  Plus,
  Users,
  Trash2,
  ArrowLeftRight,
  HandCoins,
  TrendingUp,
  TrendingDown,
  Scale,
  X,
} from "lucide-react";
import {
  createSplitExpenseAction,
  deleteSplitExpenseAction,
  createSettlementAction,
  deleteSettlementAction,
} from "@/server/actions/split.actions";
import { splitExpenseSchema, settlementSchema } from "@/lib/validations";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ME = "Me";

type Account = { _id: string; name: string };
type Participant = { name: string; amount: number };
type SplitExpense = {
  _id: string;
  description: string;
  totalAmount: number;
  paidBy: string;
  splitMethod: string;
  participants: Participant[];
  date: string;
  notes?: string;
};
type Settlement = {
  _id: string;
  contactName: string;
  direction: "I_RECEIVED" | "I_PAID";
  amount: number;
  accountId?: { _id: string; name: string } | string | null;
  date: string;
  note?: string;
};
type ContactBalance = { name: string; balance: number };
type Summary = { contacts: ContactBalance[]; toCollect: number; toPay: number; net: number };

function distribute(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor((total / n) * 100) / 100;
  const amounts = Array(n).fill(base);
  const remainder = Math.round((total - base * n) * 100) / 100;
  amounts[0] = Math.round((amounts[0] + remainder) * 100) / 100;
  return amounts;
}

export function SplitsClient({
  expenses,
  settlements,
  summary,
  accounts,
}: {
  expenses: SplitExpense[];
  settlements: Settlement[];
  summary: Summary;
  accounts: Account[];
}) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = React.useState(false);
  const [settle, setSettle] = React.useState<{ name: string; balance: number } | null>(null);
  const [delExpense, setDelExpense] = React.useState<SplitExpense | null>(null);
  const [delSettlement, setDelSettlement] = React.useState<Settlement | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Splits & Settlements"
        description="Split shared expenses and track who owes whom."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Split an expense
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="You'll collect" value={formatCurrency(summary.toCollect)} icon={TrendingUp} tone="positive" />
        <StatCard label="You'll pay" value={formatCurrency(summary.toPay)} icon={TrendingDown} tone="negative" />
        <StatCard
          label="Net position"
          value={formatCurrency(summary.net)}
          icon={Scale}
          tone={summary.net >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Per-person balances */}
      <Card>
        <CardHeader>
          <CardTitle>Balances by person</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              All settled up — no outstanding balances.
            </p>
          ) : (
            <ul className="divide-y">
              {summary.contacts.map((c) => {
                const owesMe = c.balance > 0;
                return (
                  <li key={c.name} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className={cn("text-xs", owesMe ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                          {owesMe ? "owes you" : "you owe"} {formatCurrency(Math.abs(c.balance))}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSettle({ name: c.name, balance: c.balance })}>
                      Settle up
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Split expenses */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Split expenses</CardTitle>
            <Badge variant="secondary">{expenses.length}</Badge>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No split expenses"
                description="Record a shared payment and split it among people."
                action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Split an expense</Button>}
              />
            ) : (
              <ul className="divide-y">
                {expenses.map((e) => (
                  <li key={e._id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(e.totalAmount)} · paid by {e.paidBy} · {formatDate(e.date)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.participants.map((p) => (
                          <span key={p.name} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {p.name} {formatCurrency(p.amount)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDelExpense(e)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Settlements */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Settlement history</CardTitle>
            <Badge variant="secondary">{settlements.length}</Badge>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <EmptyState icon={HandCoins} title="No settlements yet" description="Settle up a balance and it appears here." />
            ) : (
              <ul className="divide-y">
                {settlements.map((s) => {
                  const received = s.direction === "I_RECEIVED";
                  const acc = typeof s.accountId === "object" && s.accountId ? s.accountId.name : null;
                  return (
                    <li key={s._id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {received ? `${s.contactName} paid you` : `You paid ${s.contactName}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.date)}{acc ? ` · ${acc}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", received ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                          {received ? "+" : "-"}{formatCurrency(s.amount)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDelSettlement(s)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AddSplitDialog open={addOpen} onOpenChange={setAddOpen} />
      <SettleDialog target={settle} accounts={accounts} onClose={() => setSettle(null)} />

      <ConfirmDialog
        open={!!delExpense}
        onOpenChange={(o) => !o && setDelExpense(null)}
        title="Delete split expense?"
        description="This recalculates everyone's balances."
        onConfirm={async () => {
          if (!delExpense) return;
          const res = await deleteSplitExpenseAction(delExpense._id);
          if (res.success) toast({ title: "Deleted", variant: "success" });
          else toast({ title: "Error", description: res.error, variant: "error" });
        }}
      />
      <ConfirmDialog
        open={!!delSettlement}
        onOpenChange={(o) => !o && setDelSettlement(null)}
        title="Delete settlement?"
        description="If an account was linked, its balance will be reversed."
        onConfirm={async () => {
          if (!delSettlement) return;
          const res = await deleteSettlementAction(delSettlement._id);
          if (res.success) toast({ title: "Deleted", variant: "success" });
          else toast({ title: "Error", description: res.error, variant: "error" });
        }}
      />
    </div>
  );
}

/* ----------------------------- Add split dialog ----------------------------- */

function AddSplitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [description, setDescription] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = React.useState<"EQUAL" | "EXACT">("EQUAL");
  const [paidBy, setPaidBy] = React.useState(ME);
  const [people, setPeople] = React.useState<Participant[]>([
    { name: ME, amount: 0 },
    { name: "", amount: 0 },
  ]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDescription(""); setTotal(""); setDate(new Date().toISOString().slice(0, 10));
      setMethod("EQUAL"); setPaidBy(ME); setPeople([{ name: ME, amount: 0 }, { name: "", amount: 0 }]);
      setError(null);
    }
  }, [open]);

  const totalNum = parseFloat(total) || 0;
  const validNames = people.map((p) => p.name.trim()).filter(Boolean);
  const equalAmounts = method === "EQUAL" ? distribute(totalNum, validNames.length) : [];

  function displayedAmount(idx: number): number {
    if (method === "EXACT") return people[idx].amount;
    // map equal amounts onto only the valid (named) rows
    const validIdx = people.slice(0, idx + 1).filter((p) => p.name.trim()).length - 1;
    return people[idx].name.trim() ? equalAmounts[validIdx] ?? 0 : 0;
  }

  function setName(i: number, name: string) {
    setPeople((prev) => prev.map((p, idx) => (idx === i ? { ...p, name } : p)));
  }
  function setAmount(i: number, amount: number) {
    setPeople((prev) => prev.map((p, idx) => (idx === i ? { ...p, amount } : p)));
  }
  function addPerson() {
    setPeople((prev) => [...prev, { name: "", amount: 0 }]);
  }
  function removePerson(i: number) {
    setPeople((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError(null);
    const participants = people
      .map((p, idx) => ({ name: p.name.trim(), amount: method === "EQUAL" ? displayedAmount(idx) : Number(p.amount) }))
      .filter((p) => p.name);

    const payload = {
      description,
      totalAmount: totalNum,
      paidBy,
      splitMethod: method,
      participants,
      date: new Date(date),
      notes: "",
    };

    const parsed = splitExpenseSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "Please check the form.");
      return;
    }
    setSaving(true);
    const res = await createSplitExpenseAction(parsed.data);
    setSaving(false);
    if (res.success) {
      toast({ title: "Expense split", variant: "success" });
      onOpenChange(false);
    } else {
      setError(res.error);
    }
  }

  const sum = people.reduce((s, p, idx) => s + (p.name.trim() ? displayedAmount(idx) : 0), 0);
  const payerOptions = Array.from(new Set([ME, ...validNames.filter((n) => n !== ME)]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Split an expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g. Dinner at Olive" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Total amount</Label>
              <Input type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Paid by</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {payerOptions.map((n) => (
                    <SelectItem key={n} value={n}>{n === ME ? "Me" : n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Split</Label>
              <Tabs value={method} onValueChange={(v) => setMethod(v as "EQUAL" | "EXACT")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="EQUAL">Equally</TabsTrigger>
                  <TabsTrigger value="EXACT">Exact</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>People</Label>
              <span className={cn("text-xs", Math.abs(sum - totalNum) > 0.5 ? "text-destructive" : "text-muted-foreground")}>
                Shares: {formatCurrency(sum)} / {formatCurrency(totalNum)}
              </span>
            </div>
            <div className="space-y-2">
              {people.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={i === 0 ? "Me" : "Person name"}
                    value={p.name}
                    onChange={(e) => setName(i, e.target.value)}
                    disabled={i === 0 && p.name === ME}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28"
                    value={method === "EQUAL" ? displayedAmount(i).toFixed(2) : (p.amount || "")}
                    onChange={(e) => setAmount(i, parseFloat(e.target.value) || 0)}
                    disabled={method === "EQUAL"}
                  />
                  {people.length > 2 && i !== 0 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removePerson(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addPerson} type="button">
              <Plus className="h-4 w-4" /> Add person
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save split"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Settle dialog ----------------------------- */

function SettleDialog({
  target,
  accounts,
  onClose,
}: {
  target: { name: string; balance: number } | null;
  accounts: Account[];
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
              <SelectTrigger><SelectValue placeholder="Don't touch any account" /></SelectTrigger>
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
