import { Router } from "express";
import * as auditLogs from "../controllers/auditLog.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import { ROLES } from "../models/User.js";

const router = Router();

router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get("/", auditLogs.listAuditLogs);

export default router;
