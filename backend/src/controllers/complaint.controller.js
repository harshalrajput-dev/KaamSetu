import Complaint from "../models/Complaint.js";
import Booking from "../models/Booking.js";
import { ROLES } from "../models/User.js";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_TRANSITIONS,
  COMPLAINT_STATUS,
  COMPLAINT_TRANSITIONS,
} from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";
import { recordAudit } from "../utils/audit.js";

function assertComplaintTransition(from, to) {
  const allowed = COMPLAINT_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw ApiError.badRequest(`Cannot change complaint status from "${from}" to "${to}"`);
  }
}

/**
 * Customer raises a complaint, optionally linked to one of their bookings.
 * When the linked booking can move to the "Complaint" status it is flagged.
 */
export const createComplaint = asyncHandler(async (req, res) => {
  const { booking: bookingId, subject, description, category } = req.body;

  let booking = null;
  let nakaId = null;

  if (bookingId) {
    booking = await Booking.findById(bookingId);
    if (!booking) throw ApiError.notFound("Booking not found");
    if (String(booking.customer) !== String(req.user._id)) {
      throw ApiError.forbidden("You can only complain about your own booking");
    }
    nakaId = booking.naka || null;
  }

  const complaint = await Complaint.create({
    booking: booking ? booking._id : null,
    customer: req.user._id,
    naka: nakaId,
    subject,
    description,
    category: category || "Other",
    status: COMPLAINT_STATUS.OPEN,
    history: [{ status: COMPLAINT_STATUS.OPEN, note: "Complaint submitted", by: req.user._id }],
  });

  // Flag the booking when the workflow permits it.
  if (booking) {
    const allowed = BOOKING_STATUS_TRANSITIONS[booking.status] || [];
    if (allowed.includes(BOOKING_STATUS.COMPLAINT)) {
      booking.status = BOOKING_STATUS.COMPLAINT;
      booking.statusHistory.push({
        status: BOOKING_STATUS.COMPLAINT,
        note: `Complaint raised: ${subject}`,
        changedBy: req.user._id,
      });
      await booking.save();
    }
  }

  await recordAudit(req, {
    action: "complaint.create",
    entityType: "Complaint",
    entityId: complaint._id,
    meta: { booking: booking ? booking._id : null, category: complaint.category },
  });

  res.status(201).json({ success: true, data: { complaint } });
});

/**
 * List complaints scoped by role:
 *  - customer: own complaints
 *  - naka_admin: complaints for their naka
 *  - super_admin: all complaints (filter by status/naka)
 */
export const listComplaints = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === ROLES.WORKER) {
    // Complaints are not a worker-facing feature.
    throw ApiError.forbidden("You cannot view complaints");
  }

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customer = req.user._id;
  } else if (req.user.role === ROLES.NAKA_ADMIN) {
    if (!req.user.naka) throw ApiError.forbidden("No naka assigned to your account");
    filter.naka = req.user.naka._id || req.user.naka;
  } else if (req.user.role === ROLES.SUPER_ADMIN && req.query.naka) {
    filter.naka = req.query.naka;
  }

  if (req.query.status) {
    const statuses = String(req.query.status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    filter.$or = [
      { subject: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name phone city")
      .populate("naka", "name city")
      .populate("booking", "bookingId service status")
      .populate("assignedTo", "name role"),
    Complaint.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

function assertCanView(complaint, user) {
  if (user.role === ROLES.SUPER_ADMIN) return;
  if (user.role === ROLES.CUSTOMER && String(complaint.customer?._id || complaint.customer) === String(user._id)) {
    return;
  }
  if (user.role === ROLES.NAKA_ADMIN) {
    const nakaId = user.naka?._id || user.naka;
    if (complaint.naka && String(complaint.naka._id || complaint.naka) === String(nakaId)) return;
  }
  throw ApiError.forbidden("You cannot view this complaint");
}

export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("customer", "name phone city")
    .populate("naka", "name city")
    .populate("booking", "bookingId service status")
    .populate("assignedTo", "name role")
    .populate("escalatedTo", "name role");
  if (!complaint) throw ApiError.notFound("Complaint not found");
  assertCanView(complaint, req.user);
  res.json({ success: true, data: { complaint } });
});

/**
 * Admin updates a complaint: change status, set resolution, assign handler.
 * Naka admins are limited to their own naka and cannot resolve an escalated
 * complaint (only the super admin handles escalations).
 */
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound("Complaint not found");

  if (req.user.role === ROLES.NAKA_ADMIN) {
    const nakaId = req.user.naka?._id || req.user.naka;
    if (!complaint.naka || String(complaint.naka) !== String(nakaId)) {
      throw ApiError.forbidden("This complaint does not belong to your naka");
    }
    if (complaint.status === COMPLAINT_STATUS.ESCALATED) {
      throw ApiError.forbidden("Escalated complaints are handled by the super admin");
    }
  }

  const { status, resolutionNote, assignedTo } = req.body;

  if (assignedTo !== undefined) {
    complaint.assignedTo = assignedTo || null;
  }

  if (resolutionNote !== undefined) {
    complaint.resolutionNote = resolutionNote || "";
  }

  if (status !== undefined && status !== complaint.status) {
    assertComplaintTransition(complaint.status, status);
    complaint.status = status;
    complaint.history.push({
      status,
      note: resolutionNote || req.body.note || "",
      by: req.user._id,
    });

    // Close the linked booking's complaint flag when resolved/rejected.
    if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED].includes(status) && complaint.booking) {
      const booking = await Booking.findById(complaint.booking);
      if (booking && booking.status === BOOKING_STATUS.COMPLAINT) {
        booking.status = BOOKING_STATUS.COMPLETED;
        booking.statusHistory.push({
          status: BOOKING_STATUS.COMPLETED,
          note: `Complaint ${status.toLowerCase()}`,
          changedBy: req.user._id,
        });
        await booking.save();
      }
    }
  }

  await complaint.save();

  await recordAudit(req, {
    action: "complaint.update",
    entityType: "Complaint",
    entityId: complaint._id,
    meta: { status: complaint.status },
  });

  res.json({ success: true, data: { complaint } });
});

/**
 * Naka admin (or super admin) escalates a complaint to the super admin.
 */
export const escalateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound("Complaint not found");

  if (req.user.role === ROLES.NAKA_ADMIN) {
    const nakaId = req.user.naka?._id || req.user.naka;
    if (!complaint.naka || String(complaint.naka) !== String(nakaId)) {
      throw ApiError.forbidden("This complaint does not belong to your naka");
    }
  }

  complaint.status = COMPLAINT_STATUS.ESCALATED;
  complaint.escalatedTo = req.user._id;
  complaint.history.push({
    status: COMPLAINT_STATUS.ESCALATED,
    note: req.body.note || "Escalated to super admin",
    by: req.user._id,
  });
  await complaint.save();

  await recordAudit(req, {
    action: "complaint.escalate",
    entityType: "Complaint",
    entityId: complaint._id,
    meta: {},
  });

  res.json({ success: true, data: { complaint } });
});
