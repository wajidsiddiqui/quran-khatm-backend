import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  getAllReadingProgress,
  getReadingProgress,
  saveReadingProgress,
  deleteReadingProgress,
  getQuranBookmarks,
  saveQuranBookmark,
} from "../controllers/readingProgressController.js";

const router = Router();

router.use(protect);

/*
 * ========================================
 * ALL SAVED READING LOCATIONS
 *
 * GET /api/reading-progress
 * ========================================
 */

router.get(
  "/",
  getAllReadingProgress,
);

/*
 * ========================================
 * QURAN-ONLY BOOKMARKS
 * ========================================
 */

/*
 * GET ALL QURAN BOOKMARKS
 *
 * GET /api/reading-progress/quran
 */
router.get(
  "/quran",
  getQuranBookmarks,
);

/*
 * SAVE QURAN BOOKMARK
 *
 * POST /api/reading-progress/quran
 */
router.post(
  "/quran",
  saveQuranBookmark,
);

/*
 * ========================================
 * KHATM READING PROGRESS
 * ========================================
 */

/*
 * GET SAVED PROGRESS
 * FOR ONE KHATM + PARA
 *
 * GET /api/reading-progress/:khatmId/:paraNumber
 */
router.get(
  "/:khatmId/:paraNumber",
  getReadingProgress,
);

/*
 * SAVE / UPDATE KHATM READING PROGRESS
 *
 * POST /api/reading-progress/:khatmId/:paraNumber
 */
router.post(
  "/:khatmId/:paraNumber",
  saveReadingProgress,
);

/*
 * ========================================
 * DELETE SAVED READING LOCATION
 * ========================================
 */

/*
 * DELETE /api/reading-progress/:progressId
 */
router.delete(
  "/:progressId",
  deleteReadingProgress,
);

export default router;