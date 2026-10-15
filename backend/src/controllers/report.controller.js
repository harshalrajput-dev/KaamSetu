import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import Naka from "../models/Naka.js";
import Complaint from "../models/Complaint.js";
import Review from "../models/Review.js";
import User, { ROLES } from "../models/User.js";
import { BOOKING_STATUS, COMPLAINT_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Real platform statistics (no fake numbers). Super admin sees global counts,
 * naka admin sees their own naka only.
 */
export const dashboardStats = asyncHandler(async (req, res) => {
  const bookingFilter = {};
  const workerFilter = {};

  if (req.user.role === ROLES.NAKA_ADMIN) {
    const nakaId = req.user.naka?._id || req.user.naka;
    bookingFilter.naka = nakaId;
    workerFilter.naka = nakaId;
  } else if (req.user.role === ROLES.CUSTOMER) {
    bookingFilter.customer = req.user._id;
  }

  const [
    totalBookings,
    pending,
    assigned,
    accepted,
    started,
    completed,
    cancelled,
    complaints,
    totalWorkers,
    availableWorkers,
  ] = await Promise.all([
    Booking.countDocuments(bookingFilter),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.PENDING }),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.ASSIGNED }),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.ACCEPTED }),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.IN_PROGRESS }),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.CANCELLED }),
    Booking.countDocuments({ ...bookingFilter, status: BOOKING_STATUS.COMPLAINT }),
    Worker.countDocuments(workerFilter),
    Worker.countDocuments({ ...workerFilter, isAvailable: true, isActive: true }),
  ]);

  const data = {
    bookings: { total: totalBookings, pending, assigned, accepted, started, completed, cancelled, complaints },
    workers: { total: totalWorkers, available: availableWorkers },
  };

  // Open complaint count scoped the same way.
  const complaintFilter = {};
  if (req.user.role === ROLES.NAKA_ADMIN) complaintFilter.naka = req.user.naka?._id || req.user.naka;
  if (req.user.role === ROLES.CUSTOMER) complaintFilter.customer = req.user._id;
  data.complaints = {
    open: await Complaint.countDocuments({
      ...complaintFilter,
      status: { $in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_REVIEW, COMPLAINT_STATUS.ESCALATED] },
    }),
    total: await Complaint.countDocuments(complaintFilter),
  };

  // Rating summary scoped to the naka (or global for super admin).
  const reviewMatch = {};
  if (req.user.role === ROLES.NAKA_ADMIN) reviewMatch.naka = req.user.naka?._id || req.user.naka;
  const ratingAgg = await Review.aggregate([
    { $match: reviewMatch },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
  ]);
  const rating = ratingAgg[0] || { count: 0, average: 0 };
  data.reviews = {
    count: rating.count,
    average: rating.average ? Number(rating.average.toFixed(2)) : 0,
  };

  // Customers do not need platform-wide worker counts.
  if (req.user.role === ROLES.CUSTOMER) {
    delete data.workers;
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    const [totalNakas, activeNakas, totalCustomers, totalAdmins] = await Promise.all([
      Naka.countDocuments(),
      Naka.countDocuments({ isActive: true }),
      User.countDocuments({ role: ROLES.CUSTOMER }),
      User.countDocuments({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN] } }),
    ]);
    data.nakas = { total: totalNakas, active: activeNakas };
    data.users = { customers: totalCustomers, admins: totalAdmins };
  }

  res.json({ success: true, data });
});

/**
 * Super admin global report grouped by status / service / city.
 */
export const bookingReport = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
  }

  const [byStatus, byService, byCity] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: { byStatus, byService, byCity },
  });
});
