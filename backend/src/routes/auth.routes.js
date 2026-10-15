import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { body } from "express-validator";
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, registerValidator, validate, auth.register);
router.post("/login", authLimiter, loginValidator, validate, auth.login);
router.get("/me", authenticate, auth.me);
router.patch(
  "/me",
  authenticate,
  [
    body("name").optional().trim().isLength({ max: 120 }),
    body("phone")
      .optional()
      .trim()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("Contact number must be 10-15 digits"),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
    body("address").optional().trim().isLength({ max: 300 }),
    body("area").optional().trim().isLength({ max: 120 }),
    body("city").optional().trim().isLength({ max: 120 }),
  ],
  validate,
  auth.updateProfile
);
router.post("/change-password", authenticate, changePasswordValidator, validate, auth.changePassword);
router.post("/forgot-password", authLimiter, forgotPasswordValidator, validate, auth.forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, auth.resetPassword);

export default router;
