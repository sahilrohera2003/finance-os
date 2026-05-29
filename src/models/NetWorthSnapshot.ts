import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const NetWorthSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assetValue: { type: Number, required: true },
    liabilityValue: { type: Number, required: true },
    netWorth: { type: Number, required: true },
    snapshotDate: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

export type NetWorthSnapshotDoc = InferSchemaType<
  typeof NetWorthSnapshotSchema
> & { _id: mongoose.Types.ObjectId };

export const NetWorthSnapshot =
  models.NetWorthSnapshot || model("NetWorthSnapshot", NetWorthSnapshotSchema);
