import mongoose from "mongoose";

const readingProgressSchema = new mongoose.Schema(
  {
    /*
     * ========================================
     * USER
     * ========================================
     */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /*
     * ========================================
     * READING PROGRESS TYPE
     *
     * "khatm" = Reading position inside a Khatm
     * "quran" = Normal Quran reading position
     * ========================================
     */

    type: {
      type: String,
      enum: ["khatm", "quran"],
      required: true,
    },

    /*
     * ========================================
     * KHATM
     *
     * Required only for Khatm reading progress.
     *
     * Normal Quran reading positions do not
     * belong to any Khatm.
     * ========================================
     */

    khatm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khatm",
      required: function () {
        return this.type === "khatm";
      },
    },

    /*
     * ========================================
     * PARA
     *
     * Required only for Khatm reading progress.
     * ========================================
     */

    paraNumber: {
      type: Number,
      min: 1,
      max: 30,
      required: function () {
        return this.type === "khatm";
      },
    },

    /*
     * ========================================
     * SURAH
     *
     * Required for both:
     * - Normal Quran reading
     * - Khatm reading
     * ========================================
     */

    surahNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 114,
    },

    /*
     * ========================================
     * AYAH
     *
     * Required for both:
     * - Normal Quran reading
     * - Khatm reading
     * ========================================
     */

    ayahNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
     * ========================================
     * GLOBAL AYAH NUMBER
     *
     * Required for both:
     * - Normal Quran reading
     * - Khatm reading
     *
     * Total Quran Ayahs = 6236
     * ========================================
     */

    globalAyahNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6236,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * ========================================
 * KHATM UNIQUE READING POSITION
 *
 * One record per:
 *
 * User + Khatm + Para
 *
 * Example:
 *
 * User A
 * Ramadan Khatm
 * Para 5
 *
 * Only ONE latest reading position can exist.
 *
 * Saving another position inside the same Para
 * should update the existing record.
 * ========================================
 */

readingProgressSchema.index(
  {
    user: 1,
    khatm: 1,
    paraNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: "khatm",
    },
  },
);

/*
 * ========================================
 * NORMAL QURAN UNIQUE READING POSITION
 *
 * One record per:
 *
 * User + Surah
 *
 * Example:
 *
 * User A
 * Surah 2 → Ayah 50
 *
 * Later:
 *
 * User A
 * Surah 2 → Ayah 256
 *
 * The Ayah 50 position must be replaced by
 * Ayah 256.
 *
 * Different Surahs can each have their own
 * saved reading position.
 * ========================================
 */

readingProgressSchema.index(
  {
    user: 1,
    surahNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: "quran",
    },
  },
);

export default mongoose.model(
  "ReadingProgress",
  readingProgressSchema,
);