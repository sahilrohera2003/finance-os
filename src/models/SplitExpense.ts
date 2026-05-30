import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const SPLIT_METHODS = ["EQUAL", "EXACT", "PERCENT", "SHARES"] as const;
export const ME = "Me"; // sentinel participant/payer name representing the user

const ParticipantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 }, // this person's share of the total
  },
  { _id: false }
);

const SplitExpenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: "SplitGroup", default: null, index: true },
    description: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    // Who actually paid the bill. "Me" means the user paid.
    paidBy: { type: String, required: true, default: ME, trim: true },
    splitMethod: { type: String, enum: SPLIT_METHODS, default: "EQUAL" },
    participants: { type: [ParticipantSchema], required: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type SplitExpenseDoc = InferSchemaType<typeof SplitExpenseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SplitExpense =
  models.SplitExpense || model("SplitExpense", SplitExpenseSchema);
