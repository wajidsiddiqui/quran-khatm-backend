import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    khatm: { type: mongoose.Schema.Types.ObjectId, ref: "Khatm", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["joined", "claimed", "completed"], required: true },
    para: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
