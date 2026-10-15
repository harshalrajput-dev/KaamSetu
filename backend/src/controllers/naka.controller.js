import Naka from "../models/Naka.js";
import User, { ROLES } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";

export const createNaka = asyncHandler(async (req, res) => {
  const { name, city, address, area, contactNumber, isActive } = req.body;
  const naka = await Naka.create({
    name,
    city,
    address: address || "",
    area: area || "",
    contactNumber: contactNumber || "",
    isActive: isActive ?? true,
  });
  res.status(201).json({ success: true, data: { naka } });
});

export const listNakas = asyncHandler(async (req, res) => {
  // naka_admin may read their own naka only; others filtered below.
  if (req.user.role === ROLES.NAKA_ADMIN) {
    const naka = await Naka.findById(req.user.naka?._id || req.user.naka).populate(
      "admin",
      "name email phone"
    );
    return res.json({ success: true, data: { items: naka ? [naka] : [], total: naka ? 1 : 0 } });
  }

  const filter = {};
  if (req.query.city) filter.city = req.query.city;
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Naka.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("admin", "name email phone"),
    Naka.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

export const getNaka = asyncHandler(async (req, res) => {
  const naka = await Naka.findById(req.params.id).populate("admin", "name email phone");
  if (!naka) throw ApiError.notFound("Naka not found");

  if (req.user.role === ROLES.NAKA_ADMIN) {
    const own = req.user.naka?._id || req.user.naka;
    if (String(naka._id) !== String(own)) {
      throw ApiError.forbidden("You cannot view another naka");
    }
  }

  res.json({ success: true, data: { naka } });
});

export const updateNaka = asyncHandler(async (req, res) => {
  const naka = await Naka.findById(req.params.id);
  if (!naka) throw ApiError.notFound("Naka not found");

  const allowed = ["name", "city", "address", "area", "contactNumber", "isActive"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) naka[key] = req.body[key];
  }
  await naka.save();
  res.json({ success: true, data: { naka } });
});

/**
 * Super admin creates a naka_admin account tied to a naka.
 */
export const createNakaAdmin = asyncHandler(async (req, res) => {
  const { name, phone, email, password } = req.body;
  const nakaId = req.params.id || req.body.naka;

  if (!nakaId) throw ApiError.badRequest("Valid naka is required");

  const naka = await Naka.findById(nakaId);
  if (!naka) throw ApiError.notFound("Naka not found");

  const or = [{ phone }];
  if (email) or.push({ email: email.toLowerCase() });
  const exists = await User.findOne({ $or: or });
  if (exists) throw ApiError.conflict("A user with this email or phone already exists");

  const passwordHash = await hashPassword(password);
  const admin = await User.create({
    name,
    phone,
    email: email ? email.toLowerCase() : undefined,
    passwordHash,
    role: ROLES.NAKA_ADMIN,
    naka: naka._id,
  });

  naka.admin = admin._id;
  await naka.save();

  res.status(201).json({ success: true, data: { user: admin.toSafeJSON() } });
});
