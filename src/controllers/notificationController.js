import Activity from "../models/Activity.js";
import Khatm from "../models/Khatm.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/notifications
export const listNotifications = asyncHandler(
  async (req, res) => {
    try {
      // Find all Khatms where logged-in user is a member
      const khatms = await Khatm.find({
        "members.user": req.user._id,
      }).select("_id");

      const khatmIds = khatms.map(
        (khatm) => khatm._id
      );

      // If user is not part of any Khatm
      if (khatmIds.length === 0) {
        return res.json({
          success: true,
          data: [],
        });
      }

      // Get activities from those Khatms
      // Exclude user's own activities
      const activities = await Activity.find({
        khatm: {
          $in: khatmIds,
        },
        user: {
          $ne: req.user._id,
        },
      })
        .sort({
          createdAt: -1,
        })
        .limit(50)
        .populate(
          "user",
          "name profileImage"
        )
        .populate(
          "khatm",
          "name dedicatedTo"
        );

      // Convert activities into frontend-friendly notifications
      const notifications = activities.map(
        (activity) => {
          const userName =
            activity.user?.name || "Someone";

          const khatmName =
            activity.khatm?.name ||
            "your Khatm";

          let title = "";
          let message = "";

          switch (activity.action) {
            case "joined":
              title = "New member joined";

              message = `${userName} joined ${khatmName}.`;

              break;

            case "claimed":
              title = "Para claimed";

              message = `${userName} claimed Para ${activity.para} in ${khatmName}.`;

              break;

            case "completed":
              title = "Para completed";

              message = `${userName} completed Para ${activity.para} in ${khatmName}.`;

              break;

            default:
              title = "Khatm update";

              message = `${userName} updated ${khatmName}.`;
          }

          return {
            _id: activity._id,

            action: activity.action,

            title,

            message,

            time: getRelativeTime(
              activity.createdAt
            ),

            createdAt: activity.createdAt,

            user: activity.user,

            para: activity.para,

            khatm: activity.khatm,
          };
        }
      );

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error(
        "Notification error:",
        error
      );

      throw error;
    }
  }
);

// Convert date into "Now", "5m ago", etc.
function getRelativeTime(date) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) /
      1000
  );

  if (seconds < 60) {
    return "Now";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days === 1) {
    return "Yesterday";
  }

  return `${days}d ago`;
}