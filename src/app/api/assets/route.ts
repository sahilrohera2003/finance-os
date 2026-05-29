import { handler, ok } from "@/lib/api";
import { assetSchema } from "@/lib/validations";
import { listAssets, createAsset } from "@/server/services/asset.service";

export const GET = handler(async ({ userId }) => ok(await listAssets(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = assetSchema.parse(await req.json());
  return ok(await createAsset(userId, body), 201);
});
