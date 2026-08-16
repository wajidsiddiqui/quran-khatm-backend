import Khatm from "../models/Khatm.js";
import Activity from "../models/Activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { getKhatmOr404, assertIsMember, isMember } from "../utils/khatmHelpers.js";

// POST /api/khatms/:id/invite — returns the (already-generated) invite code
// for this Khatm. Any member can share it.
export const getInvite = asyncHandler(async (req, res) => {
  const khatm = await getKhatmOr404(req.params.id);
  assertIsMember(khatm, req.user._id);
  res.json({ success: true, data: { inviteCode: khatm.inviteCode } });
});

// GET /api/invite/:inviteCode — PUBLIC preview (no auth) so the "Join Khatm"
// screen can show the Khatm's name, progress, and member count before the
// person signs in or creates an account.
export const previewInvite = asyncHandler(async (req, res) => {
  const khatm = await Khatm.findOne({ inviteCode: req.params.inviteCode });
  if (!khatm) throw new ApiError(404, "Invalid or expired invite link.");

  const completed = khatm.paras.filter((p) => p.status === "completed").length;

  res.json({
    success: true,
    data: {
      id: khatm._id,
      title: khatm.title,
      dedicatedTo: khatm.dedicatedTo,
      intentionType: khatm.intentionType,
      message: khatm.message,
      memberCount: khatm.members.length,
      completedParas: completed,
      totalParas: 30,
      status: khatm.status,
    },
  });
});

// POST /api/invite/:inviteCode/join — requires auth; adds the current user
// as a member of the Khatm matching this invite code.
export const joinByInvite = asyncHandler(async (req, res) => {
  const khatm = await Khatm.findOne({ inviteCode: req.params.inviteCode });
  if (!khatm) throw new ApiError(404, "Invalid or expired invite link.");

  if (isMember(khatm, req.user._id)) {
    return res.json({ success: true, data: khatm, message: "Already a member." });
  }

  khatm.members.push({ user: req.user._id });
  await khatm.save();
  await Activity.create({ khatm: khatm._id, user: req.user._id, action: "joined" });

  res.json({ success: true, data: khatm });
});
