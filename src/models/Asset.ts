import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { ASSET_TYPES } from "@/lib/constants";

const AssetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    assetType: { type: String, enum: ASSET_TYPES, default: "OTHER" },
    currentValue: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type AssetDoc = InferSchemaType<typeof AssetSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Asset = models.Asset || model("Asset", AssetSchema);
