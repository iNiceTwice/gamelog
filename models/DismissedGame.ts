import mongoose, { Schema, Document } from 'mongoose';

export interface IDismissedGame extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  igdbId?: number;
  coverUrl?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DismissedGameSchema = new Schema<IDismissedGame>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      index: true,
    },
    igdbId: {
      type: Number,
      index: true,
      sparse: true,
    },
    coverUrl: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'recommendations',
    },
  },
  {
    timestamps: true,
  }
);

DismissedGameSchema.index({ userId: 1, title: 1 }, { unique: true });
DismissedGameSchema.index({ userId: 1, igdbId: 1 });

export const DismissedGame =
  mongoose.models.DismissedGame ||
  mongoose.model<IDismissedGame>('DismissedGame', DismissedGameSchema);
