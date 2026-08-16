import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { previewInvite, joinByInvite } from "../controllers/inviteController.js";

const router = Router();

router.get("/:inviteCode", previewInvite); // public — no auth
router.post("/:inviteCode/join", protect, joinByInvite);

export default router;
