import { handler, ok } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { listCategories, createCategory } from "@/server/services/taxonomy.service";

export const GET = handler(async ({ userId }) => ok(await listCategories(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = categorySchema.parse(await req.json());
  return ok(await createCategory(userId, body), 201);
});
