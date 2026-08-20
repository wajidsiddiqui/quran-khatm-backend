import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  getReadingProgress,
  saveReadingProgress,
} from "../controllers/readingProgressController.js";

const router = Router();

router.use(protect);

// Get user's saved reading progress
router.get("/:khatmId/:paraNumber", getReadingProgress);

// Save/update user's confirmed reading progress
router.post("/:khatmId/:paraNumber", saveReadingProgress);

export default router;
