import { verifyToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Protects a route — requires a valid "Authorization: Bearer <token>" header.
// Attaches the authenticated user to req.user (without the password hash).
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated — missing or malformed Authorization header.");
  }

  const token = header.split(" ")[1];
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Not authenticated — invalid or expired token.");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, "Not authenticated — user no longer exists.");
  }

  req.user = user;
  next();
});
