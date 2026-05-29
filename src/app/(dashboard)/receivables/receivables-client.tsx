"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, HandCoins, Pencil, Trash2, CheckCircle2, MoreVertical } from "lucide-react";
import { receivableSchema } from "@/lib/validations";
import {
  createReceivableAction,
  updateReceivableAction,
  deleteReceivableAction,
  markReceivedAction,
} from "@/server/actions/receivable.actions";
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

type FormValues = z.infer<typeof receivableSchema>;
type Account = { _id: string; name: string };
type Receivable = {
  _id: string;
  personName: string;
  amount: number;
  description?: string;
  expectedDate?: string;
  status: "PENDING" | "RECEIVED";
  receivedDate?: string;
};

export function ReceivablesClient({
  receivables,
  accounts,
}: {
  receivables: Receivable[];
  accounts: Account[];
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Receivable | null>(null);
  const [toDelete, setToDelete] = React.useState<Receivable | null>(null);
  const [receiving, setReceiving] = React.useState<Receivable | null>(null);
  const [accountId, setAccountId] = React.useState(accounts[0]?._id ?? "");

  const form = useForm<FormValues>({
    resolver: zodResolver(receivableSchema),
    defaultValues: { personName: "", amount: 0, description: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ personName: "", amount: 0, description: "" });
    setOpen(true);
  }
  function openEdit(r: Receivable) {
    setEditing(r);
    form.reset({
      personName: r.personName,
      amount: r.amount,
      description: r.description ?? "",
      expectedDate: r.expectedDate ? new Date(r.expectedDate) : undefined,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = editing
      ? await updateReceivableAction(editing._id, values)
      : await createReceivableAction(values);
    if (res.success) {
      toast({ title: editing ? "Updated" : "Receivable added", variant: "success" });
      setOpen(false);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function confirmReceive() {
    if (!receiving) return;
    const res = await markReceivedAction(receiving._id, { accountId, receivedDate: new Date() });
    if (res.success) {
      toast({ title: "Marked as received", description: "Account credited.", variant: "success" });
      setReceiving(null);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteReceivableAction(toDelete._id);
    if (res.success) toast({ title: "Deleted", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const pending = receivables.filter((r) => r.status === "PENDING");
  const pendingTotal = pending.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receivables"
        description={`Money owed to you · ${formatCurrency(pendingTotal)} pending`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>}
      />

      {receivables.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No receivables"
          description="Track money others owe you and mark it received when it arrives."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {receivables.map((r) => (
            <Card key={r._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.personName}</p>
                    <p className="text-lg font-bold">{formatCurrency(r.amount)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={r.status === "RECEIVED" ? "success" : "warning"}>{r.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {r.status === "PENDING" && (
                          <>
                            <DropdownMenuItem onClick={() => { setReceiving(r); setAccountId(accounts[0]?._id ?? ""); }}>
                              <CheckCircle2 className="h-4 w-4" /> Mark received
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(r)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {r.status === "RECEIVED" && r.receivedDate
                    ? `Received ${formatDate(r.receivedDate)}`
                    : r.expectedDate
                    ? `Expected ${formatDate(r.expectedDate)}`
                    : "No date set"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Receivable" : "New Receivable"}</DialogTitle>
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
              <Label>Expected date</Label>
              <Input
                type="date"
                defaultValue={editing?.expectedDate ? new Date(editing.expectedDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => form.setValue("expectedDate", e.target.value ? new Date(e.target.value) : undefined)}
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

      {/* Mark received */}
      <Dialog open={!!receiving} onOpenChange={(o) => !o && setReceiving(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as received</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatCurrency(receiving?.amount ?? 0)} from {receiving?.personName} will be credited to:
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
            <Button variant="outline" onClick={() => setReceiving(null)}>Cancel</Button>
            <Button onClick={confirmReceive} disabled={!accountId}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete receivable?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
