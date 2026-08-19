import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  listNotifications,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(protect);

// Get unread notifications
router.get("/", listNotifications);

// Mark all notifications as read
router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

export default router;