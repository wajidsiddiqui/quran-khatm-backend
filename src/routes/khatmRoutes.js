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
  completeKhatm,
} from "../controllers/khatmController.js";

import {
  listParas,
  claimPara,
  completePara,
} from "../controllers/paraController.js";

import { getInvite } from "../controllers/inviteController.js";

import { listActivity } from "../controllers/activityController.js";


const router =
  Router();


/* =========================================================
   AUTH PROTECTION

   All Khatm routes require authentication.
========================================================= */

router.use(protect);


/* =========================================================
   CREATE KHATM
========================================================= */

router.post(
  "/",
  createKhatm,
);


/* =========================================================
   GET MY KHATMS
========================================================= */

router.get(
  "/",
  listMyKhatms,
);


/* =========================================================
   GET KHATM BY INVITE CODE

   IMPORTANT:
   This must come before "/:id"
   so "invite" is not treated as an ID.
========================================================= */

router.get(
  "/invite/:inviteCode",
  getKhatmByInviteCode,
);


/* =========================================================
   GET ONE KHATM
========================================================= */

router.get(
  "/:id",
  getKhatm,
);


/* =========================================================
   UPDATE KHATM
========================================================= */

router.put(
  "/:id",
  updateKhatm,
);


/* =========================================================
   JOIN KHATM
========================================================= */

router.post(
  "/:id/join",
  joinKhatm,
);


/* =========================================================
   FINALIZE / COMPLETE ENTIRE KHATM

   Only the creator can do this.
   Backend also verifies all 30 Juz are completed.
   
   POST /api/khatms/:id/complete
========================================================= */

router.post(
  "/:id/complete",
  completeKhatm,
);


/* =========================================================
   MEMBERS
========================================================= */

router.get(
  "/:id/members",
  listMembers,
);


/* =========================================================
   PARAS / JUZ
========================================================= */

router.get(
  "/:id/paras",
  listParas,
);


router.post(
  "/:id/paras/:paraNumber/claim",
  claimPara,
);


router.post(
  "/:id/paras/:paraNumber/complete",
  completePara,
);


/* =========================================================
   INVITE
========================================================= */

router.post(
  "/:id/invite",
  getInvite,
);


/* =========================================================
   ACTIVITY
========================================================= */

router.get(
  "/:id/activity",
  listActivity,
);


export default router;