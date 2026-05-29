import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import type { RegisterInput } from "@/lib/validations";

const DEFAULT_CATEGORIES: { name: string; type: "INCOME" | "EXPENSE" }[] = [
  { name: "Salary", type: "INCOME" },
  { name: "Business", type: "INCOME" },
  { name: "Interest", type: "INCOME" },
  { name: "Gifts", type: "INCOME" },
  { name: "Food & Dining", type: "EXPENSE" },
  { name: "Groceries", type: "EXPENSE" },
  { name: "Transport", type: "EXPENSE" },
  { name: "Rent", type: "EXPENSE" },
  { name: "Utilities", type: "EXPENSE" },
  { name: "Shopping", type: "EXPENSE" },
  { name: "Health", type: "EXPENSE" },
  { name: "Entertainment", type: "EXPENSE" },
];

export async function registerUser(input: RegisterInput) {
  await connectDB();

  const email = input.email ? input.email.toLowerCase().trim() : undefined;
  const phone = input.phone ? input.phone.trim() : undefined;

  const existing = await User.findOne({
    $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
  });
  if (existing) {
    throw new Error("An account with that email or phone already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({ name: input.name, email, phone, passwordHash });

  // Seed sensible default categories for the new user.
  await Category.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user._id }))
  );

  return { id: user._id.toString() };
}

export async function updateProfile(
  userId: string,
  data: { name: string; email?: string; phone?: string }
) {
  await connectDB();
  const email = data.email ? data.email.toLowerCase().trim() : undefined;
  const phone = data.phone ? data.phone.trim() : undefined;

  // Ensure uniqueness against other users.
  const clash = await User.findOne({
    _id: { $ne: userId },
    $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
  });
  if (clash) throw new Error("That email or phone is already in use.");

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name: data.name, email, phone } },
    { new: true }
  ).lean();
  if (!user) throw new Error("NOT_FOUND");
  return { ok: true };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("NOT_FOUND");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { ok: true };
}

export async function getProfile(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("name email phone createdAt").lean();
  if (!user) throw new Error("NOT_FOUND");
  return JSON.parse(JSON.stringify(user));
}
