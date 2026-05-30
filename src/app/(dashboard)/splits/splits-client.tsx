"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
  Scale,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  FolderOpen,
  X,
} from "lucide-react";
import {
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
} from "@/server/actions/split.actions";
import { splitGroupSchema } from "@/lib/validations";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AddSplitDialog, type GroupLite } from "@/components/splits/add-split-dialog";
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

type Account = { _id: string; name: string };
type Summary = { toCollect: number; toPay: number; net: number; contacts: { name: string; balance: number }[] };
type Group = {
  _id: string;
  name: string;
  members: string[];
  notes?: string;
  summary: Summary;
  expenseCount: number;
};

export function SplitsClient({
  summary,
  groups,
  ungroupedCount,
  ungroupedSummary,
  accounts,
}: {
  summary: Summary;
  groups: Group[];
  ungroupedCount: number;
  ungroupedSummary: Summary | null;
  accounts: Account[];
}) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = React.useState(false);
  const [groupDialog, setGroupDialog] = React.useState<{ mode: "create" | "edit"; group?: Group } | null>(null);
  const [toDelete, setToDelete] = React.useState<Group | null>(null);

  const groupLites: GroupLite[] = groups.map((g) => ({ _id: g._id, name: g.name, members: g.members }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Splits & Settlements"
        description="Organise shared expenses into groups and track who owes whom."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGroupDialog({ mode: "create" })}>
              <Plus className="h-4 w-4" /> New group
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Split an expense
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="You'll collect" value={formatCurrency(summary.toCollect)} icon={TrendingUp} tone="positive" />
        <StatCard label="You'll pay" value={formatCurrency(summary.toPay)} icon={TrendingDown} tone="negative" />
        <StatCard label="Net position" value={formatCurrency(summary.net)} icon={Scale} tone={summary.net >= 0 ? "positive" : "negative"} />
      </div>

      {groups.length === 0 && ungroupedCount === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create a group like “Naggar trip” and add its shared expenses inside."
          action={<Button onClick={() => setGroupDialog({ mode: "create" })}><Plus className="h-4 w-4" /> New group</Button>}
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Groups</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GroupCard key={g._id} group={g} onEdit={() => setGroupDialog({ mode: "edit", group: g })} onDelete={() => setToDelete(g)} />
            ))}

            {ungroupedCount > 0 && (
              <Link href="/splits/ungrouped">
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">Ungrouped</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{ungroupedCount} expense{ungroupedCount > 1 ? "s" : ""} without a group</p>
                    <div className="mt-auto pt-3">
                      <NetLine summary={ungroupedSummary} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      )}

      <AddSplitDialog open={addOpen} onOpenChange={setAddOpen} groups={groupLites} />

      <GroupDialog
        state={groupDialog}
        onClose={() => setGroupDialog(null)}
        onSaved={() => toast({ title: "Saved", variant: "success" })}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.name}"?`}
        description="The group is removed. Its expenses are kept and moved to Ungrouped."
        onConfirm={async () => {
          if (!toDelete) return;
          const res = await deleteGroupAction(toDelete._id);
          if (res.success) toast({ title: "Group deleted", variant: "success" });
          else toast({ title: "Error", description: res.error, variant: "error" });
        }}
      />
    </div>
  );
}

function NetLine({ summary }: { summary: Summary | null }) {
  if (!summary || summary.net === 0) {
    return <p className="text-sm text-muted-foreground">All settled up</p>;
  }
  const positive = summary.net > 0;
  return (
    <p className={cn("text-sm font-semibold", positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
      {positive ? "You'll collect " : "You'll pay "}
      {formatCurrency(Math.abs(summary.net))}
    </p>
  );
}

function GroupCard({ group, onEdit, onDelete }: { group: Group; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative transition-colors hover:border-primary/40">
      <Link href={`/splits/${group._id}`} className="block">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-2 pr-6">
            <p className="font-semibold">{group.name}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {group.members.length + 1} member{group.members.length ? "s" : ""} · {group.expenseCount} expense{group.expenseCount === 1 ? "" : "s"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[11px]">Me</Badge>
            {group.members.slice(0, 4).map((m) => (
              <Badge key={m} variant="secondary" className="text-[11px]">{m}</Badge>
            ))}
            {group.members.length > 4 && (
              <Badge variant="secondary" className="text-[11px]">+{group.members.length - 4}</Badge>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between pt-4">
            <NetLine summary={group.summary} />
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Link>
      <div className="absolute right-3 top-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4" /> Edit group</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

function GroupDialog({
  state,
  onClose,
  onSaved,
}: {
  state: { mode: "create" | "edit"; group?: Group } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [members, setMembers] = React.useState<string[]>([""]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (state) {
      setName(state.group?.name ?? "");
      setMembers(state.group?.members?.length ? [...state.group.members] : [""]);
      setError(null);
    }
  }, [state]);

  async function submit() {
    setError(null);
    const cleaned = members.map((m) => m.trim()).filter(Boolean);
    const parsed = splitGroupSchema.safeParse({ name, members: cleaned, notes: "" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    setSaving(true);
    const res = state?.mode === "edit" && state.group
      ? await updateGroupAction(state.group._id, parsed.data)
      : await createGroupAction(parsed.data);
    setSaving(false);
    if (res.success) {
      onSaved();
      onClose();
    } else setError(res.error);
  }

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Edit group" : "New group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label>Group name</Label>
            <Input placeholder="e.g. Naggar trip" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Members (besides you)</Label>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Person name" value={m} onChange={(e) => setMembers((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))} />
                  {members.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setMembers((prev) => [...prev, ""])}>
              <Plus className="h-4 w-4" /> Add member
            </Button>
            <p className="text-xs text-muted-foreground">You are always a member. Members prefill when adding an expense.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save group"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
