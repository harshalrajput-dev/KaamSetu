import { Router } from "express";
import * as nakas from "../controllers/naka.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import {
  createNakaValidator,
  updateNakaValidator,
  createNakaAdminValidator,
} from "../validators/admin.validator.js";

const router = Router();

router.use(authenticate);

// Read access: super admin + naka admin (scoped in controller)
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN), nakas.listNakas);
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN), nakas.getNaka);

// Mutations: super admin only
router.post("/", authorize(ROLES.SUPER_ADMIN), createNakaValidator, validate, nakas.createNaka);
router.patch("/:id", authorize(ROLES.SUPER_ADMIN), updateNakaValidator, validate, nakas.updateNaka);
router.post(
  "/:id/admins",
  authorize(ROLES.SUPER_ADMIN),
  createNakaAdminValidator,
  validate,
  nakas.createNakaAdmin
);

export default router;
