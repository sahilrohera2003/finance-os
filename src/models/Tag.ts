import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const TagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

TagSchema.index({ userId: 1, name: 1 }, { unique: true });

export type TagDoc = InferSchemaType<typeof TagSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Tag = models.Tag || model("Tag", TagSchema);
