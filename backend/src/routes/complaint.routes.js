import { Router } from "express";
import * as complaints from "../controllers/complaint.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import {
  createComplaintValidator,
  updateComplaintValidator,
  escalateComplaintValidator,
} from "../validators/complaint.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", complaints.listComplaints);
router.get("/:id", complaints.getComplaint);

router.post(
  "/",
  authorize(ROLES.CUSTOMER),
  createComplaintValidator,
  validate,
  complaints.createComplaint
);

router.patch(
  "/:id",
  authorize(ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  updateComplaintValidator,
  validate,
  complaints.updateComplaint
);

router.post(
  "/:id/escalate",
  authorize(ROLES.NAKA_ADMIN, ROLES.SUPER_ADMIN),
  escalateComplaintValidator,
  validate,
  complaints.escalateComplaint
);

export default router;
