import mongoose from "mongoose";

const readingProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    khatm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khatm",
      required: true,
    },

    paraNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },

    surahNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 114,
    },

    ayahNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    globalAyahNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6236,
    },
  },
  {
    timestamps: true,
  },
);

// One reading-progress record per user + Khatm + Para
readingProgressSchema.index(
  {
    user: 1,
    khatm: 1,
    paraNumber: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("ReadingProgress", readingProgressSchema);
