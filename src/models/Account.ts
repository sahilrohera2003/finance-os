import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { ACCOUNT_TYPES } from "@/lib/constants";

const AccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    currentBalance: { type: Number, required: true, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type AccountDoc = InferSchemaType<typeof AccountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Account = models.Account || model("Account", AccountSchema);
