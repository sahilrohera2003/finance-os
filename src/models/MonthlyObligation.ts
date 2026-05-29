import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { OBLIGATION_CATEGORIES } from "@/lib/constants";

const MonthlyObligationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: OBLIGATION_CATEGORIES, default: "OTHER" },
    dueDay: { type: Number, min: 1, max: 31, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type MonthlyObligationDoc = InferSchemaType<
  typeof MonthlyObligationSchema
> & { _id: mongoose.Types.ObjectId };

export const MonthlyObligation =
  models.MonthlyObligation ||
  model("MonthlyObligation", MonthlyObligationSchema);
