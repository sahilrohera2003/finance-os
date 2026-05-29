import { handler, ok } from "@/lib/api";
import { assetSchema } from "@/lib/validations";
import { updateAsset, deleteAsset } from "@/server/services/asset.service";

export const PUT = handler(async ({ userId, req, params }) => {
  const body = assetSchema.parse(await req.json());
  return ok(await updateAsset(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteAsset(userId, params.id))
);
