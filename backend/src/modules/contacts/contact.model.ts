import mongoose, { Document, Schema, Types } from "mongoose";

export interface IContact extends Document {
  userId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

contactSchema.index({ userId: 1, name: 1 });

export const ContactModel = mongoose.model<IContact>("Contact", contactSchema);
