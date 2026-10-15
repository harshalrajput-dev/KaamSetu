import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import Naka from "../models/Naka.js";
import { ROLES } from "../models/User.js";
import { BOOKING_STATUS, BOOKING_STATUS_TRANSITIONS } from "../config/constants.js";
import { generateBookingId } from "../utils/ids.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NAKA_ADMIN_POPULATE, paginate } from "../services/booking.service.js";
import { recordAudit } from "../utils/audit.js";

const ACTIVE_WORK_STATUSES = [
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.IN_PROGRESS,
];

// Fields exposed to customers for an assigned worker.
const ASSIGNED_WORKER_FIELDS = "name contactNumber skills photoUrl isAvailable isActive";

function assertTransition(from, to) {
  const allowed = BOOKING_STATUS_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw ApiError.badRequest(`Cannot change status from "${from}" to "${to}"`);
  }
}

/**
 * Shapes a populated Worker document into the customer-facing "assignedWorker"
 * object. Returns null when the entry is not populated (e.g. a raw ObjectId).
 */
function presentAssignedWorker(worker) {
  if (!worker || !worker.name) return null;
  return {
    _id: worker._id,
    id: worker._id,
    name: worker.name,
    phone: worker.contactNumber,
    contactNumber: worker.contactNumber,
    skills: worker.skills || [],
    photo: worker.photoUrl || "",
    isAvailable: worker.isAvailable,
    isActive: worker.isActive,
  };
}

/**
 * Adds a convenience `assignedWorker` (first assigned worker) plus flat
 * `workerName` / `workerPhone` fields so customers always receive the full
 * worker details without walking the assignedWorkers array.
 */
function serializeBooking(booking) {
  const obj = typeof booking?.toObject === "function" ? booking.toObject() : booking;
  if (!obj) return obj;

  const list = Array.isArray(obj.assignedWorkers) ? obj.assignedWorkers : [];
  const primary = list.find((w) => w && w.name) || null;
  const assignedWorker = presentAssignedWorker(primary);

  return {
    ...obj,
    assignedWorker,
    workerName: assignedWorker?.name || null,
    workerPhone: assignedWorker?.phone || null,
  };
}

/**
 * Resolve the naka a caller may operate on for a given booking.
 * Super admins fall back to the booking's own naka so they can assign/reassign.
 */
function resolveBookingNaka(req, booking) {
  if (req.user.role === ROLES.SUPER_ADMIN) return booking.naka;
  return req.user.naka?._id || req.user.naka;
}

async function assertNakaScope(req, booking) {
  const nakaId = resolveBookingNaka(req, booking);
  if (!booking.naka || String(booking.naka) !== String(nakaId)) {
    throw ApiError.forbidden("This booking does not belong to your naka");
  }
}

/**
 * Customer creates a new booking. The naka is auto-assigned to the first
 * active naka in the requested city, otherwise left null for the super admin.
 */
export const createBooking = asyncHandler(async (req, res) => {
  const data = req.body;

  let nakaId = data.naka || null;
  if (!nakaId) {
    const naka = await Naka.findOne({ city: data.city, isActive: true }).sort({ createdAt: 1 });
    nakaId = naka ? naka._id : null;
  }

  let bookingId = generateBookingId();
  while (await Booking.exists({ bookingId })) {
    bookingId = generateBookingId();
  }

  const booking = await Booking.create({
    bookingId,
    customer: req.user._id,
    customerName: data.customerName,
    contactNumber: data.contactNumber,
    service: data.service,
    description: data.description,
    address: data.address,
    area: data.area || "",
    city: data.city,
    naka: nakaId,
    requiredWorkerCount: data.requiredWorkerCount,
    preferredDate: data.preferredDate || null,
    preferredTime: data.preferredTime || "",
    photoUrl: data.photoUrl || "",
    status: BOOKING_STATUS.PENDING,
    statusHistory: [
      { status: BOOKING_STATUS.PENDING, note: "Booking created", changedBy: req.user._id },
    ],
  });

  await recordAudit(req, {
    action: "booking.create",
    entityType: "Booking",
    entityId: booking._id,
    meta: { bookingId: booking.bookingId, service: booking.service },
  });

  res.status(201).json({ success: true, data: { booking } });
});

/**
 * List bookings scoped to the caller's role:
 *  - customer: only own bookings
 *  - naka_admin: only bookings for own naka
 *  - super_admin: all bookings
 */
export const listBookings = asyncHandler(async (req, res) => {
  const filter = {};
  const { status, service, city, search, naka, from, to } = req.query;

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customer = req.user._id;
  } else if (req.user.role === ROLES.NAKA_ADMIN) {
    if (!req.user.naka) throw ApiError.forbidden("No naka assigned to your account");
    filter.naka = req.user.naka._id || req.user.naka;
  } else if (req.user.role === ROLES.WORKER) {
    // Workers only ever see bookings they are assigned to.
    const workerId = req.user.worker?._id || req.user.worker;
    if (!workerId) throw ApiError.forbidden("No worker profile linked to your account");
    filter.assignedWorkers = workerId;
  } else if (req.user.role === ROLES.SUPER_ADMIN) {
    if (naka) filter.naka = naka;
  }

  if (status) {
    const statuses = String(status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (service) filter.service = service;
  if (city) filter.city = city;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      { bookingId: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { contactNumber: { $regex: search, $options: "i" } },
    ];
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("naka", "name city")
      .populate("assignedWorkers", ASSIGNED_WORKER_FIELDS),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map(serializeBooking),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("naka", "name city area")
    .populate("assignedWorkers", ASSIGNED_WORKER_FIELDS)
    .populate(NAKA_ADMIN_POPULATE);

  if (!booking) throw ApiError.notFound("Booking not found");

  const customerId = booking.customer?._id || booking.customer;
  const isOwner = String(customerId) === String(req.user._id);
  const isSuper = req.user.role === ROLES.SUPER_ADMIN;
  const isNakaAdmin =
    req.user.role === ROLES.NAKA_ADMIN &&
    booking.naka &&
    String(booking.naka._id || booking.naka) === String(req.user.naka?._id || req.user.naka);
  const workerId = req.user.worker?._id || req.user.worker;
  const isAssignedWorker =
    req.user.role === ROLES.WORKER &&
    workerId &&
    (booking.assignedWorkers || []).some((w) => String(w._id || w) === String(workerId));

  if (!isOwner && !isSuper && !isNakaAdmin && !isAssignedWorker) {
    throw ApiError.forbidden("You cannot view this booking");
  }

  res.json({ success: true, data: { booking: serializeBooking(booking) } });
});

/**
 * Customer shortcut that returns only the caller's own bookings, each enriched
 * with the assigned worker details. Mirrors GET /api/bookings for customers.
 */
export const myBookings = asyncHandler(async (req, res) => {
  const { status, service, city, search, from, to } = req.query;
  const filter = { customer: req.user._id };

  if (status) {
    const statuses = String(status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (service) filter.service = service;
  if (city) filter.city = city;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      { bookingId: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { contactNumber: { $regex: search, $options: "i" } },
    ];
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("naka", "name city")
      .populate("assignedWorkers", ASSIGNED_WORKER_FIELDS),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map(serializeBooking),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * Assign (or reassign) available workers of a booking's naka.
 * Frees workers that are removed from the assignment and prevents double
 * assignment of busy/blocked/suspended workers.
 */
export const assignWorkers = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Booking not found");

  await assertNakaScope(req, booking);
  const nakaId = resolveBookingNaka(req, booking);

  if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
    throw ApiError.badRequest("Cannot assign workers to a closed booking");
  }

  const { workerIds } = req.body;
  const uniqueIds = [...new Set(workerIds.map(String))];
  const workers = await Worker.find({ _id: { $in: uniqueIds } });

  if (workers.length !== uniqueIds.length) {
    throw ApiError.badRequest("Some workers could not be found");
  }

  for (const w of workers) {
    if (String(w.naka) !== String(nakaId)) {
      throw ApiError.forbidden("You can only assign workers from this booking's naka");
    }
    if (!w.isActive) throw ApiError.badRequest(`Worker "${w.name}" is inactive`);
    if (w.isBlocked) throw ApiError.badRequest(`Worker "${w.name}" is blocked`);
    if (w.suspendedUntil && w.suspendedUntil > new Date()) {
      throw ApiError.badRequest(`Worker "${w.name}" is temporarily suspended`);
    }
    // A worker already assigned to this same booking is fine.
    const alreadyHere = (booking.assignedWorkers || []).some((id) => String(id) === String(w._id));
    if (!w.isAvailable && !alreadyHere) {
      throw ApiError.badRequest(`Worker "${w.name}" is not available`);
    }
  }

  const previous = (booking.assignedWorkers || []).map(String);
  const next = workers.map((w) => w._id);
  const nextStr = next.map(String);

  booking.assignedWorkers = next;
  booking.assignedAt = new Date();
  booking.statusHistory.push({
    status: BOOKING_STATUS.ASSIGNED,
    note: `Assigned ${workers.length} worker(s)`,
    changedBy: req.user._id,
  });
  booking.status = BOOKING_STATUS.ASSIGNED;
  await booking.save();

  // Mark newly assigned busy, free up workers that were removed.
  const removed = previous.filter((id) => !nextStr.includes(id));
  if (removed.length) {
    await Worker.updateMany({ _id: { $in: removed } }, { isAvailable: true });
  }
  await Worker.updateMany({ _id: { $in: next } }, { isAvailable: false });

  await recordAudit(req, {
    action: "booking.assign",
    entityType: "Booking",
    entityId: booking._id,
    meta: { workerIds: nextStr },
  });

  res.json({ success: true, data: { booking } });
});

/**
 * Rank available workers for this booking by skill, availability and current
 * workload (fewest active jobs first), then by FIFO (oldest worker first).
 * Never double-assigns a worker who is already busy.
 */
export const suggestedWorkers = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Booking not found");
  await assertNakaScope(req, booking);

  const nakaId = resolveBookingNaka(req, booking);

  const candidates = await Worker.find({
    naka: nakaId,
    isActive: true,
    isBlocked: false,
    $or: [{ suspendedUntil: null }, { suspendedUntil: { $lte: new Date() } }],
  }).sort({ createdAt: 1 });

  const workloadAgg = await Booking.aggregate([
    { $match: { status: { $in: ACTIVE_WORK_STATUSES }, assignedWorkers: { $exists: true, $ne: [] } } },
    { $unwind: "$assignedWorkers" },
    { $group: { _id: "$assignedWorkers", active: { $sum: 1 } } },
  ]);
  const workload = new Map(workloadAgg.map((w) => [String(w._id), w.active]));

  const ranked = candidates
    .map((w) => {
      const matchesSkill = (w.skills || []).includes(booking.service);
      const activeJobs = workload.get(String(w._id)) || 0;
      return {
        worker: w,
        matchesSkill,
        activeJobs,
        isAvailable: w.isAvailable,
      };
    })
    .sort((a, b) => {
      // 1) skill match, 2) available now, 3) least workload, 4) FIFO (array order)
      if (a.matchesSkill !== b.matchesSkill) return a.matchesSkill ? -1 : 1;
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return a.activeJobs - b.activeJobs;
    });

  res.json({
    success: true,
    data: { items: ranked, required: booking.requiredWorkerCount, service: booking.service },
  });
});

/**
 * Record a worker's arrival (or no-show) on a booking.
 * Marking the first arrival moves an "Assigned" booking to "Accepted".
 * A no-show bumps the worker's no-show counter.
 */
export const recordArrival = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Booking not found");
  await assertNakaScope(req, booking);

  const { workerId, arrived, note } = req.body;
  const isAssigned = (booking.assignedWorkers || []).some((id) => String(id) === String(workerId));
  if (!isAssigned) throw ApiError.badRequest("Worker is not assigned to this booking");

  const worker = await Worker.findById(workerId);
  if (!worker) throw ApiError.notFound("Worker not found");

  const existing = booking.workerArrivals.find((a) => String(a.worker) === String(workerId));
  if (existing) {
    existing.arrived = arrived;
    existing.note = note || "";
    existing.recordedBy = req.user._id;
    existing.recordedAt = new Date();
  } else {
    booking.workerArrivals.push({
      worker: worker._id,
      arrived,
      note: note || "",
      recordedBy: req.user._id,
      recordedAt: new Date(),
    });
  }

  if (arrived === false) {
    worker.noShowCount = (worker.noShowCount || 0) + 1;
    worker.sanctionNote = note || "Marked as no-show";
    worker.isAvailable = true;
    await worker.save();
  }

  if (arrived === true && booking.status === BOOKING_STATUS.ASSIGNED) {
    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.acceptedAt = new Date();
    booking.statusHistory.push({
      status: BOOKING_STATUS.ACCEPTED,
      note: "Worker arrival recorded",
      changedBy: req.user._id,
    });
  }

  booking.statusHistory.push({
    status: booking.status,
    note: `${worker.name}: ${arrived ? "arrived" : "no-show"}${note ? ` - ${note}` : ""}`,
    changedBy: req.user._id,
  });

  await booking.save();

  await recordAudit(req, {
    action: arrived ? "booking.arrival" : "booking.no_show",
    entityType: "Booking",
    entityId: booking._id,
    meta: { worker: worker._id, arrived },
  });

  res.json({ success: true, data: { booking } });
});

/**
 * Update booking status with transition validation. Customers may only cancel
 * their own booking while it is still open (Pending/Assigned/Accepted/In Progress).
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("assignedWorkers", "_id");
  if (!booking) throw ApiError.notFound("Booking not found");

  const { status, note, cancelReason } = req.body;
  const isSuper = req.user.role === ROLES.SUPER_ADMIN;
  const isOwner = String(booking.customer) === String(req.user._id);
  const nakaId = req.user.naka?._id || req.user.naka;
  const isNakaAdmin =
    req.user.role === ROLES.NAKA_ADMIN &&
    booking.naka &&
    String(booking.naka) === String(nakaId);

  if (req.user.role === ROLES.CUSTOMER) {
    if (!isOwner) throw ApiError.forbidden("Not your booking");
    if (status !== BOOKING_STATUS.CANCELLED) {
      throw ApiError.forbidden("Customers can only cancel their booking");
    }
  } else if (!isSuper && !isNakaAdmin) {
    throw ApiError.forbidden("You cannot update this booking");
  }

  assertTransition(booking.status, status);

  const now = new Date();
  booking.status = status;
  booking.statusHistory.push({ status, note: note || "", changedBy: req.user._id });

  if (status === BOOKING_STATUS.ASSIGNED) booking.assignedAt = now;
  if (status === BOOKING_STATUS.ACCEPTED) booking.acceptedAt = now;
  if (status === BOOKING_STATUS.IN_PROGRESS) booking.startedAt = now;
  if (status === BOOKING_STATUS.COMPLETED) booking.completedAt = now;

  const freeingStatuses = [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED];
  if (status === BOOKING_STATUS.CANCELLED) {
    booking.cancelledBy = req.user._id;
    booking.cancelReason = cancelReason || "";
  }
  if (freeingStatuses.includes(status) && booking.assignedWorkers?.length) {
    await Worker.updateMany(
      { _id: { $in: booking.assignedWorkers.map((w) => w._id) } },
      { isAvailable: true }
    );
  }

  await booking.save();

  await recordAudit(req, {
    action: "booking.status",
    entityType: "Booking",
    entityId: booking._id,
    meta: { status },
  });

  res.json({ success: true, data: { booking } });
});
