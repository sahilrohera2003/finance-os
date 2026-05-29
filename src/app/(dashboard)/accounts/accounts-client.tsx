"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Wallet, Banknote, Smartphone, Pencil, Trash2, MoreVertical } from "lucide-react";
import { accountSchema } from "@/lib/validations";
import { ACCOUNT_TYPES } from "@/lib/constants";
import {
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
} from "@/server/actions/account.actions";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

type FormValues = z.infer<typeof accountSchema>;
type Account = FormValues & { _id: string };

const TYPE_ICONS = { CASH: Banknote, BANK: Wallet, WALLET: Smartphone } as const;

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | null>(null);
  const [toDelete, setToDelete] = React.useState<Account | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", type: "BANK", currentBalance: 0, notes: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", type: "BANK", currentBalance: 0, notes: "" });
    setOpen(true);
  }

  function openEdit(acc: Account) {
    setEditing(acc);
    form.reset({ name: acc.name, type: acc.type, currentBalance: acc.currentBalance, notes: acc.notes ?? "" });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = editing
      ? await updateAccountAction(editing._id, values)
      : await createAccountAction(values);
    if (res.success) {
      toast({ title: editing ? "Account updated" : "Account created", variant: "success" });
      setOpen(false);
    } else {
      toast({ title: "Error", description: res.error, variant: "error" });
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteAccountAction(toDelete._id);
    if (res.success) toast({ title: "Account deleted", variant: "success" });
    else toast({ title: "Cannot delete", description: res.error, variant: "error" });
  }

  const total = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description={`Total balance across accounts: ${formatCurrency(total)}`}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Account
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your cash, bank, and wallet accounts to start tracking balances."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Account</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const Icon = TYPE_ICONS[acc.type];
            return (
              <Card key={acc._id}>
                <CardContent className="flex items-start justify-between gap-2 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{acc.name}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{acc.type}</p>
                      <p className="mt-2 text-lg font-bold">{formatCurrency(acc.currentBalance)}</p>
                      {acc.notes && <p className="mt-1 text-xs text-muted-foreground">{acc.notes}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(acc)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(acc)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Account" : "New Account"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. HDFC Savings" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as FormValues["type"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editing ? "Current Balance" : "Opening Balance"}</Label>
              <Input type="number" step="0.01" {...form.register("currentBalance")} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...form.register("notes")} />
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
        title="Delete account?"
        description={`"${toDelete?.name}" will be permanently removed.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
