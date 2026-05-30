import { handler, ok } from "@/lib/api";
import { splitGroupSchema } from "@/lib/validations";
import { listGroupsWithSummary, createGroup } from "@/server/services/split.service";

export const GET = handler(async ({ userId }) => ok(await listGroupsWithSummary(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = splitGroupSchema.parse(await req.json());
  return ok(await createGroup(userId, body), 201);
});
