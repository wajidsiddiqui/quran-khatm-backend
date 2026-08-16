import mongoose from "mongoose";
import dns from "dns";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set — copy .env.example to .env and fill it in.",
    );
  }

  dns.setServers(["8.8.8.8", "8.8.4.4"]);

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
}
