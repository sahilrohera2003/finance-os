import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { RECEIVABLE_STATUS } from "@/lib/constants";

const ReceivableSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: "" },
    expectedDate: { type: Date },
    status: { type: String, enum: RECEIVABLE_STATUS, default: "PENDING" },
    receivedDate: { type: Date },
    // Account the money landed in when received (for balance tracking).
    receivedToAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

export type ReceivableDoc = InferSchemaType<typeof ReceivableSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Receivable =
  models.Receivable || model("Receivable", ReceivableSchema);
