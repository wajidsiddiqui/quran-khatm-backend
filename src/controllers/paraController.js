import Khatm from "../models/Khatm.js";
import Activity from "../models/Activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { getKhatmOr404, assertIsMember } from "../utils/khatmHelpers.js";

function parseParaNumber(raw) {
  const n = Number(raw);

  if (!Number.isInteger(n) || n < 1 || n > 30) {
    throw new ApiError(400, "Para number must be an integer between 1 and 30.");
  }

  return n;
}

// GET /api/khatms/:id/paras
export const listParas = asyncHandler(async (req, res) => {
  const khatm = await getKhatmOr404(req.params.id);

  assertIsMember(khatm, req.user._id);

  await khatm.populate("paras.assignedTo", "name profileImage");

  res.json({
    success: true,
    data: khatm.paras,
  });
});

// POST /api/khatms/:id/paras/:paraNumber/claim
export const claimPara = asyncHandler(async (req, res) => {
  const paraNumber = parseParaNumber(req.params.paraNumber);

  const khatm = await getKhatmOr404(req.params.id);

  assertIsMember(khatm, req.user._id);

  // Prevent claiming a Para after
  // the entire Khatm is completed.
  if (khatm.status === "completed") {
    throw new ApiError(400, "This Khatm has already been completed.");
  }

  // IMPORTANT:
  // $elemMatch ensures number and status belong
  // to the SAME para object.
  const updated = await Khatm.findOneAndUpdate(
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
        "paras.$.assignedTo": req.user._id,
        "paras.$.claimedAt": new Date(),
      },
    },
    {
      new: true,
    },
  );

  if (!updated) {
    throw new ApiError(
      409,
      `Para ${paraNumber} is no longer available to claim.`,
    );
  }

  await Activity.create({
    khatm: khatm._id,
    user: req.user._id,
    action: "claimed",
    para: paraNumber,
  });

  await updated.populate("paras.assignedTo", "name profileImage");

  res.json({
    success: true,
    data: updated,
  });
});

// POST /api/khatms/:id/paras/:paraNumber/complete
export const completePara = asyncHandler(async (req, res) => {
  const paraNumber = parseParaNumber(req.params.paraNumber);

  const khatm = await getKhatmOr404(req.params.id);

  assertIsMember(khatm, req.user._id);

  const para = khatm.paras.find((p) => p.number === paraNumber);

  if (!para) {
    throw new ApiError(404, `Para ${paraNumber} not found.`);
  }

  if (para.status === "completed") {
    await khatm.populate("paras.assignedTo", "name profileImage");

    return res.json({
      success: true,
      data: khatm,
      message: "Already completed.",
    });
  }

  if (
    para.status !== "claimed" ||
    para.assignedTo?.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(
      403,
      "Only the member who claimed this Para can mark it completed.",
    );
  }

  // IMPORTANT:
  // All conditions must match the SAME para object.
  const updated = await Khatm.findOneAndUpdate(
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
        "paras.$.completedAt": new Date(),
      },
    },
    {
      new: true,
    },
  );

  if (!updated) {
    throw new ApiError(
      409,
      `Para ${paraNumber} could not be completed — it may have changed state.`,
    );
  }

  await Activity.create({
    khatm: khatm._id,
    user: req.user._id,
    action: "completed",
    para: paraNumber,
  });

  // If all 30 Paras are completed,
  // mark the entire Khatm as completed.
  const allDone = updated.paras.every((p) => p.status === "completed");

  if (allDone && updated.status !== "completed") {
    updated.status = "completed";
    updated.completedAt = new Date();

    await updated.save();
  }

  await updated.populate("paras.assignedTo", "name profileImage");

  res.json({
    success: true,
    data: updated,
  });
});
