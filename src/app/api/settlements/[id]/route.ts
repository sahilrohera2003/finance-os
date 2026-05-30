import { handler, ok } from "@/lib/api";
import { deleteSettlement } from "@/server/services/split.service";

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteSettlement(userId, params.id))
);
