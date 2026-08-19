import Khatm from "../models/Khatm.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getKhatmOr404,
  assertIsMember,
} from "../utils/khatmHelpers.js";

function parseParaNumber(raw) {
  const n = Number(raw);

  if (!Number.isInteger(n) || n < 1 || n > 30) {
    throw new ApiError(
      400,
      "Para number must be an integer between 1 and 30."
    );
  }

  return n;
}

// Create notifications for all Khatm members
// except the user who performed the action
async function createNotifications({
  khatm,
  actorId,
  action,
  para = null,
}) {
  const recipientIds = khatm.members
    .map((member) => member.user)
    .filter(
      (userId) =>
        userId &&
        userId.toString() !== actorId.toString()
    );

  if (recipientIds.length === 0) {
    return;
  }

  const notifications = recipientIds.map(
    (recipientId) => ({
      recipient: recipientId,
      khatm: khatm._id,
      actor: actorId,
      action,
      para,
    })
  );

  await Notification.insertMany(notifications);
}

// GET /api/khatms/:id/paras
export const listParas = asyncHandler(
  async (req, res) => {
    const khatm = await getKhatmOr404(
      req.params.id
    );

    assertIsMember(
      khatm,
      req.user._id
    );

    await khatm.populate(
      "paras.assignedTo",
      "name profileImage"
    );

    res.json({
      success: true,
      data: khatm.paras,
    });
  }
);

// POST /api/khatms/:id/paras/:paraNumber/claim
export const claimPara = asyncHandler(
  async (req, res) => {
    const paraNumber = parseParaNumber(
      req.params.paraNumber
    );

    const khatm = await getKhatmOr404(
      req.params.id
    );

    assertIsMember(
      khatm,
      req.user._id
    );

    // Prevent claiming after Khatm is completed
    if (khatm.status === "completed") {
      throw new ApiError(
        400,
        "This Khatm has already been completed."
      );
    }

    const updated =
      await Khatm.findOneAndUpdate(
        {
          _id: khatm._id,
          paras: {
            $elemMatch: {
              number: paraNumber,
              status: "available",
            },
          },
        },
        {
          $set: {
            "paras.$.status": "claimed",
            "paras.$.assignedTo":
              req.user._id,
            "paras.$.claimedAt":
              new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!updated) {
      throw new ApiError(
        409,
        `Para ${paraNumber} is no longer available to claim.`
      );
    }

    // Create activity
    await Activity.create({
      khatm: khatm._id,
      user: req.user._id,
      action: "claimed",
      para: paraNumber,
    });

    // Create notifications for all other members
    await createNotifications({
      khatm: updated,
      actorId: req.user._id,
      action: "claimed",
      para: paraNumber,
    });

    await updated.populate(
      "paras.assignedTo",
      "name profileImage"
    );

    res.json({
      success: true,
      data: updated,
    });
  }
);

// POST /api/khatms/:id/paras/:paraNumber/complete
export const completePara = asyncHandler(
  async (req, res) => {
    const paraNumber = parseParaNumber(
      req.params.paraNumber
    );

    const khatm = await getKhatmOr404(
      req.params.id
    );

    assertIsMember(
      khatm,
      req.user._id
    );

    const para = khatm.paras.find(
      (p) => p.number === paraNumber
    );

    if (!para) {
      throw new ApiError(
        404,
        `Para ${paraNumber} not found.`
      );
    }

    // Already completed
    if (para.status === "completed") {
      await khatm.populate(
        "paras.assignedTo",
        "name profileImage"
      );

      return res.json({
        success: true,
        data: khatm,
        message: "Already completed.",
      });
    }

    // Only the member who claimed this Para
    // can mark it as completed
    if (
      para.status !== "claimed" ||
      para.assignedTo?.toString() !==
        req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "Only the member who claimed this Para can mark it completed."
      );
    }

    const updated =
      await Khatm.findOneAndUpdate(
        {
          _id: khatm._id,
          paras: {
            $elemMatch: {
              number: paraNumber,
              status: "claimed",
              assignedTo: req.user._id,
            },
          },
        },
        {
          $set: {
            "paras.$.status": "completed",
            "paras.$.completedAt":
              new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!updated) {
      throw new ApiError(
        409,
        `Para ${paraNumber} could not be completed — it may have changed state.`
      );
    }

    // Create activity
    await Activity.create({
      khatm: khatm._id,
      user: req.user._id,
      action: "completed",
      para: paraNumber,
    });

    // Create notifications for all other members
    await createNotifications({
      khatm: updated,
      actorId: req.user._id,
      action: "completed",
      para: paraNumber,
    });

    // Check whether all Paras are completed
    const allDone = updated.paras.every(
      (p) => p.status === "completed"
    );

    if (
      allDone &&
      updated.status !== "completed"
    ) {
      updated.status = "completed";
      updated.completedAt = new Date();

      await updated.save();
    }

    await updated.populate(
      "paras.assignedTo",
      "name profileImage"
    );

    res.json({
      success: true,
      data: updated,
    });
  }
);