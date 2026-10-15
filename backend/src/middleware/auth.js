import { verifyToken } from "../utils/jwt.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Reads the Bearer token, verifies it and loads the user.
 * Always re-checks the user in the DB so a deactivated account
 * loses access immediately even if the token is still valid.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Authentication required");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.findById(payload.sub)
    .populate("naka", "name city isActive")
    .populate("worker", "name contactNumber skills naka isAvailable isActive isBlocked suspendedUntil");
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account is not active");
  }

  req.user = user;
  next();
});

export default authenticate;
