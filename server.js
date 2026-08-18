import dotenv from "dotenv";
dotenv.config();

console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log(
  "RESEND_API_KEY prefix:",
  process.env.RESEND_API_KEY?.substring(0, 3)
);

import { createApp } from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Quran Khatm API listening on http://localhost:${PORT}`);
  });
}

main();