import { Router } from "express";
import * as services from "../controllers/service.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { body } from "express-validator";
import { ROLES } from "../models/User.js";
import { SERVICE_CATEGORIES } from "../config/constants.js";

const router = Router();

router.get("/", services.listPublicServices);

router.get("/admin/all", authenticate, authorize(ROLES.SUPER_ADMIN), services.listServices);

router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  [body("name").isIn(SERVICE_CATEGORIES).withMessage("Invalid service name")],
  validate,
  services.createService
);

router.patch("/:id", authenticate, authorize(ROLES.SUPER_ADMIN), services.updateService);

export default router;
