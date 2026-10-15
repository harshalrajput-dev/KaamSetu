import { body } from "express-validator";
import { ROLE_VALUES } from "../models/User.js";

export const createNakaValidator = [
  body("name").trim().notEmpty().withMessage("Naka name is required").isLength({ max: 120 }),
  body("city").trim().notEmpty().withMessage("City is required").isLength({ max: 120 }),
  body("address").optional().trim().isLength({ max: 300 }),
  body("area").optional().trim().isLength({ max: 120 }),
  body("contactNumber").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("isActive").optional().isBoolean(),
];

export const updateNakaValidator = [
  body("name").optional().trim().isLength({ max: 120 }),
  body("city").optional().trim().isLength({ max: 120 }),
  body("address").optional().trim().isLength({ max: 300 }),
  body("area").optional().trim().isLength({ max: 120 }),
  body("contactNumber").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("isActive").optional().isBoolean(),
];

export const createNakaAdminValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }),
  body("phone")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  // The naka id is authoritative in the URL (:id/admins); body is an optional fallback.
  body("naka").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid naka"),
];

export const createUserValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }),
  body("phone")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage("Invalid role"),
];

export const updateUserValidator = [
  body("name").optional().trim().isLength({ max: 120 }),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("isActive").optional().isBoolean(),
  body("naka").optional({ nullable: true, checkFalsy: true }).isMongoId(),
];
