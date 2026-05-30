import { handler, ok } from "@/lib/api";
import { deleteSplitExpense } from "@/server/services/split.service";

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteSplitExpense(userId, params.id))
);
