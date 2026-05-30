import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const SplitGroupSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Member names excluding "Me" (the user is always implicitly a member).
    members: { type: [String], default: [] },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export type SplitGroupDoc = InferSchemaType<typeof SplitGroupSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SplitGroup = models.SplitGroup || model("SplitGroup", SplitGroupSchema);
