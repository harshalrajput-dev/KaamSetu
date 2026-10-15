import { Router } from "express";
import * as bookings from "../controllers/booking.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import {
  createBookingValidator,
  updateStatusValidator,
  assignWorkersValidator,
  recordArrivalValidator,
} from "../validators/booking.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize(ROLES.CUSTOMER), createBookingValidator, validate, bookings.createBooking);
router.get("/", bookings.listBookings);
router.get("/my-bookings", authorize(ROLES.CUSTOMER), bookings.myBookings);
router.get("/:id", bookings.getBooking);

router.post(
  "/:id/assign-workers",
  authorize(ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  assignWorkersValidator,
  validate,
  bookings.assignWorkers
);

router.get(
  "/:id/suggested-workers",
  authorize(ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  bookings.suggestedWorkers
);

router.post(
  "/:id/arrivals",
  authorize(ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  recordArrivalValidator,
  validate,
  bookings.recordArrival
);

router.patch(
  "/:id/status",
  authorize(ROLES.CUSTOMER, ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  updateStatusValidator,
  validate,
  bookings.updateStatus
);

export default router;
