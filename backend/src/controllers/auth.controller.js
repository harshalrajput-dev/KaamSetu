import User, { ROLES } from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { randomToken, sha256 } from "../utils/ids.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Public registration. Role is ALWAYS customer - admins can never be
 * created through the public endpoint.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, address, area, city } = req.body;

  const or = [{ phone }];
  if (email) or.push({ email: email.toLowerCase() });

  const existing = await User.findOne({ $or: or });
  if (existing) {
    throw ApiError.conflict("An account with this email or phone already exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    phone,
    email: email ? email.toLowerCase() : undefined,
    passwordHash,
    role: ROLES.CUSTOMER,
    address: address || "",
    area: area || "",
    city: city || "Surat",
  });

  const token = signToken(user);
  res.status(201).json({ success: true, data: { token, user: user.toSafeJSON() } });
});

/**
 * Login using email OR phone number.
 */
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const normalized = String(identifier).trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalized }, { phone: identifier.trim() }],
  })
    .select("+passwordHash")
    .populate("naka", "name city isActive")
    .populate("worker", "name skills isAvailable");

  // Same generic message whether user or password is wrong.
  if (!user) throw ApiError.unauthorized("Invalid credentials");
  if (!user.isActive) throw ApiError.forbidden("Account is deactivated. Contact support.");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized("Invalid credentials");

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  res.json({ success: true, data: { token, user: user.toSafeJSON() } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

/**
 * Self-service profile update. Role, password and activation status can
 * never be changed here.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found");

  const allowed = ["name", "address", "area", "city"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }

  if (req.body.phone !== undefined) {
    const phone = String(req.body.phone).trim();
    if (!/^[0-9]{10,15}$/.test(phone)) {
      throw ApiError.badRequest("Contact number must be 10-15 digits");
    }
    const taken = await User.findOne({ phone, _id: { $ne: user._id } });
    if (taken) throw ApiError.conflict("Phone number already in use");
    user.phone = phone;
  }

  if (req.body.email !== undefined) {
    const email = req.body.email ? String(req.body.email).toLowerCase() : undefined;
    if (email) {
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) throw ApiError.conflict("Email already in use");
    }
    user.email = email;
  }

  await user.save();
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  user.passwordHash = await hashPassword(newPassword);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: "Password updated successfully" });
});

/**
 * Forgot password. No external email/SMS is configured for the MVP, so we
 * generate a secure single-use token and (in non-production) return it in
 * the response so an admin can hand it to the user. In production the token
 * must be delivered through a real email/SMS provider - see README.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const normalized = String(identifier).trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalized }, { phone: String(identifier).trim() }],
  });

  // Always answer the same way to avoid user enumeration.
  const generic = {
    success: true,
    message: "If the account exists, a password reset token has been generated.",
  };

  if (!user) return res.json(generic);

  const token = randomToken(32);
  user.passwordResetTokenHash = sha256(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save({ validateBeforeSave: false });

  const payload = { ...generic };
  if (process.env.NODE_ENV !== "production") {
    payload.data = { resetToken: token, expiresInMinutes: 30 };
  }
  return res.json(payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetTokenHash: sha256(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) throw ApiError.badRequest("Invalid or expired reset token");

  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Password has been reset successfully" });
});
