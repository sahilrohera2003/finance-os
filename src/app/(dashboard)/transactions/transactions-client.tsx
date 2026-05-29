"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { transactionSchema } from "@/lib/validations";
import {
  createTransactionAction,
  deleteTransactionAction,
} from "@/server/actions/transaction.actions";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type Account = { _id: string; name: string; type: string };
type Category = { _id: string; name: string; type: "INCOME" | "EXPENSE" };
type Tag = { _id: string; name: string };
type FormValues = z.infer<typeof transactionSchema>;

const ALL = "__all__";

export function TransactionsClient({
  transactions,
  accounts,
  categories,
  tags,
  filters,
}: {
  transactions: any[];
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  filters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<any | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      tagIds: [],
      description: "",
      transactionDate: new Date(),
    },
  });
  const type = form.watch("type");

  function openCreate() {
    form.reset({
      type: "EXPENSE",
      amount: 0,
      tagIds: [],
      description: "",
      transactionDate: new Date(),
      accountId: accounts[0]?._id,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = await createTransactionAction(values);
    if (res.success) {
      toast({ title: "Transaction recorded", variant: "success" });
      setOpen(false);
    } else {
      toast({ title: "Error", description: res.error, variant: "error" });
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteTransactionAction(toDelete._id);
    if (res.success) toast({ title: "Transaction deleted", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v) as [string, string][]
    );
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.push(`/transactions?${params.toString()}`);
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const relevantCategories = categories.filter((c) =>
    type === "INCOME" ? c.type === "INCOME" : c.type === "EXPENSE"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Record and review income, expenses, and transfers."
        action={
          <Button onClick={openCreate} disabled={accounts.length === 0}>
            <Plus className="h-4 w-4" /> New Transaction
          </Button>
        }
      />

      {accounts.length === 0 && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Create an account first before recording transactions.
        </p>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <FilterSelect
            label="Type"
            value={filters.type ?? ALL}
            onChange={(v) => setFilter("type", v)}
            options={[
              { value: ALL, label: "All" },
              { value: "INCOME", label: "Income" },
              { value: "EXPENSE", label: "Expense" },
              { value: "TRANSFER", label: "Transfer" },
            ]}
          />
          <FilterSelect
            label="Account"
            value={filters.accountId ?? ALL}
            onChange={(v) => setFilter("accountId", v)}
            options={[{ value: ALL, label: "All" }, ...accounts.map((a) => ({ value: a._id, label: a.name }))]}
          />
          <FilterSelect
            label="Category"
            value={filters.categoryId ?? ALL}
            onChange={(v) => setFilter("categoryId", v)}
            options={[{ value: ALL, label: "All" }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
          />
          <FilterSelect
            label="Tag"
            value={filters.tagId ?? ALL}
            onChange={(v) => setFilter("tagId", v)}
            options={[{ value: ALL, label: "All" }, ...tags.map((t) => ({ value: t._id, label: t.name }))]}
          />
          <div className="flex flex-col gap-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              className="h-9 w-[150px]"
              defaultValue={filters.from ?? ""}
              onChange={(e) => setFilter("from", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              className="h-9 w-[150px]"
              defaultValue={filters.to ?? ""}
              onChange={(e) => setFilter("to", e.target.value)}
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/transactions")}>
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Adjust your filters or record a new transaction."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Account</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TxRow key={t._id} tx={t} onDelete={() => setToDelete(t)} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={type} onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="INCOME">Income</TabsTrigger>
                <TabsTrigger value="EXPENSE">Expense</TabsTrigger>
                <TabsTrigger value="TRANSFER">Transfer</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" {...form.register("amount")} />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>

            {type === "TRANSFER" ? (
              <div className="grid grid-cols-2 gap-3">
                <AccountSelect
                  label="From"
                  accounts={accounts}
                  value={form.watch("fromAccountId")}
                  onChange={(v) => form.setValue("fromAccountId", v)}
                  error={form.formState.errors.fromAccountId?.message}
                />
                <AccountSelect
                  label="To"
                  accounts={accounts}
                  value={form.watch("toAccountId")}
                  onChange={(v) => form.setValue("toAccountId", v)}
                  error={form.formState.errors.toAccountId?.message}
                />
              </div>
            ) : (
              <>
                <AccountSelect
                  label="Account"
                  accounts={accounts}
                  value={form.watch("accountId")}
                  onChange={(v) => form.setValue("accountId", v)}
                  error={form.formState.errors.accountId?.message}
                />
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.watch("categoryId") ?? ""}
                    onValueChange={(v) => form.setValue("categoryId", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {relevantCategories.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                onChange={(e) => form.setValue("transactionDate", new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Optional note" {...form.register("description")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete transaction?"
        description="Account balances will be adjusted to reverse this transaction."
        onConfirm={handleDelete}
      />
    </div>
  );
}

function TxRow({ tx, onDelete }: { tx: any; onDelete: () => void }) {
  const isIncome = tx.type === "INCOME";
  const isExpense = tx.type === "EXPENSE";
  const Icon = isIncome ? ArrowDownLeft : isExpense ? ArrowUpRight : ArrowLeftRight;
  const account =
    tx.type === "TRANSFER"
      ? `${tx.fromAccountId?.name ?? "—"} → ${tx.toAccountId?.name ?? "—"}`
      : tx.accountId?.name ?? "—";

  return (
    <TableRow>
      <TableCell>
        <Badge variant={isIncome ? "success" : isExpense ? "destructive" : "secondary"} className="gap-1">
          <Icon className="h-3 w-3" /> {tx.type}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate font-medium">
        {tx.description || tx.categoryId?.name || "—"}
      </TableCell>
      <TableCell className="hidden sm:table-cell text-muted-foreground">{account}</TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {tx.categoryId?.name ?? "—"}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-muted-foreground">
        {formatDate(tx.transactionDate)}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-semibold",
          isIncome && "text-emerald-600 dark:text-emerald-400",
          isExpense && "text-destructive"
        )}
      >
        {isExpense ? "-" : isIncome ? "+" : ""}
        {formatCurrency(tx.amount)}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AccountSelect({
  label,
  accounts,
  value,
  onChange,
  error,
}: {
  label: string;
  accounts: Account[];
  value?: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
