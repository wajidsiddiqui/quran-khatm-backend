import Khatm from "../models/Khatm.js";
import { ApiError } from "./ApiError.js";

export async function getKhatmOr404(id) {
  const khatm = await Khatm.findById(id);
  if (!khatm) throw new ApiError(404, "Khatm not found.");
  return khatm;
}

export function assertIsMember(khatm, userId) {
  const isMember = khatm.members.some((m) => m.user.toString() === userId.toString());
  if (!isMember) throw new ApiError(403, "You are not a member of this Khatm.");
}

export function isMember(khatm, userId) {
  return khatm.members.some((m) => m.user.toString() === userId.toString());
}
