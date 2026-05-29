"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CalendarClock, Pencil, Trash2, MoreVertical } from "lucide-react";
import { obligationSchema } from "@/lib/validations";
import { OBLIGATION_CATEGORIES } from "@/lib/constants";
import {
  createObligationAction,
  updateObligationAction,
  deleteObligationAction,
} from "@/server/actions/obligation.actions";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

type FormValues = z.infer<typeof obligationSchema>;
type Obligation = {
  _id: string;
  name: string;
  amount: number;
  category: (typeof OBLIGATION_CATEGORIES)[number];
  dueDay: number;
  active: boolean;
};

const defaults: FormValues = { name: "", amount: 0, category: "OTHER", dueDay: 1, active: true };

export function ObligationsClient({ obligations }: { obligations: Obligation[] }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Obligation | null>(null);
  const [toDelete, setToDelete] = React.useState<Obligation | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(obligationSchema), defaultValues: defaults });

  function openCreate() {
    setEditing(null);
    form.reset(defaults);
    setOpen(true);
  }
  function openEdit(o: Obligation) {
    setEditing(o);
    form.reset({ name: o.name, amount: o.amount, category: o.category, dueDay: o.dueDay, active: o.active });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = editing
      ? await updateObligationAction(editing._id, values)
      : await createObligationAction(values);
    if (res.success) {
      toast({ title: editing ? "Updated" : "Obligation added", variant: "success" });
      setOpen(false);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteObligationAction(toDelete._id);
    if (res.success) toast({ title: "Deleted", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const activeTotal = obligations.filter((o) => o.active).reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Obligations"
        description={`Recurring commitments · ${formatCurrency(activeTotal)} / month`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>}
      />

      {obligations.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No obligations"
          description="Add recurring commitments like rent, EMIs, subscriptions, and SIPs."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {obligations.map((o) => (
            <Card key={o._id} className={o.active ? "" : "opacity-60"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{o.name}</p>
                    <Badge variant="secondary" className="mt-1">{o.category}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(o)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-3 text-lg font-bold">{formatCurrency(o.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  Due day {o.dueDay} · {o.active ? "Active" : "Paused"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Obligation" : "New Obligation"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" {...form.register("amount")} />
              </div>
              <div className="space-y-2">
                <Label>Due day</Label>
                <Input type="number" min={1} max={31} {...form.register("dueDay")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v as FormValues["category"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBLIGATION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Active</Label>
              <Switch checked={form.watch("active")} onCheckedChange={(v) => form.setValue("active", v)} />
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
        title="Delete obligation?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
