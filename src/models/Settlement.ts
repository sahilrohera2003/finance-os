import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const SETTLEMENT_DIRECTIONS = ["I_RECEIVED", "I_PAID"] as const;

const SettlementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactName: { type: String, required: true, trim: true },
    // I_RECEIVED = the contact paid me back; I_PAID = I paid the contact.
    direction: { type: String, enum: SETTLEMENT_DIRECTIONS, required: true },
    amount: { type: Number, required: true, min: 0 },
    // Optional real account affected, so balances stay accurate.
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type SettlementDoc = InferSchemaType<typeof SettlementSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settlement = models.Settlement || model("Settlement", SettlementSchema);
