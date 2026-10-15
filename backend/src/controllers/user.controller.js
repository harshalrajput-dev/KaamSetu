import User, { ROLES } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  if (req.query.naka) filter.naka = req.query.naka;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("naka", "name city"),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map((u) => u.toSafeJSON()),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate("naka", "name city");
  if (!user) throw ApiError.notFound("User not found");
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role } = req.body;
  const finalRole = role || ROLES.CUSTOMER;
  if (finalRole === ROLES.NAKA_ADMIN) {
    throw ApiError.badRequest("Create naka admins via the Naka Admins section");
  }
  if (finalRole === ROLES.WORKER) {
    throw ApiError.badRequest("Create worker logins via the Workers section");
  }

  const or = [{ phone }];
  if (email) or.push({ email: email.toLowerCase() });
  const exists = await User.findOne({ $or: or });
  if (exists) throw ApiError.conflict("A user with this email or phone already exists");

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    phone,
    email: email ? email.toLowerCase() : undefined,
    passwordHash,
    role: finalRole,
  });

  res.status(201).json({ success: true, data: { user: user.toSafeJSON() } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const allowed = ["name", "email", "isActive"];
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

  if (req.body.naka !== undefined && user.role === ROLES.NAKA_ADMIN) {
    user.naka = req.body.naka || null;
  }

  await user.save();
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

/**
 * Activate / deactivate an account. Super admin cannot deactivate themselves.
 */
export const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest("You cannot change your own activation status");
  }

  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const { password } = req.body;
  if (!password || password.length < 6) {
    throw ApiError.badRequest("Password must be at least 6 characters");
  }
  user.passwordHash = await hashPassword(password);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: "Password reset successfully" });
});
