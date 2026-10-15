import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }),
  body("phone")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("address").optional().trim().isLength({ max: 300 }),
  body("area").optional().trim().isLength({ max: 120 }),
  body("city").optional().trim().isLength({ max: 120 }),
];

export const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

export const forgotPasswordValidator = [
  body("identifier").trim().notEmpty().withMessage("Email or phone is required"),
];

export const resetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
