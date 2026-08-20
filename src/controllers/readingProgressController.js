import ReadingProgress from "../models/ReadingProgress.js";
import Khatm from "../models/Khatm.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { getKhatmOr404, assertIsMember } from "../utils/khatmHelpers.js";

function parseParaNumber(raw) {
  const n = Number(raw);

  if (!Number.isInteger(n) || n < 1 || n > 30) {
    throw new ApiError(400, "Para number must be an integer between 1 and 30.");
  }

  return n;
}

function validateReadingPosition({
  surahNumber,
  ayahNumber,
  globalAyahNumber,
}) {
  const surah = Number(surahNumber);
  const ayah = Number(ayahNumber);
  const globalAyah = Number(globalAyahNumber);

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new ApiError(
      400,
      "Surah number must be an integer between 1 and 114.",
    );
  }

  if (!Number.isInteger(ayah) || ayah < 1) {
    throw new ApiError(400, "Ayah number must be a positive integer.");
  }

  if (!Number.isInteger(globalAyah) || globalAyah < 1 || globalAyah > 6236) {
    throw new ApiError(
      400,
      "Global Ayah number must be an integer between 1 and 6236.",
    );
  }

  return {
    surahNumber: surah,
    ayahNumber: ayah,
    globalAyahNumber: globalAyah,
  };
}

// GET /api/reading-progress/:khatmId/:paraNumber
export const getReadingProgress = asyncHandler(async (req, res) => {
  const paraNumber = parseParaNumber(req.params.paraNumber);

  const khatm = await getKhatmOr404(req.params.khatmId);

  assertIsMember(khatm, req.user._id);

  const progress = await ReadingProgress.findOne({
    user: req.user._id,
    khatm: khatm._id,
    paraNumber,
  });

  res.json({
    success: true,
    data: progress,
  });
});

// POST /api/reading-progress/:khatmId/:paraNumber
export const saveReadingProgress = asyncHandler(async (req, res) => {
  const paraNumber = parseParaNumber(req.params.paraNumber);

  const khatm = await getKhatmOr404(req.params.khatmId);

  assertIsMember(khatm, req.user._id);

  // Khatm must still exist and contain this Para
  const para = khatm.paras.find((p) => p.number === paraNumber);

  if (!para) {
    throw new ApiError(404, `Para ${paraNumber} not found.`);
  }

  // Only the member who claimed this Para
  // can save reading progress for it.
  if (para.assignedTo?.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You can only save reading progress for your assigned Para.",
    );
  }

  // A completed Para does not need further
  // reading-progress updates.
  if (para.status === "completed") {
    throw new ApiError(400, `Para ${paraNumber} is already completed.`);
  }

  const { surahNumber, ayahNumber, globalAyahNumber } = validateReadingPosition(
    req.body,
  );

  const progress = await ReadingProgress.findOneAndUpdate(
    {
      user: req.user._id,
      khatm: khatm._id,
      paraNumber,
    },
    {
      $set: {
        surahNumber,
        ayahNumber,
        globalAyahNumber,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  res.json({
    success: true,
    data: progress,
  });
});
