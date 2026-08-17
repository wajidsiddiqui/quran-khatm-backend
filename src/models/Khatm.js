import mongoose from "mongoose";
import crypto from "crypto";


const paraSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },

    status: {
      type: String,
      enum: ["available", "claimed", "completed"],
      default: "available",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    claimedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);


const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    toJSON: {
      virtuals: true,
    },
  }
);


// Get all Paras assigned to this member
memberSchema.virtual("assignedParas").get(function () {
  const khatm = this.ownerDocument();

  if (!khatm || !khatm.paras) {
    return [];
  }

  const memberId =
    this.user?._id?.toString() ||
    this.user?.toString();

  if (!memberId) {
    return [];
  }

  return khatm.paras
    .filter((para) => {
      if (!para.assignedTo) {
        return false;
      }

      const assignedUserId =
        para.assignedTo?._id?.toString() ||
        para.assignedTo.toString();

      return assignedUserId === memberId;
    })
    .map((para) => para.number);
});


// Get Paras currently claimed by this member
memberSchema.virtual("claimedParas").get(function () {
  const khatm = this.ownerDocument();

  if (!khatm || !khatm.paras) {
    return [];
  }

  const memberId =
    this.user?._id?.toString() ||
    this.user?.toString();

  if (!memberId) {
    return [];
  }

  return khatm.paras
    .filter((para) => {
      if (
        !para.assignedTo ||
        para.status !== "claimed"
      ) {
        return false;
      }

      const assignedUserId =
        para.assignedTo?._id?.toString() ||
        para.assignedTo.toString();

      return assignedUserId === memberId;
    })
    .map((para) => para.number);
});


// Get Paras completed by this member
memberSchema.virtual("completedParas").get(function () {
  const khatm = this.ownerDocument();

  if (!khatm || !khatm.paras) {
    return [];
  }

  const memberId =
    this.user?._id?.toString() ||
    this.user?.toString();

  if (!memberId) {
    return [];
  }

  return khatm.paras
    .filter((para) => {
      if (
        !para.assignedTo ||
        para.status !== "completed"
      ) {
        return false;
      }

      const assignedUserId =
        para.assignedTo?._id?.toString() ||
        para.assignedTo.toString();

      return assignedUserId === memberId;
    })
    .map((para) => para.number);
});


const khatmSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    dedicatedTo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    intentionType: {
      type: String,
      default: "For",
      trim: true,
      maxlength: 40,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    privacy: {
      type: String,
      enum: ["private", "invite"],
      default: "invite",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: {
      type: [memberSchema],
      default: [],
    },

    paras: {
      type: [paraSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },

    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);


// Generate invite code
khatmSchema.statics.generateInviteCode =
  function generateInviteCode() {
    return crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase();
  };


// Create exactly 30 Paras
khatmSchema.statics.buildParas =
  function buildParas() {
    return Array.from(
      { length: 30 },
      (_, i) => ({
        number: i + 1,
        status: "available",
        assignedTo: null,
        claimedAt: null,
        completedAt: null,
      })
    );
  };


// Khatm progress
khatmSchema.virtual("progress").get(
  function progress() {
    const completed = this.paras.filter(
      (para) => para.status === "completed"
    ).length;

    const claimed = this.paras.filter(
      (para) => para.status === "claimed"
    ).length;

    return {
      completed,
      claimed,
      available: 30 - completed - claimed,
      percent: Math.round(
        (completed / 30) * 100
      ),
    };
  }
);


export default mongoose.model(
  "Khatm",
  khatmSchema
);