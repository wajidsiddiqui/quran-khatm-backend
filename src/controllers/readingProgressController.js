import ReadingProgress from "../models/ReadingProgress.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import {
  getKhatmOr404,
  assertIsMember,
} from "../utils/khatmHelpers.js";


/* ========================================
   VALIDATE SURAH / AYAH POSITION
======================================== */

function validateReadingPosition({
  surahNumber,
  ayahNumber,
  globalAyahNumber,
}) {
  const surah =
    Number(surahNumber);

  const ayah =
    Number(ayahNumber);

  const globalAyah =
    Number(globalAyahNumber);


  if (
    !Number.isInteger(surah) ||
    surah < 1 ||
    surah > 114
  ) {
    throw new ApiError(
      400,
      "Surah number must be an integer between 1 and 114.",
    );
  }


  if (
    !Number.isInteger(ayah) ||
    ayah < 1
  ) {
    throw new ApiError(
      400,
      "Ayah number must be a positive integer.",
    );
  }


  if (
    !Number.isInteger(globalAyah) ||
    globalAyah < 1 ||
    globalAyah > 6236
  ) {
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


/* ========================================
   GET ALL SAVED READING LOCATIONS

   GET /api/reading-progress
======================================== */

export const getAllReadingProgress =
  asyncHandler(async (req, res) => {
    const progress =
      await ReadingProgress.find({
        user: req.user._id,
      })
        .populate({
          path: "khatm",
          select: "dedicatedTo title",
        })
        .sort({
          updatedAt: -1,
        });


    res.status(200).json({
      success: true,
      data: progress,
    });
  });


/* ========================================
   GET ALL QURAN-ONLY BOOKMARKS

   GET /api/reading-progress/quran
======================================== */

export const getQuranBookmarks =
  asyncHandler(async (req, res) => {
    const bookmarks =
      await ReadingProgress.find({
        user: req.user._id,
        type: "quran",
      })
        .sort({
          updatedAt: -1,
        });


    res.status(200).json({
      success: true,
      data: bookmarks,
    });
  });


/* ========================================
   SAVE / UPDATE QURAN BOOKMARK

   POST /api/reading-progress/quran

   ONE BOOKMARK PER:
   USER + SURAH

   If the user saves another Ayah
   inside the same Surah, the existing
   bookmark is updated instead of creating
   a duplicate.
======================================== */

export const saveQuranBookmark =
  asyncHandler(async (req, res) => {
    const {
      surahNumber,
      ayahNumber,
      globalAyahNumber,
    } =
      validateReadingPosition(
        req.body,
      );


    /*
     * ====================================
     * FIND EXISTING BOOKMARK
     *
     * Search using:
     *
     * User + Quran type + Surah
     * ====================================
     */

    let bookmark =
      await ReadingProgress.findOne({
        user: req.user._id,
        type: "quran",
        surahNumber,
      });


    /*
     * ====================================
     * UPDATE EXISTING BOOKMARK
     * ====================================
     */

    if (bookmark) {
      bookmark.ayahNumber =
        ayahNumber;

      bookmark.globalAyahNumber =
        globalAyahNumber;


      /*
       * Ensure Quran bookmarks do not
       * accidentally contain Khatm data.
       */

      bookmark.khatm =
        undefined;

      bookmark.paraNumber =
        undefined;


      await bookmark.save();


      return res.status(200).json({
        success: true,
        data: bookmark,
      });
    }


    /*
     * ====================================
     * CREATE NEW BOOKMARK
     * ====================================
     */

    bookmark =
      await ReadingProgress.create({
        user: req.user._id,

        type: "quran",

        surahNumber,

        ayahNumber,

        globalAyahNumber,
      });


    return res.status(201).json({
      success: true,
      data: bookmark,
    });
  });


/* ========================================
   GET KHATM READING PROGRESS

   GET /api/reading-progress/:khatmId/:paraNumber
======================================== */

export const getReadingProgress =
  asyncHandler(async (req, res) => {
    const paraNumber =
      Number(
        req.params.paraNumber,
      );


    if (
      !Number.isInteger(paraNumber) ||
      paraNumber < 1 ||
      paraNumber > 30
    ) {
      throw new ApiError(
        400,
        "Para number must be an integer between 1 and 30.",
      );
    }


    const khatm =
      await getKhatmOr404(
        req.params.khatmId,
      );


    assertIsMember(
      khatm,
      req.user._id,
    );


    const progress =
      await ReadingProgress.findOne({
        user: req.user._id,
        type: "khatm",
        khatm: khatm._id,
        paraNumber,
      });


    res.status(200).json({
      success: true,
      data: progress,
    });
  });


/* ========================================
   SAVE / UPDATE KHATM READING PROGRESS

   POST /api/reading-progress/:khatmId/:paraNumber
======================================== */

export const saveReadingProgress =
  asyncHandler(async (req, res) => {
    const paraNumber =
      Number(
        req.params.paraNumber,
      );


    if (
      !Number.isInteger(paraNumber) ||
      paraNumber < 1 ||
      paraNumber > 30
    ) {
      throw new ApiError(
        400,
        "Para number must be an integer between 1 and 30.",
      );
    }


    const khatm =
      await getKhatmOr404(
        req.params.khatmId,
      );


    assertIsMember(
      khatm,
      req.user._id,
    );


    const para =
      khatm.paras.find(
        (p) =>
          p.number ===
          paraNumber,
      );


    if (!para) {
      throw new ApiError(
        404,
        `Para ${paraNumber} not found.`,
      );
    }


    /*
     * User can save progress only
     * for their assigned Para.
     */

    if (
      para.assignedTo?.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You can only save reading progress for your assigned Para.",
      );
    }


    /*
     * Completed Para should not receive
     * additional reading progress updates.
     */

    if (
      para.status === "completed"
    ) {
      throw new ApiError(
        400,
        `Para ${paraNumber} is already completed.`,
      );
    }


    const {
      surahNumber,
      ayahNumber,
      globalAyahNumber,
    } =
      validateReadingPosition(
        req.body,
      );


    /*
     * ====================================
     * FIND EXISTING KHATM PROGRESS
     *
     * One record per:
     *
     * User + Khatm + Para
     * ====================================
     */

    let progress =
      await ReadingProgress.findOne({
        user: req.user._id,
        type: "khatm",
        khatm: khatm._id,
        paraNumber,
      });


    /*
     * UPDATE EXISTING PROGRESS
     */

    if (progress) {
      progress.surahNumber =
        surahNumber;

      progress.ayahNumber =
        ayahNumber;

      progress.globalAyahNumber =
        globalAyahNumber;


      await progress.save();


      return res.status(200).json({
        success: true,
        data: progress,
      });
    }


    /*
     * CREATE NEW KHATM PROGRESS
     */

    progress =
      await ReadingProgress.create({
        user: req.user._id,
        type: "khatm",
        khatm: khatm._id,
        paraNumber,
        surahNumber,
        ayahNumber,
        globalAyahNumber,
      });


    return res.status(201).json({
      success: true,
      data: progress,
    });
  });


/* ========================================
   DELETE SAVED READING PROGRESS

   DELETE /api/reading-progress/:progressId
======================================== */

export const deleteReadingProgress =
  asyncHandler(async (req, res) => {
    const progress =
      await ReadingProgress.findOne({
        _id: req.params.progressId,
        user: req.user._id,
      });


    if (!progress) {
      throw new ApiError(
        404,
        "Saved reading progress not found.",
      );
    }


    await progress.deleteOne();


    res.status(200).json({
      success: true,
      message:
        "Saved reading progress deleted successfully.",
      data: {
        _id: progress._id,
      },
    });
  });