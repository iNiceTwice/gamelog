import mongoose, { Schema, Document, Model } from 'mongoose';

export type GameStatus = 'completed' | 'abandoned' | 'playing' | 'backlog';
export type PodiumRank = 'gold' | 'silver' | 'bronze' | null;

export interface IGameEntry extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  igdbId?: number;
  coverUrl?: string;
  igdbGenres: string[];
  customTags: string[];
  releaseYear?: number;
  status: GameStatus;
  yearPlayed?: number;
  rating?: number; // 1 to 5 stars
  podium?: PodiumRank;
  review?: string;
  backlogType?: string; // "Hard" | "Chill"
  downloadUrl?: string; // Specific download/source URL
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GameEntrySchema = new Schema<IGameEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'El título del videojuego es obligatorio'],
      trim: true,
    },
    igdbId: {
      type: Number,
      sparse: true,
      index: true,
    },
    coverUrl: {
      type: String,
      default: '',
    },
    igdbGenres: {
      type: [String],
      default: [],
    },
    customTags: {
      type: [String],
      default: [],
    },
    releaseYear: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['completed', 'abandoned', 'playing', 'backlog'],
      default: 'completed',
      index: true,
    },
    yearPlayed: {
      type: Number,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    podium: {
      type: String,
      enum: ['gold', 'silver', 'bronze', null],
      default: null,
    },
    review: {
      type: String,
      default: '',
    },
    backlogType: {
      type: String,
      default: 'Hard',
    },
    downloadUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compounded indexes for fast multi-tenant queries
GameEntrySchema.index({ userId: 1, status: 1 });
GameEntrySchema.index({ userId: 1, yearPlayed: 1 });
GameEntrySchema.index({ userId: 1, igdbId: 1 });

// Ensure a user can only assign one podium rank per year played
GameEntrySchema.index(
  { userId: 1, yearPlayed: 1, podium: 1 },
  {
    unique: true,
    partialFilterExpression: {
      podium: { $in: ['gold', 'silver', 'bronze'] },
    },
  }
);

export const GameEntry: Model<IGameEntry> =
  mongoose.models.GameEntry ||
  mongoose.model<IGameEntry>('GameEntry', GameEntrySchema);
