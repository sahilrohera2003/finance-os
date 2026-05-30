"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { resetNetWorthHistoryAction } from "@/server/actions/networth.actions";

export function ResetHistoryButton() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" /> Reset history
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset net worth history?"
        description="Deletes all stored snapshots and starts a fresh baseline from your current figures. Past data points will be removed."
        confirmLabel="Reset"
        onConfirm={async () => {
          const res = await resetNetWorthHistoryAction();
          if (res.success) toast({ title: "History reset", description: "Rebaselined from current net worth.", variant: "success" });
          else toast({ title: "Error", description: res.error, variant: "error" });
        }}
      />
    </>
  );
}
