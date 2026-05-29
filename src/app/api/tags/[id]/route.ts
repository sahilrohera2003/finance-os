import { handler, ok } from "@/lib/api";
import { deleteTag } from "@/server/services/taxonomy.service";

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteTag(userId, params.id))
);
