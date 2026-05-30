import { handler, ok } from "@/lib/api";
import { splitGroupSchema } from "@/lib/validations";
import { getGroupDetail, updateGroup, deleteGroup } from "@/server/services/split.service";

export const GET = handler(async ({ userId, params }) =>
  ok(await getGroupDetail(userId, params.id))
);

export const PUT = handler(async ({ userId, req, params }) => {
  const body = splitGroupSchema.parse(await req.json());
  return ok(await updateGroup(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteGroup(userId, params.id))
);
