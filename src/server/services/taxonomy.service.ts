import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import type { CategoryInput, TagInput } from "@/lib/validations";

/* Categories */
export async function listCategories(userId: string) {
  await connectDB();
  return Category.find({ userId }).sort({ type: 1, name: 1 }).lean();
}

export async function createCategory(userId: string, input: CategoryInput) {
  await connectDB();
  return Category.create({ ...input, userId });
}

export async function deleteCategory(userId: string, id: string) {
  await connectDB();
  const res = await Category.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}

/* Tags */
export async function listTags(userId: string) {
  await connectDB();
  return Tag.find({ userId }).sort({ name: 1 }).lean();
}

export async function createTag(userId: string, input: TagInput) {
  await connectDB();
  return Tag.create({ ...input, userId });
}

export async function deleteTag(userId: string, id: string) {
  await connectDB();
  const res = await Tag.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}
