import Activity from "../models/Activity.js";
import Khatm from "../models/Khatm.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  // Find all Khatms where the logged-in user is a member
  const khatms = await Khatm.find({
    "members.user": req.user._id,
  }).select("_id createdBy");

  const khatmIds = khatms.map((khatm) => khatm._id);

  if (khatmIds.length === 0) {
    return res.json({
      success: true,
      data: [],
    });
  }

  // Get activities from the user's Khatms
  // Do not show the user's own actions as notifications
  const activities = await Activity.find({
    khatm: { $in: khatmIds },
    user: { $ne: req.user._id },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name profileImage")
    .populate("khatm", "name dedicatedTo");

  const notifications = activities.map((activity) => ({
    id: activity._id,
    type: activity.action,
    user: activity.user,
    para: activity.para,
    khatm: activity.khatm,
    createdAt: activity.createdAt,
  }));

  res.json({
    success: true,
    data: notifications,
  });
});
