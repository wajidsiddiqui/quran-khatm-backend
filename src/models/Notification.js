import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User who will receive this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related Khatm
    khatm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khatm",
      required: true,
    },

    // Person who performed the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Activity type
    action: {
      type: String,
      enum: ["joined", "claimed", "completed"],
      required: true,
    },

    // Related Para, null for "joined"
    para: {
      type: Number,
      default: null,
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When notification was read
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Notification", notificationSchema);
