import { handler, ok } from "@/lib/api";
import { deleteCategory } from "@/server/services/taxonomy.service";

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteCategory(userId, params.id))
);
