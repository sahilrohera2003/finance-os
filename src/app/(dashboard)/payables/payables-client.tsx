"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ReceiptText, Pencil, Trash2, CheckCircle2, MoreVertical } from "lucide-react";
import { payableSchema } from "@/lib/validations";
import {
  createPayableAction,
  updatePayableAction,
  deletePayableAction,
  markPaidAction,
} from "@/server/actions/payable.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FormValues = z.infer<typeof payableSchema>;
type Account = { _id: string; name: string };
type Payable = {
  _id: string;
  personName: string;
  amount: number;
  description?: string;
  dueDate?: string;
  status: "PENDING" | "PAID";
  paidDate?: string;
};

export function PayablesClient({
  payables,
  accounts,
}: {
  payables: Payable[];
  accounts: Account[];
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Payable | null>(null);
  const [toDelete, setToDelete] = React.useState<Payable | null>(null);
  const [paying, setPaying] = React.useState<Payable | null>(null);
  const [accountId, setAccountId] = React.useState(accounts[0]?._id ?? "");

  const form = useForm<FormValues>({
    resolver: zodResolver(payableSchema),
    defaultValues: { personName: "", amount: 0, description: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ personName: "", amount: 0, description: "" });
    setOpen(true);
  }
  function openEdit(p: Payable) {
    setEditing(p);
    form.reset({
      personName: p.personName,
      amount: p.amount,
      description: p.description ?? "",
      dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = editing
      ? await updatePayableAction(editing._id, values)
      : await createPayableAction(values);
    if (res.success) {
      toast({ title: editing ? "Updated" : "Payable added", variant: "success" });
      setOpen(false);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function confirmPay() {
    if (!paying) return;
    const res = await markPaidAction(paying._id, { paidFromAccountId: accountId, paidDate: new Date() });
    if (res.success) {
      toast({ title: "Marked as paid", description: "Account debited.", variant: "success" });
      setPaying(null);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deletePayableAction(toDelete._id);
    if (res.success) toast({ title: "Deleted", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const pending = payables.filter((p) => p.status === "PENDING");
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payables"
        description={`Money you owe · ${formatCurrency(pendingTotal)} pending`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>}
      />

      {payables.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No payables"
          description="Track money you owe others and mark it paid from an account."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {payables.map((p) => (
            <Card key={p._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{p.personName}</p>
                    <p className="text-lg font-bold">{formatCurrency(p.amount)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={p.status === "PAID" ? "success" : "warning"}>{p.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {p.status === "PENDING" && (
                          <>
                            <DropdownMenuItem onClick={() => { setPaying(p); setAccountId(accounts[0]?._id ?? ""); }}>
                              <CheckCircle2 className="h-4 w-4" /> Mark paid
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(p)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.status === "PAID" && p.paidDate
                    ? `Paid ${formatDate(p.paidDate)}`
                    : p.dueDate
                    ? `Due ${formatDate(p.dueDate)}`
                    : "No date set"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Payable" : "New Payable"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Person</Label>
              <Input {...form.register("personName")} />
              {form.formState.errors.personName && (
                <p className="text-xs text-destructive">{form.formState.errors.personName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" {...form.register("amount")} />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                defaultValue={editing?.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => form.setValue("dueDate", e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} {...form.register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatCurrency(paying?.amount ?? 0)} to {paying?.personName} will be debited from:
            </p>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>Cancel</Button>
            <Button onClick={confirmPay} disabled={!accountId}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete payable?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
