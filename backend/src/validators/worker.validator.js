import { body } from "express-validator";
import { SERVICE_CATEGORIES } from "../config/constants.js";

export const createWorkerValidator = [
  body("name").trim().notEmpty().withMessage("Worker name is required").isLength({ max: 120 }),
  body("contactNumber")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("skills.*").optional().isIn(SERVICE_CATEGORIES).withMessage("Invalid skill"),
  body("naka").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid naka"),
  body("isAvailable").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
  // Optional app login for the worker.
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const workerAccountValidator = [
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const updateWorkerValidator = [
  body("name").optional().trim().isLength({ max: 120 }),
  body("contactNumber")
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("skills").optional().isArray(),
  body("skills.*").optional().isIn(SERVICE_CATEGORIES),
  body("isAvailable").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
];

export const attendanceValidator = [
  body("date").optional({ checkFalsy: true }).isISO8601(),
  body("present").isBoolean().withMessage("Present flag is required"),
  body("note").optional().trim().isLength({ max: 300 }),
];

export const sanctionValidator = [
  body("action")
    .isIn(["warn", "suspend", "block", "unblock", "reinstate"])
    .withMessage("Invalid sanction action"),
  body("days").optional().isInt({ min: 1, max: 365 }).withMessage("Days must be 1-365"),
  body("note").optional().trim().isLength({ max: 500 }),
];
