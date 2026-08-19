import { Router } from "express";

import { protect } from "../middleware/auth.js";
import { listNotifications } from "../controllers/notificationController.js";

const router = Router();

router.use(protect);

router.get("/", listNotifications);

export default router;