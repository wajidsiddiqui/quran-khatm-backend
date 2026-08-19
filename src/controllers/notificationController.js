import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/notifications
export const listNotifications = asyncHandler(
  async (req, res) => {
    const notifications = await Notification.find({
      recipient: req.user._id,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name profileImage")
      .populate("khatm", "title dedicatedTo");

    const formattedNotifications = notifications.map(
      (notification) => {
        const userName =
          notification.actor?.name || "A member";

        const khatmTitle =
          notification.khatm?.title || "your Khatm";

        let title = "New Khatm activity";

        let message =
          `There is a new update in "${khatmTitle}".`;

        // Member joined
        if (notification.action === "joined") {
          title = `${userName} joined the Khatm`;

          message =
            `${userName} joined "${khatmTitle}".`;
        }

        // Para claimed
        if (notification.action === "claimed") {
          title =
            `Para ${notification.para} was claimed`;

          message =
            `${userName} claimed Para ${notification.para} in "${khatmTitle}".`;
        }

        // Para completed
        if (notification.action === "completed") {
          title =
            `Para ${notification.para} was completed`;

          message =
            `${userName} completed Para ${notification.para} in "${khatmTitle}".`;
        }

        return {
          _id: notification._id,

          // Frontend currently can use "type"
          type: notification.action,

          // Also sending action for consistency
          action: notification.action,

          title,

          message,

          para: notification.para,

          user: notification.actor,

          khatm: notification.khatm,

          createdAt: notification.createdAt,

          isRead: notification.isRead,
        };
      }
    );

    res.json({
      success: true,
      data: formattedNotifications,
    });
  }
);


// PATCH /api/notifications/read-all
export const markAllNotificationsAsRead =
  asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,

      message:
        "All notifications marked as read",

      modifiedCount: result.modifiedCount,
    });
  });