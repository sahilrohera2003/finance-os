"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Gem, Pencil, Trash2, MoreVertical } from "lucide-react";
import { assetSchema } from "@/lib/validations";
import { ASSET_TYPES } from "@/lib/constants";
import {
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
} from "@/server/actions/asset.actions";
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

type FormValues = z.infer<typeof assetSchema>;
type Asset = {
  _id: string;
  name: string;
  assetType: (typeof ASSET_TYPES)[number];
  currentValue: number;
  notes?: string;
};

const defaults: FormValues = { name: "", assetType: "OTHER", currentValue: 0, notes: "" };

export function AssetsClient({ assets }: { assets: Asset[] }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Asset | null>(null);
  const [toDelete, setToDelete] = React.useState<Asset | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(assetSchema), defaultValues: defaults });

  function openCreate() {
    setEditing(null);
    form.reset(defaults);
    setOpen(true);
  }
  function openEdit(a: Asset) {
    setEditing(a);
    form.reset({ name: a.name, assetType: a.assetType, currentValue: a.currentValue, notes: a.notes ?? "" });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const res = editing
      ? await updateAssetAction(editing._id, values)
      : await createAssetAction(values);
    if (res.success) {
      toast({ title: editing ? "Updated" : "Asset added", variant: "success" });
      setOpen(false);
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteAssetAction(toDelete._id);
    if (res.success) toast({ title: "Deleted", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const total = assets.reduce((s, a) => s + a.currentValue, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description={`Asset registry · ${formatCurrency(total)} total value`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Asset</Button>}
      />

      {assets.length === 0 ? (
        <EmptyState
          icon={Gem}
          title="No assets"
          description="Register valuables like property, gold, or vehicles to include in your net worth."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Asset</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <Card key={a._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <Badge variant="secondary" className="mt-1">{a.assetType}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(a)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-3 text-lg font-bold">{formatCurrency(a.currentValue)}</p>
                {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "New Asset"}</DialogTitle>
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
                <Label>Type</Label>
                <Select
                  value={form.watch("assetType")}
                  onValueChange={(v) => form.setValue("assetType", v as FormValues["assetType"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current value</Label>
                <Input type="number" step="0.01" {...form.register("currentValue")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...form.register("notes")} />
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
        title="Delete asset?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
