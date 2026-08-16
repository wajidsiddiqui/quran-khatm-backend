import Khatm from "../models/Khatm.js";
import Activity from "../models/Activity.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import {
  getKhatmOr404,
  assertIsMember,
  isMember,
} from "../utils/khatmHelpers.js";

// POST /api/khatms
// Create a new Khatm
export const createKhatm = asyncHandler(
  async (req, res) => {
    const {
      title,
      dedicatedTo,
      intentionType,
      message,
      privacy,
    } = req.body;

    if (!title || !dedicatedTo) {
      throw new ApiError(
        400,
        "title and dedicatedTo are required."
      );
    }

    let inviteCode;

    do {
      inviteCode = Khatm.generateInviteCode();
    } while (
      await Khatm.exists({ inviteCode })
    );

    const khatm = await Khatm.create({
      title,
      dedicatedTo,
      intentionType,
      message,
      privacy,

      createdBy: req.user._id,

      members: [
        {
          user: req.user._id,
        },
      ],

      paras: Khatm.buildParas(),

      inviteCode,
    });

    await Activity.create({
      khatm: khatm._id,
      user: req.user._id,
      action: "joined",
    });

    res.status(201).json({
      success: true,
      data: khatm,
    });
  }
);


// GET /api/khatms
// Get all Khatms where current user is a member
export const listMyKhatms = asyncHandler(
  async (req, res) => {
    const khatms = await Khatm.find({
      "members.user": req.user._id,
    })
      .sort({
        createdAt: -1,
      })
      .populate(
        "paras.assignedTo",
        "name profileImage"
      );

    res.json({
      success: true,
      data: khatms,
    });
  }
);


// GET /api/khatms/invite/:inviteCode
// Get Khatm details using invite code
export const getKhatmByInviteCode = asyncHandler(
  async (req, res) => {
    const { inviteCode } = req.params;

    const khatm = await Khatm.findOne({
      inviteCode,
    }).populate(
      "paras.assignedTo",
      "name profileImage"
    );

    if (!khatm) {
      throw new ApiError(
        404,
        "Invalid or expired invite link."
      );
    }

    res.json({
      success: true,
      data: khatm,
    });
  }
);


// GET /api/khatms/:id
// Current user must be a member
export const getKhatm = asyncHandler(
  async (req, res) => {
    const khatm = await getKhatmOr404(
      req.params.id
    );

    assertIsMember(
      khatm,
      req.user._id
    );

    // Populate assigned user's name
    await khatm.populate(
      "paras.assignedTo",
      "name profileImage"
    );

    res.json({
      success: true,
      data: khatm,
    });
  }
);


// PUT /api/khatms/:id
// Only creator can update
export const updateKhatm = asyncHandler(
  async (req, res) => {
    const khatm = await getKhatmOr404(
      req.params.id
    );

    if (
      khatm.createdBy.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "Only the creator can edit this Khatm."
      );
    }

    const editable = [
      "title",
      "dedicatedTo",
      "intentionType",
      "message",
      "privacy",
    ];

    editable.forEach((field) => {
      if (
        req.body[field] !== undefined
      ) {
        khatm[field] = req.body[field];
      }
    });

    await khatm.save();

    res.json({
      success: true,
      data: khatm,
    });
  }
);


// GET /api/khatms/:id/members
export const listMembers = asyncHandler(
  async (req, res) => {
    const khatm = await getKhatmOr404(
      req.params.id
    );

    assertIsMember(
      khatm,
      req.user._id
    );

    await khatm.populate(
      "members.user",
      "name email profileImage"
    );

    res.json({
      success: true,
      data: khatm.members,
    });
  }
);


// POST /api/khatms/:id/join
export const joinKhatm = asyncHandler(
  async (req, res) => {
    const khatm = await getKhatmOr404(
      req.params.id
    );

    if (
      khatm.privacy === "private" &&
      khatm.createdBy.toString() !==
        req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "This Khatm is private."
      );
    }

    if (
      isMember(
        khatm,
        req.user._id
      )
    ) {
      return res.json({
        success: true,
        data: khatm,
        message: "Already a member.",
      });
    }

    khatm.members.push({
      user: req.user._id,
    });

    await khatm.save();

    await Activity.create({
      khatm: khatm._id,
      user: req.user._id,
      action: "joined",
    });

    res.json({
      success: true,
      data: khatm,
    });
  }
);