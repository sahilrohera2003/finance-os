"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { splitExpenseSchema } from "@/lib/validations";
import { createSplitExpenseAction } from "@/server/actions/split.actions";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
const NO_GROUP = "__none__";

export type GroupLite = { _id: string; name: string; members: string[] };
type Participant = { name: string; amount: number };

export function distribute(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor((total / n) * 100) / 100;
  const amounts = Array(n).fill(base);
  const remainder = Math.round((total - base * n) * 100) / 100;
  amounts[0] = Math.round((amounts[0] + remainder) * 100) / 100;
  return amounts;
}

function membersToParticipants(members: string[]): Participant[] {
  const rows = [{ name: ME, amount: 0 }, ...members.map((m) => ({ name: m, amount: 0 }))];
  return rows.length >= 2 ? rows : [{ name: ME, amount: 0 }, { name: "", amount: 0 }];
}

export function AddSplitDialog({
  open,
  onOpenChange,
  groups,
  defaultGroupId = null,
  lockGroup = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groups: GroupLite[];
  defaultGroupId?: string | null;
  lockGroup?: boolean;
}) {
  const { toast } = useToast();
  const [description, setDescription] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = React.useState<"EQUAL" | "EXACT">("EQUAL");
  const [paidBy, setPaidBy] = React.useState(ME);
  const [groupId, setGroupId] = React.useState<string>(defaultGroupId ?? NO_GROUP);
  const [people, setPeople] = React.useState<Participant[]>([{ name: ME, amount: 0 }, { name: "", amount: 0 }]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDescription(""); setTotal(""); setDate(new Date().toISOString().slice(0, 10));
    setMethod("EQUAL"); setPaidBy(ME); setError(null);
    const gid = defaultGroupId ?? NO_GROUP;
    setGroupId(gid);
    const grp = groups.find((g) => g._id === gid);
    setPeople(grp ? membersToParticipants(grp.members) : [{ name: ME, amount: 0 }, { name: "", amount: 0 }]);
  }, [open, defaultGroupId, groups]);

  function onGroupChange(value: string) {
    setGroupId(value);
    const grp = groups.find((g) => g._id === value);
    if (grp && grp.members.length) setPeople(membersToParticipants(grp.members));
  }

  const totalNum = parseFloat(total) || 0;
  const validNames = people.map((p) => p.name.trim()).filter(Boolean);
  const equalAmounts = method === "EQUAL" ? distribute(totalNum, validNames.length) : [];

  function displayedAmount(idx: number): number {
    if (method === "EXACT") return people[idx].amount;
    const validIdx = people.slice(0, idx + 1).filter((p) => p.name.trim()).length - 1;
    return people[idx].name.trim() ? equalAmounts[validIdx] ?? 0 : 0;
  }

  const setName = (i: number, name: string) => setPeople((p) => p.map((x, idx) => (idx === i ? { ...x, name } : x)));
  const setAmount = (i: number, amount: number) => setPeople((p) => p.map((x, idx) => (idx === i ? { ...x, amount } : x)));
  const addPerson = () => setPeople((p) => [...p, { name: "", amount: 0 }]);
  const removePerson = (i: number) => setPeople((p) => p.filter((_, idx) => idx !== i));

  async function submit() {
    setError(null);
    const participants = people
      .map((p, idx) => ({ name: p.name.trim(), amount: method === "EQUAL" ? displayedAmount(idx) : Number(p.amount) }))
      .filter((p) => p.name);

    const payload = {
      description,
      totalAmount: totalNum,
      groupId: groupId === NO_GROUP ? "" : groupId,
      paidBy,
      splitMethod: method,
      participants,
      date: new Date(date),
      notes: "",
    };
    const parsed = splitExpenseSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSaving(true);
    const res = await createSplitExpenseAction(parsed.data);
    setSaving(false);
    if (res.success) {
      toast({ title: "Expense split", variant: "success" });
      onOpenChange(false);
    } else setError(res.error);
  }

  const sum = people.reduce((s, _p, idx) => s + (people[idx].name.trim() ? displayedAmount(idx) : 0), 0);
  const payerOptions = Array.from(new Set([ME, ...validNames.filter((n) => n !== ME)]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Split an expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          {!lockGroup && (
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={groupId} onValueChange={onGroupChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g. Hotel booking" value={description} onChange={(e) => setDescription(e.target.value)} />
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
