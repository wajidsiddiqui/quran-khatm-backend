import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  createKhatm,
  listMyKhatms,
  getKhatmByInviteCode,
  getKhatm,
  updateKhatm,
  listMembers,
  joinKhatm,
} from "../controllers/khatmController.js";

import {
  listParas,
  claimPara,
  completePara,
} from "../controllers/paraController.js";

import { getInvite } from "../controllers/inviteController.js";

import { listActivity } from "../controllers/activityController.js";

const router = Router();

router.use(protect);

// Create Khatm
router.post("/", createKhatm);

// Get my Khatms
router.get("/", listMyKhatms);

// IMPORTANT:
// This must come BEFORE "/:id"
router.get("/invite/:inviteCode", getKhatmByInviteCode);

// Get one Khatm
router.get("/:id", getKhatm);

// Update Khatm
router.put("/:id", updateKhatm);

// Join Khatm
router.post("/:id/join", joinKhatm);

// Members
router.get("/:id/members", listMembers);

// Paras
router.get("/:id/paras", listParas);

router.post("/:id/paras/:paraNumber/claim", claimPara);

router.post("/:id/paras/:paraNumber/complete", completePara);

// Invite
router.post("/:id/invite", getInvite);

// Activity
router.get("/:id/activity", listActivity);

export default router;
