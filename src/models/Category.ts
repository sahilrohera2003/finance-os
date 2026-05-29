import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { CATEGORY_TYPES } from "@/lib/constants";

const CategorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: CATEGORY_TYPES, required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Category = models.Category || model("Category", CategorySchema);
