import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { PAYABLE_STATUS } from "@/lib/constants";

const PayableSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: "" },
    dueDate: { type: Date },
    status: { type: String, enum: PAYABLE_STATUS, default: "PENDING" },
    paidDate: { type: Date },
    paidFromAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

export type PayableDoc = InferSchemaType<typeof PayableSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Payable = models.Payable || model("Payable", PayableSchema);
