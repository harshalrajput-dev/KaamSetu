import { Router } from "express";
import * as reviews from "../controllers/review.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import {
  createReviewValidator,
  reviewVisibilityValidator,
} from "../validators/review.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", reviews.listReviews);
router.get("/summary", reviews.reviewSummary);
router.get("/booking/:bookingId", reviews.getBookingReview);

router.post(
  "/",
  authorize(ROLES.CUSTOMER),
  createReviewValidator,
  validate,
  reviews.createReview
);

router.patch(
  "/:id/visibility",
  authorize(ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  reviewVisibilityValidator,
  validate,
  reviews.setReviewVisibility
);

export default router;
