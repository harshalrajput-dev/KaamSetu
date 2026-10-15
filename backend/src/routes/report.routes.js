import { Router } from "express";
import * as reports from "../controllers/report.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import { ROLES } from "../models/User.js";

const router = Router();

router.use(authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN, ROLES.CUSTOMER));

router.get("/dashboard", reports.dashboardStats);
router.get("/bookings", authorize(ROLES.SUPER_ADMIN), reports.bookingReport);

export default router;
