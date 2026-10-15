import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import Review from "../models/Review.js";
import { BOOKING_STATUS, BOOKING_STATUS_TRANSITIONS } from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";
import { recordAudit } from "../utils/audit.js";

const OPEN_STATUSES = [
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.IN_PROGRESS,
];

// Status targets a worker is allowed to set on their own job.
const WORKER_ALLOWED_TARGETS = [
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.IN_PROGRESS,
  BOOKING_STATUS.COMPLETED,
];

function linkedWorkerId(req) {
  const id = req.user.worker?._id || req.user.worker;
  if (!id) throw ApiError.forbidden("No worker profile is linked to this account");
  return id;
}

async function loadWorker(req) {
  const worker = await Worker.findById(linkedWorkerId(req)).populate("naka", "name city area");
  if (!worker) throw ApiError.forbidden("Worker profile not found");
  return worker;
}

function isAssigned(booking, workerId) {
  return (booking.assignedWorkers || []).some((w) => String(w._id || w) === String(workerId));
}

/**
 * Remove a worker from a booking and free them up. If no workers remain and the
 * booking is still open, it goes back to Pending so the naka can reassign it.
 */
async function releaseWorker(req, booking, worker, note, action) {
  booking.assignedWorkers = (booking.assignedWorkers || []).filter(
    (id) => String(id._id || id) !== String(worker._id)
  );
  const remaining = booking.assignedWorkers.length;

  if (remaining === 0 && OPEN_STATUSES.includes(booking.status)) {
    booking.status = BOOKING_STATUS.PENDING;
  }

  booking.statusHistory.push({
    status: booking.status,
    note: note || `${worker.name} is no longer available`,
    changedBy: req.user._id,
  });
  await booking.save();

  worker.isAvailable = true;
  await worker.save();

  await recordAudit(req, {
    action,
    entityType: "Booking",
    entityId: booking._id,
    meta: { worker: worker._id, remainingWorkers: remaining },
  });

  return booking;
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  res.json({ success: true, data: { worker } });
});

/**
 * Workers may edit their own name, contact number, skills and availability.
 * Naka, sanctions and activation status are controlled by admins only.
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const allowed = ["name", "contactNumber", "skills", "isAvailable"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) worker[key] = req.body[key];
  }
  await worker.save();
  res.json({ success: true, data: { worker } });
});

export const getMyStats = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);

  const [completedJobs, activeJobs, ratingAgg] = await Promise.all([
    Booking.countDocuments({ assignedWorkers: worker._id, status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ assignedWorkers: worker._id, status: { $in: OPEN_STATUSES } }),
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
      isAvailable: worker.isAvailable,
      isBlocked: worker.isBlocked,
      suspendedUntil: worker.suspendedUntil,
      rating: { count: rating.count, average: rating.average ? Number(rating.average.toFixed(2)) : 0 },
    },
  });
});

export const listMyJobs = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const filter = { assignedWorkers: worker._id };

  if (req.query.status) {
    const statuses = String(req.query.status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length) filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("naka", "name city area"),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

export const getMyJob = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const booking = await Booking.findById(req.params.id)
    .populate("naka", "name city area")
    .populate("assignedWorkers", "name contactNumber skills");

  if (!booking) throw ApiError.notFound("Job not found");
  if (!isAssigned(booking, worker._id)) {
    throw ApiError.forbidden("This job is not assigned to you");
  }

  res.json({ success: true, data: { booking } });
});

/**
 * Accept or decline an assigned job.
 */
export const respondToJob = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const { decision, note } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Job not found");
  if (!isAssigned(booking, worker._id)) {
    throw ApiError.forbidden("This job is not assigned to you");
  }
  if (![BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED].includes(booking.status)) {
    throw ApiError.badRequest("This job can no longer be accepted or declined");
  }

  if (decision === "accept") {
    if (booking.status === BOOKING_STATUS.ASSIGNED) {
      booking.status = BOOKING_STATUS.ACCEPTED;
      booking.acceptedAt = new Date();
      booking.statusHistory.push({
        status: BOOKING_STATUS.ACCEPTED,
        note: note || "Worker accepted the job",
        changedBy: req.user._id,
      });
      await booking.save();
    }
    await recordAudit(req, {
      action: "booking.worker_accept",
      entityType: "Booking",
      entityId: booking._id,
      meta: { worker: worker._id },
    });
    return res.json({ success: true, data: { booking } });
  }

  const updated = await releaseWorker(
    req,
    booking,
    worker,
    note || "Worker declined the job",
    "booking.worker_decline"
  );
  return res.json({ success: true, data: { booking: updated } });
});

/**
 * Report inability to attend an open job, with a reason.
 */
export const reportAbsence = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Job not found");
  if (!isAssigned(booking, worker._id)) {
    throw ApiError.forbidden("This job is not assigned to you");
  }
  if (!OPEN_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest("This job is already closed");
  }

  const updated = await releaseWorker(
    req,
    booking,
    worker,
    reason || "Worker reported inability to attend",
    "booking.worker_absence"
  );
  res.json({ success: true, data: { booking: updated } });
});

/**
 * Update the status of a job assigned to the worker.
 * Workers may only move Assigned -> Accepted, Accepted -> In Progress,
 * In Progress -> Completed.
 */
export const updateMyJobStatus = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const { status, note } = req.body;

  if (!WORKER_ALLOWED_TARGETS.includes(status)) {
    throw ApiError.badRequest("Workers can only set Accepted, In Progress or Completed");
  }

  const booking = await Booking.findById(req.params.id).populate("assignedWorkers", "_id");
  if (!booking) throw ApiError.notFound("Job not found");
  if (!isAssigned(booking, worker._id)) {
    throw ApiError.forbidden("This job is not assigned to you");
  }

  const allowed = BOOKING_STATUS_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot change status from "${booking.status}" to "${status}"`);
  }

  const now = new Date();
  booking.status = status;
  if (status === BOOKING_STATUS.ACCEPTED) booking.acceptedAt = now;
  if (status === BOOKING_STATUS.IN_PROGRESS) booking.startedAt = now;
  if (status === BOOKING_STATUS.COMPLETED) booking.completedAt = now;
  booking.statusHistory.push({ status, note: note || "", changedBy: req.user._id });
  await booking.save();

  if (status === BOOKING_STATUS.COMPLETED && booking.assignedWorkers?.length) {
    await Worker.updateMany(
      { _id: { $in: booking.assignedWorkers.map((w) => w._id) } },
      { isAvailable: true }
    );
  }

  await recordAudit(req, {
    action: "booking.worker_status",
    entityType: "Booking",
    entityId: booking._id,
    meta: { status, worker: worker._id },
  });

  res.json({ success: true, data: { booking } });
});

export const listMyReviews = asyncHandler(async (req, res) => {
  const worker = await loadWorker(req);
  const filter = { workers: worker._id };
  const { page, limit, skip } = paginate(req.query);

  const [items, total, agg] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name"),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
    ]),
  ]);

  const rating = agg[0] || { count: 0, average: 0 };

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      rating: { count: rating.count, average: rating.average ? Number(rating.average.toFixed(2)) : 0 },
    },
  });
});

export default {
  getMyProfile,
  updateMyProfile,
  getMyStats,
  listMyJobs,
  getMyJob,
  respondToJob,
  reportAbsence,
  updateMyJobStatus,
  listMyReviews,
};
