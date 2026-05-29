import { getUserId } from "@/lib/session";
import { getProfile } from "@/server/services/user.service";
import { listCategories, listTags } from "@/server/services/taxonomy.service";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = (await getUserId())!;
  const [profile, categories, tags] = await Promise.all([
    getProfile(userId),
    listCategories(userId),
    listTags(userId),
  ]);
  const s = (v: unknown) => JSON.parse(JSON.stringify(v));
  return <SettingsClient profile={s(profile)} categories={s(categories)} tags={s(tags)} />;
}
