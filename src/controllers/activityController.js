import Activity from "../models/Activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getKhatmOr404, assertIsMember } from "../utils/khatmHelpers.js";

// GET /api/khatms/:id/activity — most recent first, capped to 50 by default.
export const listActivity = asyncHandler(async (req, res) => {
  const khatm = await getKhatmOr404(req.params.id);
  assertIsMember(khatm, req.user._id);

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const activity = await Activity.find({ khatm: khatm._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "name profileImage");

  res.json({ success: true, data: activity });
});
