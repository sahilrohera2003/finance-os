import { connectDB } from "@/lib/mongodb";
import { Asset } from "@/models/Asset";
import type { AssetInput } from "@/lib/validations";

export async function listAssets(userId: string) {
  await connectDB();
  return Asset.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function createAsset(userId: string, input: AssetInput) {
  await connectDB();
  return Asset.create({ ...input, userId });
}

export async function updateAsset(userId: string, id: string, input: AssetInput) {
  await connectDB();
  const doc = await Asset.findOneAndUpdate({ _id: id, userId }, { $set: input }, { new: true }).lean();
  if (!doc) throw new Error("NOT_FOUND");
  return doc;
}

export async function deleteAsset(userId: string, id: string) {
  await connectDB();
  const res = await Asset.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}
