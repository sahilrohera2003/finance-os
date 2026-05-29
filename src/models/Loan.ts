import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";
import { LOAN_STATUS } from "@/lib/constants";

const LoanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderName: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    emiAmount: { type: Number, default: 0, min: 0 },
    interestRate: { type: Number, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    nextDueDate: { type: Date },
    status: { type: String, enum: LOAN_STATUS, default: "ACTIVE" },
  },
  { timestamps: true }
);

export type LoanDoc = InferSchemaType<typeof LoanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Loan = models.Loan || model("Loan", LoanSchema);
