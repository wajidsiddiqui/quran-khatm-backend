import Khatm from "../models/Khatm.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import {
  getKhatmOr404,
  assertIsMember,
} from "../utils/khatmHelpers.js";


/* =========================================================
   PARSE JUZ / PARA NUMBER
========================================================= */

function parseParaNumber(raw) {
  const n = Number(raw);

  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 30
  ) {
    throw new ApiError(
      400,
      "Juz number must be an integer between 1 and 30."
    );
  }

  return n;
}


/* =========================================================
   CREATE NOTIFICATIONS
     
   Sends the action notification to every Khatm member
   except the member who performed the action.
========================================================= */

async function createNotifications({
  khatm,
  actorId,
  action,
  para = null,
}) {
  const recipientIds =
    khatm.members
      .map(
        (member) =>
          member.user
      )
      .filter(
        (userId) =>
          userId &&
          userId.toString() !==
            actorId.toString()
      );

  if (
    recipientIds.length === 0
  ) {
    return;
  }

  const notifications =
    recipientIds.map(
      (recipientId) => ({
        recipient:
          recipientId,

        khatm:
          khatm._id,

        actor:
          actorId,

        action,

        para,
      })
    );

  await Notification.insertMany(
    notifications
  );
}


/* =========================================================
   GET /api/khatms/:id/paras

   Get all Juz / Paras for a Khatm.
========================================================= */

export const listParas =
  asyncHandler(
    async (req, res) => {
      const khatm =
        await getKhatmOr404(
          req.params.id
        );

      assertIsMember(
        khatm,
        req.user._id
      );

      await khatm.populate(
        "paras.assignedTo",
        "name profileImage"
      );

      res.json({
        success: true,
        data: khatm.paras,
      });
    }
  );


/* =========================================================
   POST /api/khatms/:id/paras/:paraNumber/claim

   Claim a Juz.
========================================================= */

export const claimPara =
  asyncHandler(
    async (req, res) => {
      const paraNumber =
        parseParaNumber(
          req.params.paraNumber
        );

      const khatm =
        await getKhatmOr404(
          req.params.id
        );

      assertIsMember(
        khatm,
        req.user._id
      );


      /* =====================================================
         DO NOT ALLOW CLAIMING AFTER FINAL KHATM COMPLETION
      ====================================================== */

      if (
        khatm.status ===
        "completed"
      ) {
        throw new ApiError(
          400,
          "This Khatm has already been completed."
        );
      }


      /* =====================================================
         CLAIM AVAILABLE JUZ
      ====================================================== */

      const updated =
        await Khatm.findOneAndUpdate(
          {
            _id:
              khatm._id,

            paras: {
              $elemMatch: {
                number:
                  paraNumber,

                status:
                  "available",
              },
            },
          },

          {
            $set: {
              "paras.$.status":
                "claimed",

              "paras.$.assignedTo":
                req.user._id,

              "paras.$.claimedAt":
                new Date(),
            },
          },

          {
            new: true,
          }
        );


      if (!updated) {
        throw new ApiError(
          409,
          `Juz ${paraNumber} is no longer available to claim.`
        );
      }


      /* =====================================================
         ACTIVITY
      ====================================================== */

      await Activity.create({
        khatm:
          khatm._id,

        user:
          req.user._id,

        action:
          "claimed",

        para:
          paraNumber,
      });


      /* =====================================================
         NOTIFICATIONS
      ====================================================== */

      await createNotifications({
        khatm:
          updated,

        actorId:
          req.user._id,

        action:
          "claimed",

        para:
          paraNumber,
      });


      /* =====================================================
         POPULATE ASSIGNED USER
      ====================================================== */

      await updated.populate(
        "paras.assignedTo",
        "name profileImage"
      );


      res.json({
        success: true,
        data: updated,
      });
    }
  );


/* =========================================================
   POST /api/khatms/:id/paras/:paraNumber/complete

   Complete ONLY the selected Juz.

   IMPORTANT BUSINESS RULE:
   --------------------------------
   This endpoint NEVER completes the overall Khatm.

   Even if Juz 30 is completed and the result becomes
   30 / 30, the Khatm remains:

       status = "active"

   The Khatm is finalized ONLY by:

       POST /api/khatms/:id/complete

   after the creator completes the final Khatm Dua.
========================================================= */

export const completePara =
  asyncHandler(
    async (req, res) => {
      const paraNumber =
        parseParaNumber(
          req.params.paraNumber
        );


      const khatm =
        await getKhatmOr404(
          req.params.id
        );


      assertIsMember(
        khatm,
        req.user._id
      );


      /* =====================================================
         ALREADY FINALIZED KHATM
      ====================================================== */

      if (
        khatm.status ===
        "completed"
      ) {
        throw new ApiError(
          400,
          "This Khatm has already been completed."
        );
      }


      /* =====================================================
         FIND SELECTED JUZ
      ====================================================== */

      const para =
        khatm.paras.find(
          (p) =>
            p.number ===
            paraNumber
        );


      if (!para) {
        throw new ApiError(
          404,
          `Juz ${paraNumber} not found.`
        );
      }


      /* =====================================================
         ALREADY COMPLETED
      ====================================================== */

      if (
        para.status ===
        "completed"
      ) {
        await khatm.populate(
          "paras.assignedTo",
          "name profileImage"
        );

        return res.json({
          success: true,
          data: khatm,
          message:
            "Already completed.",
        });
      }


      /* =====================================================
         ONLY THE CLAIMING MEMBER CAN COMPLETE
      ====================================================== */

      if (
        para.status !==
          "claimed" ||
        para.assignedTo?.toString() !==
          req.user._id.toString()
      ) {
        throw new ApiError(
          403,
          "Only the member who claimed this Juz can mark it completed."
        );
      }


      /* =====================================================
         COMPLETE ONLY THIS JUZ

         We intentionally update:
           paras.$.status
           paras.$.completedAt

         We DO NOT update:
           khatm.status
           khatm.completedAt
      ====================================================== */

      const updated =
        await Khatm.findOneAndUpdate(
          {
            _id:
              khatm._id,

            paras: {
              $elemMatch: {
                number:
                  paraNumber,

                status:
                  "claimed",

                assignedTo:
                  req.user._id,
              },
            },
          },

          {
            $set: {
              "paras.$.status":
                "completed",

              "paras.$.completedAt":
                new Date(),
            },
          },

          {
            new: true,
          }
        );


      if (!updated) {
        throw new ApiError(
          409,
          `Juz ${paraNumber} could not be completed — it may have changed state.`
        );
      }


      /* =====================================================
         ACTIVITY
      ====================================================== */

      await Activity.create({
        khatm:
          khatm._id,

        user:
          req.user._id,

        action:
          "completed",

        para:
          paraNumber,
      });


      /* =====================================================
         NOTIFICATIONS
      ====================================================== */

      await createNotifications({
        khatm:
          updated,

        actorId:
          req.user._id,

        action:
          "completed",

        para:
          paraNumber,
      });


      /* =====================================================
         IMPORTANT

         DO NOT DO THIS HERE:

           if (allDone) {
             updated.status = "completed";
             updated.completedAt = new Date();
             await updated.save();
           }

         That automatic completion has intentionally been
         removed.

         Therefore:

           Juz 1 complete  → Khatm ACTIVE
           Juz 29 complete → Khatm ACTIVE
           Juz 30 complete → Khatm ACTIVE

         Once 30 / 30 is reached, the creator can see:

           "Make Dua for This Khatm"

         Only the final Khatm Dua Ameen calls the
         completeKhatm endpoint.
      ====================================================== */


      /* =====================================================
         POPULATE ASSIGNED USER
      ====================================================== */

      await updated.populate(
        "paras.assignedTo",
        "name profileImage"
      );


      /* =====================================================
         RESPONSE
      ====================================================== */

      res.json({
        success: true,

        data:
          updated,

        message:
          `Juz ${paraNumber} completed successfully.`,
      });
    }
  );