import { getUserId } from "@/lib/session";
import { listAssets } from "@/server/services/asset.service";
import { AssetsClient } from "./assets-client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const userId = (await getUserId())!;
  const assets = JSON.parse(JSON.stringify(await listAssets(userId)));
  return <AssetsClient assets={assets} />;
}
