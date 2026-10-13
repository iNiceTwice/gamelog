import mongoose, { Schema, Document } from 'mongoose';

export interface ITgaNominee {
  title: string;
  isWinner: boolean;
}

export interface ITgaEdition extends Document {
  year: number;
  nominees: ITgaNominee[];
  createdAt: Date;
  updatedAt: Date;
}

const TgaEditionSchema = new Schema<ITgaEdition>(
  {
    year: {
      type: Number,
      required: [true, 'El año es obligatorio'],
      unique: true,
      index: true,
    },
    nominees: [
      {
        title: { type: String, required: true, trim: true },
        isWinner: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const TgaEdition =
  mongoose.models.TgaEdition ||
  mongoose.model<ITgaEdition>('TgaEdition', TgaEditionSchema);
