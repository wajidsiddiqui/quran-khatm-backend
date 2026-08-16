import mongoose from "mongoose";
import crypto from "crypto";

const paraSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, min: 1, max: 30 },
    status: {
      type: String,
      enum: ["available", "claimed", "completed"],
      default: "available",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    claimedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const khatmSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    dedicatedTo: { type: String, required: true, trim: true, maxlength: 120 },
    intentionType: { type: String, default: "For", trim: true, maxlength: 40 },
    message: { type: String, default: "", trim: true, maxlength: 300 },
    privacy: { type: String, enum: ["private", "invite"], default: "invite" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] },
    paras: { type: [paraSchema], default: [] },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    inviteCode: { type: String, required: true, unique: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

khatmSchema.statics.generateInviteCode = function generateInviteCode() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
};

// Always create with exactly 30 available Paras — enforced at the schema
// level so no code path can create a Khatm with the wrong Para count.
khatmSchema.statics.buildParas = function buildParas() {
  return Array.from({ length: 30 }, (_, i) => ({ number: i + 1, status: "available" }));
};

khatmSchema.virtual("progress").get(function progress() {
  const completed = this.paras.filter((p) => p.status === "completed").length;
  const claimed = this.paras.filter((p) => p.status === "claimed").length;
  return {
    completed,
    claimed,
    available: 30 - completed - claimed,
    percent: Math.round((completed / 30) * 100),
  };
});

khatmSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Khatm", khatmSchema);
