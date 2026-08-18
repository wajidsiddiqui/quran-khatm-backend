import Activity from "../models/Activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getKhatmOr404,
  assertIsMember,
} from "../utils/khatmHelpers.js";

// GET /api/khatms/:id/activity
export const listActivity = asyncHandler(
  async (req, res) => {
    const khatm = await getKhatmOr404(
      req.params.id
    );

    assertIsMember(
      khatm,
      req.user._id
    );

    const limit = Math.min(
      Number(req.query.limit) || 50,
      100
    );

    const activity = await Activity.find({
      khatm: khatm._id,
    })
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "name profileImage"
      );

    // Remove duplicate activity records
    const uniqueActivity = [];
    const seen = new Set();

    for (const item of activity) {
      const userId =
        item.user?._id?.toString() ||
        item.user?.toString();

      const key = [
        userId,
        item.action,
        item.para ?? "no-para",
      ].join("-");

      if (!seen.has(key)) {
        seen.add(key);
        uniqueActivity.push(item);
      }
    }

    res.json({
      success: true,
      data: uniqueActivity.slice(0, limit),
    });
  }
);