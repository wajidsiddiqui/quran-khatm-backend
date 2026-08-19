import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    khatm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khatm",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: ["joined", "claimed", "completed"],
      required: true,
    },

    para: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the exact same activity
// from being created twice.
activitySchema.index(
  {
    khatm: 1,
    user: 1,
    action: 1,
    para: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "Activity",
  activitySchema
);