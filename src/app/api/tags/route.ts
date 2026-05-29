import { handler, ok } from "@/lib/api";
import { tagSchema } from "@/lib/validations";
import { listTags, createTag } from "@/server/services/taxonomy.service";

export const GET = handler(async ({ userId }) => ok(await listTags(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = tagSchema.parse(await req.json());
  return ok(await createTag(userId, body), 201);
});
