"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Scale,
  Trash2,
  HandCoins,
  Users,
  FolderInput,
} from "lucide-react";
import {
  deleteSplitExpenseAction,
  deleteSettlementAction,
  assignExpenseGroupAction,
} from "@/server/actions/split.actions";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AddSplitDialog, type GroupLite } from "@/components/splits/add-split-dialog";
import { SettleDialog } from "@/components/splits/settle-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UNGROUPED = "ungrouped";

type Account = { _id: string; name: string };
type Summary = { toCollect: number; toPay: number; net: number; contacts: { name: string; balance: number }[] };
type Group = { _id: string; name: string; members: string[]; notes?: string };

export function GroupClient({
  scope,
  group,
  expenses,
  settlements,
  summary,
  groups,
  accounts,
}: {
  scope: string;
  group: Group;
  expenses: any[];
  settlements: any[];
  summary: Summary;
  groups: Group[];
  accounts: Account[];
}) {
  const { toast } = useToast();
  const isUngrouped = scope === UNGROUPED;
  const [addOpen, setAddOpen] = React.useState(false);
  const [settle, setSettle] = React.useState<{ name: string; balance: number } | null>(null);
  const [delExpense, setDelExpense] = React.useState<any | null>(null);
  const [delSettlement, setDelSettlement] = React.useState<any | null>(null);

  const groupLites: GroupLite[] = groups.map((g) => ({ _id: g._id, name: g.name, members: g.members }));

  async function move(expenseId: string, groupId: string | null) {
    const res = await assignExpenseGroupAction(expenseId, groupId);
    if (res.success) toast({ title: "Expense moved", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  return (
    <div className="space-y-6">
      <Link href="/splits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All groups
      </Link>

      <PageHeader
        title={group.name}
        description={
          isUngrouped
            ? "Expenses not assigned to any group."
            : `You + ${group.members.length} member${group.members.length === 1 ? "" : "s"}${group.members.length ? ` · ${group.members.join(", ")}` : ""}`
        }
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="You'll collect" value={formatCurrency(summary.toCollect)} icon={TrendingUp} tone="positive" />
        <StatCard label="You'll pay" value={formatCurrency(summary.toPay)} icon={TrendingDown} tone="negative" />
        <StatCard label="Net position" value={formatCurrency(summary.net)} icon={Scale} tone={summary.net >= 0 ? "positive" : "negative"} />
      </div>

      {/* Balances within this group */}
      <Card>
        <CardHeader><CardTitle>Balances</CardTitle></CardHeader>
        <CardContent>
          {summary.contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">All settled up in this group.</p>
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
        {/* Expenses */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Expenses</CardTitle>
            <Badge variant="secondary">{expenses.length}</Badge>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <EmptyState icon={Users} title="No expenses" description="Add a shared expense to this group." />
            ) : (
              <ul className="divide-y">
                {expenses.map((e) => (
                  <li key={e._id} className="flex items-start justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(e.totalAmount)} · paid by {e.paidBy} · {formatDate(e.date)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.participants.map((p: any) => (
                          <span key={p.name} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {p.name} {formatCurrency(p.amount)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <FolderInput className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Move to group</DropdownMenuLabel>
                        {groups.filter((g) => g._id !== scope).map((g) => (
                          <DropdownMenuItem key={g._id} onClick={() => move(e._id, g._id)}>
                            {g.name}
                          </DropdownMenuItem>
                        ))}
                        {!isUngrouped && (
                          <DropdownMenuItem onClick={() => move(e._id, null)}>Remove from group</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDelExpense(e)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Settlements */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Settlements</CardTitle>
            <Badge variant="secondary">{settlements.length}</Badge>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <EmptyState icon={HandCoins} title="No settlements yet" description="Settle a balance and it appears here." />
            ) : (
              <ul className="divide-y">
                {settlements.map((s) => {
                  const received = s.direction === "I_RECEIVED";
                  const acc = typeof s.accountId === "object" && s.accountId ? s.accountId.name : null;
                  return (
                    <li key={s._id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{received ? `${s.contactName} paid you` : `You paid ${s.contactName}`}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(s.date)}{acc ? ` · ${acc}` : ""}</p>
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

      <AddSplitDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        groups={groupLites}
        defaultGroupId={isUngrouped ? null : scope}
        lockGroup={!isUngrouped}
      />
      <SettleDialog target={settle} accounts={accounts} groupId={isUngrouped ? null : scope} onClose={() => setSettle(null)} />

      <ConfirmDialog
        open={!!delExpense}
        onOpenChange={(o) => !o && setDelExpense(null)}
        title="Delete expense?"
        description="This recalculates balances in this group."
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
