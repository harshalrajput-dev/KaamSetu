import { Router } from "express";
import * as users from "../controllers/user.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import { createUserValidator, updateUserValidator } from "../validators/admin.validator.js";

const router = Router();

router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get("/", users.listUsers);
router.post("/", createUserValidator, validate, users.createUser);
router.get("/:id", users.getUser);
router.patch("/:id", updateUserValidator, validate, users.updateUser);
router.patch("/:id/active", users.setUserActive);
router.post("/:id/reset-password", users.resetUserPassword);

export default router;
