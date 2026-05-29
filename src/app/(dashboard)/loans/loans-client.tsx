"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Landmark, Pencil, Trash2, MoreVertical } from "lucide-react";
import { loanSchema } from "@/lib/validations";
import {
  createLoanAction,
  updateLoanAction,
  deleteLoanAction,
} from "@/server/actions/loan.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FormValues = z.infer<typeof loanSchema>;
type Loan = {
  _id: string;
  lenderName: string;
  totalAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  interestRate: number;
  startDate?: string;
  endDate?: string;
  nextDueDate?: string;
  status: "ACTIVE" | "CLOSED";
};

const defaults: FormValues = {
  lenderName: "",
  totalAmount: 0,
  outstandingAmount: 0,
  emiAmount: 0,
  interestRate: 0,
  status: "ACTIVE",
};

export function LoansClient({ loans }: { loans: Loan[] }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Loan | null>(null);
  const [toDelete, setToDelete] = React.useState<Loan | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(loanSchema), defaultValues: defaults });

  function openCreate() {
    setEditing(null);
    form.reset(defaults);
    setOpen(true);
  }
  function openEdit(l: Loan) {
    setEditing(l);
    form.reset({
      lenderName: l.lenderName,
      totalAmount: l.totalAmount,
      outstandingAmount: l.outstandingAmount,
      emiAmount: l.emiAmount,
      interestRate: l.interestRate,
      status: l.status,
      startDate: l.startDate ? new Date(l.startDate) : undefined,
      endDate: l.endDate ? new Date(l.endDate) : undefined,
      nextDueDate: l.nextDueDate ? new Date(l.nextDueDate) : undefined,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = editing
      ? await updateLoanAction(editing._id, values)
      : await createLoanAction(values);
    if (res.success) {
      toast({ title: editing ? "Loan updated" : "Loan added", variant: "success" });
      setOpen(false);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteLoanAction(toDelete._id);
    if (res.success) toast({ title: "Deleted", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const active = loans.filter((l) => l.status === "ACTIVE");
  const outstanding = active.reduce((s, l) => s + l.outstandingAmount, 0);
  const emiTotal = active.reduce((s, l) => s + l.emiAmount, 0);

  const dateField = (name: "startDate" | "endDate" | "nextDueDate", label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="date"
        defaultValue={
          editing && editing[name] ? new Date(editing[name] as string).toISOString().slice(0, 10) : ""
        }
        onChange={(e) => form.setValue(name, e.target.value ? new Date(e.target.value) : undefined)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        description="Track outstanding loans and EMIs."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Loan</Button>}
      />

      {active.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Active Loans" value={String(active.length)} icon={Landmark} />
          <StatCard label="Total Outstanding" value={formatCurrency(outstanding)} icon={Landmark} tone="negative" />
          <StatCard label="Monthly EMI" value={formatCurrency(emiTotal)} icon={Landmark} />
        </div>
      )}

      {loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No loans"
          description="Add loans to track outstanding balances and EMIs against your net worth."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Loan</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {loans.map((l) => {
            const progress = l.totalAmount > 0 ? 1 - l.outstandingAmount / l.totalAmount : 0;
            return (
              <Card key={l._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{l.lenderName}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.interestRate}% interest{l.emiAmount ? ` · EMI ${formatCurrency(l.emiAmount)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={l.status === "ACTIVE" ? "warning" : "success"}>{l.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(l)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="text-lg font-bold">{formatCurrency(l.outstandingAmount)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">of {formatCurrency(l.totalAmount)}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                  {l.nextDueDate && (
                    <p className="mt-2 text-xs text-muted-foreground">Next due {formatDate(l.nextDueDate)}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Loan" : "New Loan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Lender</Label>
              <Input {...form.register("lenderName")} />
              {form.formState.errors.lenderName && (
                <p className="text-xs text-destructive">{form.formState.errors.lenderName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total amount</Label>
                <Input type="number" step="0.01" {...form.register("totalAmount")} />
              </div>
              <div className="space-y-2">
                <Label>Outstanding</Label>
                <Input type="number" step="0.01" {...form.register("outstandingAmount")} />
              </div>
              <div className="space-y-2">
                <Label>EMI amount</Label>
                <Input type="number" step="0.01" {...form.register("emiAmount")} />
              </div>
              <div className="space-y-2">
                <Label>Interest rate (%)</Label>
                <Input type="number" step="0.01" {...form.register("interestRate")} />
              </div>
              {dateField("startDate", "Start date")}
              {dateField("endDate", "End date")}
              {dateField("nextDueDate", "Next due date")}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete loan?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
