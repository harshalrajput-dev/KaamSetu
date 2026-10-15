import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import { ROLES } from "../models/User.js";
import { BOOKING_STATUS } from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../services/booking.service.js";
import { recordAudit } from "../utils/audit.js";

/**
 * Customer submits a review for one of their own completed bookings.
 * One review per booking is enforced by a unique index as well.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { booking: bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (String(booking.customer) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only review your own booking");
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest("You can only review a completed booking");
  }

  const existing = await Review.findOne({ booking: booking._id });
  if (existing) throw ApiError.conflict("This booking already has a review");

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    naka: booking.naka || null,
    workers: booking.assignedWorkers || [],
    rating,
    comment: comment || "",
  });

  await recordAudit(req, {
    action: "review.create",
    entityType: "Review",
    entityId: review._id,
    meta: { booking: booking._id, rating },
  });

  res.status(201).json({ success: true, data: { review } });
});

/**
 * List reviews scoped by role:
 *  - customer: own reviews
 *  - naka_admin: reviews for their naka
 *  - super_admin: all reviews
 */
export const listReviews = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customer = req.user._id;
  } else if (req.user.role === ROLES.NAKA_ADMIN) {
    if (!req.user.naka) throw ApiError.forbidden("No naka assigned to your account");
    filter.naka = req.user.naka._id || req.user.naka;
  } else if (req.user.role === ROLES.WORKER) {
    const workerId = req.user.worker?._id || req.user.worker;
    if (!workerId) throw ApiError.forbidden("No worker profile linked to your account");
    filter.workers = workerId;
  } else if (req.user.role === ROLES.SUPER_ADMIN) {
    if (req.query.naka) filter.naka = req.query.naka;
  }

  if (req.query.worker) filter.workers = req.query.worker;
  if (req.query.rating) filter.rating = Number(req.query.rating);
  if (req.query.isVisible === "true") filter.isVisible = true;
  if (req.query.isVisible === "false") filter.isVisible = false;

  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name city")
      .populate("naka", "name city")
      .populate("booking", "bookingId service"),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * Public-ish rating summary for a naka (used on the booking/worker views).
 */
export const reviewSummary = asyncHandler(async (req, res) => {
  const match = {};
  if (req.user.role === ROLES.NAKA_ADMIN) {
    match.naka = req.user.naka?._id || req.user.naka;
  } else if (req.user.role === ROLES.WORKER) {
    const workerId = req.user.worker?._id || req.user.worker;
    if (!workerId) throw ApiError.forbidden("No worker profile linked to your account");
    match.workers = workerId;
  } else if (req.query.naka) {
    match.naka = req.query.naka;
  }
  if (req.query.worker && req.user.role !== ROLES.WORKER) match.workers = req.query.worker;

  const agg = await Review.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        average: { $avg: "$rating" },
      },
    },
  ]);

  const summary = agg[0] || { count: 0, average: 0 };
  res.json({
    success: true,
    data: { count: summary.count, average: summary.average ? Number(summary.average.toFixed(2)) : 0 },
  });
});

/**
 * Toggle review visibility. Naka admins can only touch their own naka's
 * reviews; the super admin can touch all.
 */
export const setReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  if (req.user.role === ROLES.NAKA_ADMIN) {
    const nakaId = req.user.naka?._id || req.user.naka;
    if (!review.naka || String(review.naka) !== String(nakaId)) {
      throw ApiError.forbidden("This review does not belong to your naka");
    }
  }

  review.isVisible = Boolean(req.body.isVisible);
  await review.save();

  await recordAudit(req, {
    action: "review.visibility",
    entityType: "Review",
    entityId: review._id,
    meta: { isVisible: review.isVisible },
  });

  res.json({ success: true, data: { review } });
});

/**
 * The review (if any) for a given booking, visible to anyone who can view it.
 */
export const getBookingReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ booking: req.params.bookingId })
    .populate("customer", "name city")
    .populate("workers", "name");
  res.json({ success: true, data: { review: review || null } });
});
