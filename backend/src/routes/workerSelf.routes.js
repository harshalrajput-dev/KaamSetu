import { Router } from "express";
import * as workerSelf from "../controllers/workerSelf.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { body } from "express-validator";
import { ROLES } from "../models/User.js";
import { SERVICE_CATEGORIES } from "../config/constants.js";

const router = Router();

// Every route here is for the worker's own data only.
router.use(authenticate, authorize(ROLES.WORKER));

router.get("/me", workerSelf.getMyProfile);
router.patch(
  "/me",
  [
    body("name").optional().trim().isLength({ max: 120 }),
    body("contactNumber")
      .optional()
      .trim()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("Contact number must be 10-15 digits"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("skills.*").optional().isIn(SERVICE_CATEGORIES).withMessage("Invalid skill"),
    body("isAvailable").optional().isBoolean(),
  ],
  validate,
  workerSelf.updateMyProfile
);

router.get("/stats", workerSelf.getMyStats);

router.get("/jobs", workerSelf.listMyJobs);
router.get("/jobs/:id", workerSelf.getMyJob);
router.post(
  "/jobs/:id/respond",
  [body("decision").isIn(["accept", "decline"]).withMessage("Decision must be accept or decline")],
  validate,
  workerSelf.respondToJob
);
router.post(
  "/jobs/:id/status",
  [body("status").notEmpty().withMessage("Status is required")],
  validate,
  workerSelf.updateMyJobStatus
);
router.post(
  "/jobs/:id/absence",
  [body("reason").optional().trim().isLength({ max: 500 })],
  validate,
  workerSelf.reportAbsence
);

router.get("/reviews", workerSelf.listMyReviews);

export default router;
