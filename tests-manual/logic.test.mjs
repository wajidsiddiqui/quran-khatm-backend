// Pure-logic tests — no live MongoDB connection required for any of these.
process.env.JWT_SECRET = "test-secret";

import Khatm from "./src/models/Khatm.js";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "./src/utils/token.js";

let failed = 0;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + " — " + label);
  if (!cond) failed++;
}

// 1. buildParas() — the exact function used when a Khatm is created
const paras = Khatm.buildParas();
check("buildParas() returns exactly 30 paras", paras.length === 30);
check("all paras start as 'available'", paras.every((p) => p.status === "available"));
check("para numbers are 1..30 in order", paras.every((p, i) => p.number === i + 1));

// 2. progress virtual — construct an in-memory (unsaved) document; virtuals
// work without touching the database.
const doc = new Khatm({
  title: "t",
  dedicatedTo: "d",
  createdBy: new (await import("mongoose")).default.Types.ObjectId(),
  inviteCode: "TESTCODE1",
  paras: Khatm.buildParas().map((p, i) => {
    if (i < 9) return { ...p, status: "completed" };
    if (i === 9) return { ...p, status: "claimed" };
    return p;
  }),
});
check("progress.completed = 9", doc.progress.completed === 9);
check("progress.claimed = 1", doc.progress.claimed === 1);
check("progress.available = 20", doc.progress.available === 20);
check("progress.percent = 30 (9/30)", doc.progress.percent === 30);

// after completing the 10th
doc.paras[9].status = "completed";
check("progress.percent = 33 after 10th completion (matches spec's example)", doc.progress.percent === 33);
check("claiming never inflates percent (still excluded once re-marked available)", (() => {
  doc.paras[10].status = "claimed";
  return doc.progress.percent === 33; // unchanged by a claim
})());

// 3. bcrypt hash/compare round-trip (pure JS, no native binary needed)
const hash = await bcrypt.hash("password123", 10);
check("bcrypt hash is not the plaintext", hash !== "password123");
check("bcrypt.compare matches correct password", await bcrypt.compare("password123", hash));
check("bcrypt.compare rejects wrong password", !(await bcrypt.compare("wrongpass", hash)));

// 4. JWT sign/verify round-trip
const token = signToken("507f1f77bcf86cd799439011");
const payload = verifyToken(token);
check("JWT round-trips the user id", payload.sub === "507f1f77bcf86cd799439011");

let threw = false;
try {
  verifyToken("not-a-real-token");
} catch {
  threw = true;
}
check("verifyToken rejects a garbage token", threw);

console.log(failed ? `\n>>> ${failed} LOGIC TEST(S) FAILED <<<` : "\n>>> ALL LOGIC TESTS PASSED <<<");
process.exit(failed ? 1 : 0);
