/**
 * Seed script — creates a demo user with sample data.
 *
 *   npm run seed
 *
 * Reads MONGODB_URI from .env.local (or the environment).
 * Demo credentials:  demo@finance.app  /  password123
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// --- Minimal .env.local loader (so the script runs without extra deps) ---
function loadEnv() {
  if (process.env.MONGODB_URI) return;
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    /* no .env.local — rely on real env */
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("✖ MONGODB_URI is not set. Add it to .env.local first.");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI as string);
  const db = mongoose.connection;
  console.log("→ Connected to MongoDB");

  const email = "demo@finance.app";
  // Clean any previous demo data.
  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    const uid = existing._id;
    for (const c of ["accounts", "transactions", "categories", "tags", "receivables", "payables", "loans", "monthlyobligations", "assets", "networthsnapshots"]) {
      await db.collection(c).deleteMany({ userId: uid });
    }
    await db.collection("users").deleteOne({ _id: uid });
    console.log("→ Removed previous demo data");
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const { insertedId: userId } = await db.collection("users").insertOne({
    name: "Demo User",
    email,
    phone: "+919999900000",
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("→ Created demo user");

  const accounts = await db.collection("accounts").insertMany([
    { userId, name: "HDFC Savings", type: "BANK", currentBalance: 185000, notes: "", createdAt: new Date(), updatedAt: new Date() },
    { userId, name: "Cash Wallet", type: "CASH", currentBalance: 8500, notes: "", createdAt: new Date(), updatedAt: new Date() },
    { userId, name: "Paytm Wallet", type: "WALLET", currentBalance: 3200, notes: "", createdAt: new Date(), updatedAt: new Date() },
  ]);
  const acc = Object.values(accounts.insertedIds);

  const cats = await db.collection("categories").insertMany(
    [
      ["Salary", "INCOME"],
      ["Freelance", "INCOME"],
      ["Food & Dining", "EXPENSE"],
      ["Groceries", "EXPENSE"],
      ["Transport", "EXPENSE"],
      ["Rent", "EXPENSE"],
      ["Utilities", "EXPENSE"],
      ["Entertainment", "EXPENSE"],
    ].map(([name, type]) => ({ userId, name, type, createdAt: new Date(), updatedAt: new Date() }))
  );
  const cat = Object.values(cats.insertedIds);

  const tags = await db.collection("tags").insertMany([
    { userId, name: "essential", createdAt: new Date(), updatedAt: new Date() },
    { userId, name: "work", createdAt: new Date(), updatedAt: new Date() },
  ]);
  const tag = Object.values(tags.insertedIds);

  // A few months of transactions.
  const txns: any[] = [];
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    txns.push(
      { userId, type: "INCOME", amount: 95000, accountId: acc[0], categoryId: cat[0], tagIds: [tag[1]], description: "Monthly salary", transactionDate: new Date(base.getFullYear(), base.getMonth(), 1), createdAt: new Date() },
      { userId, type: "EXPENSE", amount: 25000, accountId: acc[0], categoryId: cat[5], tagIds: [tag[0]], description: "Rent", transactionDate: new Date(base.getFullYear(), base.getMonth(), 3), createdAt: new Date() },
      { userId, type: "EXPENSE", amount: 8500, accountId: acc[0], categoryId: cat[3], tagIds: [tag[0]], description: "Groceries", transactionDate: new Date(base.getFullYear(), base.getMonth(), 8), createdAt: new Date() },
      { userId, type: "EXPENSE", amount: 4200, accountId: acc[1], categoryId: cat[2], tagIds: [], description: "Dining out", transactionDate: new Date(base.getFullYear(), base.getMonth(), 14), createdAt: new Date() },
      { userId, type: "EXPENSE", amount: 2300, accountId: acc[2], categoryId: cat[4], tagIds: [], description: "Cabs", transactionDate: new Date(base.getFullYear(), base.getMonth(), 20), createdAt: new Date() }
    );
  }
  await db.collection("transactions").insertMany(txns);
  console.log(`→ Inserted ${txns.length} transactions`);

  await db.collection("receivables").insertMany([
    { userId, personName: "Rahul", amount: 5000, description: "Lent for trip", status: "PENDING", expectedDate: new Date(now.getFullYear(), now.getMonth() + 1, 10), createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("payables").insertMany([
    { userId, personName: "Anita", amount: 3000, description: "Borrowed cash", status: "PENDING", dueDate: new Date(now.getFullYear(), now.getMonth(), 28), createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("loans").insertMany([
    { userId, lenderName: "ICICI Car Loan", totalAmount: 600000, outstandingAmount: 420000, emiAmount: 12500, interestRate: 9.2, status: "ACTIVE", nextDueDate: new Date(now.getFullYear(), now.getMonth(), 5), createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("monthlyobligations").insertMany([
    { userId, name: "Apartment Rent", amount: 25000, category: "RENT", dueDay: 3, active: true, createdAt: new Date(), updatedAt: new Date() },
    { userId, name: "Netflix", amount: 649, category: "SUBSCRIPTION", dueDay: 12, active: true, createdAt: new Date(), updatedAt: new Date() },
    { userId, name: "Index Fund SIP", amount: 10000, category: "SIP", dueDay: 5, active: true, createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("assets").insertMany([
    { userId, name: "Gold Jewellery", assetType: "GOLD", currentValue: 350000, notes: "", createdAt: new Date(), updatedAt: new Date() },
    { userId, name: "MacBook Pro", assetType: "LAPTOP", currentValue: 120000, notes: "", createdAt: new Date(), updatedAt: new Date() },
  ]);

  // Build a few historical net-worth snapshots.
  for (let m = 5; m >= 0; m--) {
    const assetValue = 600000 + (5 - m) * 15000;
    const liabilityValue = 470000 - (5 - m) * 12000;
    await db.collection("networthsnapshots").insertOne({
      userId,
      assetValue,
      liabilityValue,
      netWorth: assetValue - liabilityValue,
      snapshotDate: new Date(now.getFullYear(), now.getMonth() - m, 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log("\n✓ Seed complete!");
  console.log("  Login:  demo@finance.app  /  password123\n");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
