import Worker from "../models/Worker.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import User, { ROLES } from "../models/User.js";
import { BOOKING_STATUS } from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";
import { recordAudit } from "../utils/audit.js";
import { hashPassword } from "../utils/password.js";

const ACTIVE_WORK_STATUSES = [
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.IN_PROGRESS,
];

/**
 * Resolve which naka the caller may operate on.
 * naka_admin is always locked to their own naka.
 */
function resolveScope(req) {
  if (req.user.role === ROLES.SUPER_ADMIN) return null; // all
  const nakaId = req.user.naka?._id || req.user.naka;
  if (!nakaId) throw ApiError.forbidden("No naka assigned to your account");
  return nakaId;
}

/**
 * Creates a login account linked to a worker so the worker can use the app.
 * The worker's contact number doubles as the login phone.
 */
async function attachWorkerLogin(req, worker, { email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: worker.contactNumber }],
  });
  if (existing) {
    throw ApiError.conflict("A login with this email or contact number already exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: worker.name,
    phone: worker.contactNumber,
    email: normalizedEmail,
    passwordHash,
    role: ROLES.WORKER,
    worker: worker._id,
    naka: worker.naka,
  });

  worker.loginUser = user._id;
  await worker.save();

  await recordAudit(req, {
    action: "worker.login_created",
    entityType: "Worker",
    entityId: worker._id,
    meta: { email: normalizedEmail },
  });

  return user;
}

export const createWorker = asyncHandler(async (req, res) => {
  const scope = resolveScope(req);
  const { name, contactNumber, skills, isAvailable, isActive, email, password } = req.body;
  const naka = req.user.role === ROLES.SUPER_ADMIN ? req.body.naka : scope;
  if (!naka) throw ApiError.badRequest("Naka is required");

  const worker = await Worker.create({
    name,
    contactNumber,
    skills: skills || [],
    naka,
    isAvailable: isAvailable ?? true,
    isActive: isActive ?? true,
  });

  // Optional: create an app login for this worker at the same time.
  if (email && password) {
    await attachWorkerLogin(req, worker, { email, password });
  }

  res.status(201).json({ success: true, data: { worker } });
});

/**
 * Create or reset the app login for an existing worker.
 */
export const setWorkerAccount = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  const { email, password } = req.body;

  if (worker.loginUser) {
    // Reset the password (and optionally the email) of the existing login.
    const user = await User.findById(worker.loginUser);
    if (!user) {
      worker.loginUser = null;
    } else {
      if (email) user.email = String(email).trim().toLowerCase();
      user.passwordHash = await hashPassword(password);
      user.isActive = true;
      await user.save({ validateBeforeSave: false });
      await recordAudit(req, {
        action: "worker.login_reset",
        entityType: "Worker",
        entityId: worker._id,
        meta: {},
      });
      return res.json({ success: true, data: { worker } });
    }
  }

  if (!email) throw ApiError.badRequest("Email is required to create a login");
  await attachWorkerLogin(req, worker, { email, password });
  res.status(201).json({ success: true, data: { worker } });
});

export const listWorkers = asyncHandler(async (req, res) => {
  const scope = resolveScope(req);
  const filter = {};
  if (scope) filter.naka = scope;
  if (req.user.role === ROLES.SUPER_ADMIN && req.query.naka) filter.naka = req.query.naka;

  if (req.query.status === "available") filter.isAvailable = true;
  if (req.query.status === "unavailable") filter.isAvailable = false;
  if (req.query.status === "blocked") filter.isBlocked = true;
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  if (req.query.skill) filter.skills = req.query.skill;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { contactNumber: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Worker.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("naka", "name city"),
    Worker.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

export const getWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id).populate("naka", "name city");
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka._id || worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  res.json({ success: true, data: { worker } });
});

export const updateWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  const allowed = ["name", "contactNumber", "skills", "isAvailable", "isActive"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) worker[key] = req.body[key];
  }

  await worker.save();
  res.json({ success: true, data: { worker } });
});

export const deleteWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  // Soft delete keeps booking history intact.
  worker.isActive = false;
  worker.isAvailable = false;
  await worker.save();

  // Also disable the linked app login, if any.
  if (worker.loginUser) {
    await User.updateOne({ _id: worker.loginUser }, { isActive: false });
  }

  res.json({ success: true, message: "Worker deactivated" });
});

export const addAttendance = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  const { present, note, date } = req.body;
  worker.attendance.push({ present, note: note || "", date: date ? new Date(date) : new Date() });
  await worker.save();

  res.status(201).json({ success: true, data: { worker } });
});

/**
 * Reliability stats for a worker: completed/active jobs, ratings, no-shows.
 * All figures are derived from real records (no stored duplicates).
 */
export const workerStats = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  const [completedJobs, activeJobs, ratingAgg] = await Promise.all([
    Booking.countDocuments({ assignedWorkers: worker._id, status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ assignedWorkers: worker._id, status: { $in: ACTIVE_WORK_STATUSES } }),
    Review.aggregate([
      { $match: { workers: worker._id } },
      { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
    ]),
  ]);

  const rating = ratingAgg[0] || { count: 0, average: 0 };

  res.json({
    success: true,
    data: {
      completedJobs,
      activeJobs,
      noShowCount: worker.noShowCount || 0,
      warningCount: worker.warningCount || 0,
      isBlocked: worker.isBlocked,
      suspendedUntil: worker.suspendedUntil,
      isActive: worker.isActive,
      isAvailable: worker.isAvailable,
      rating: { count: rating.count, average: rating.average ? Number(rating.average.toFixed(2)) : 0 },
    },
  });
});

/**
 * Apply a sanction to a worker: warn, suspend, block, or reinstate.
 * block/unblock and suspend are reviewed by admins; the reason is recorded.
 */
export const sanctionWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw ApiError.notFound("Worker not found");

  const scope = resolveScope(req);
  if (scope && String(worker.naka) !== String(scope)) {
    throw ApiError.forbidden("This worker does not belong to your naka");
  }

  const { action, days, note } = req.body;

  switch (action) {
    case "warn":
      worker.warningCount = (worker.warningCount || 0) + 1;
      break;
    case "suspend": {
      const d = Number(days) || 7;
      const until = new Date();
      until.setDate(until.getDate() + d);
      worker.suspendedUntil = until;
      worker.isAvailable = false;
      break;
    }
    case "block":
      worker.isBlocked = true;
      worker.isAvailable = false;
      break;
    case "unblock":
      worker.isBlocked = false;
      break;
    case "reinstate":
      worker.isBlocked = false;
      worker.suspendedUntil = null;
      worker.isActive = true;
      break;
    default:
      throw ApiError.badRequest("Unknown sanction action");
  }

  worker.sanctionNote = note || worker.sanctionNote;
  await worker.save();

  await recordAudit(req, {
    action: `worker.${action}`,
    entityType: "Worker",
    entityId: worker._id,
    meta: { note: note || "" },
  });

  res.json({ success: true, data: { worker } });
});
