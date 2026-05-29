import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { TRANSACTION_TYPES } from "@/lib/constants";

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    // For INCOME / EXPENSE the affected account:
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
    // For TRANSFER:
    fromAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    description: { type: String, trim: true, default: "" },
    transactionDate: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type TransactionDoc = InferSchemaType<typeof TransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Transaction =
  models.Transaction || model("Transaction", TransactionSchema);
