import { body } from "express-validator";
import { SERVICE_CATEGORIES, BOOKING_STATUS_VALUES } from "../config/constants.js";

export const createBookingValidator = [
  body("customerName").trim().notEmpty().withMessage("Customer name is required").isLength({ max: 120 }),
  body("contactNumber")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Contact number must be 10-15 digits"),
  body("service")
    .isIn(SERVICE_CATEGORIES)
    .withMessage("Invalid service category"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Problem description is required")
    .isLength({ max: 2000 }),
  body("address").trim().notEmpty().withMessage("Address is required").isLength({ max: 500 }),
  body("area").optional().trim().isLength({ max: 120 }),
  body("city").trim().notEmpty().withMessage("City is required").isLength({ max: 120 }),
  body("requiredWorkerCount")
    .isInt({ min: 1, max: 50 })
    .withMessage("Number of workers must be between 1 and 50"),
  body("preferredDate").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid date"),
  body("preferredTime").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body("naka").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid naka"),
  body("photoUrl").optional({ checkFalsy: true }).isLength({ max: 500 }),
];

export const updateStatusValidator = [
  body("status")
    .isIn(BOOKING_STATUS_VALUES)
    .withMessage("Invalid booking status"),
  body("note").optional().trim().isLength({ max: 500 }),
  body("cancelReason").optional().trim().isLength({ max: 500 }),
];

export const assignWorkersValidator = [
  body("workerIds")
    .isArray({ min: 1 })
    .withMessage("At least one worker must be selected"),
  body("workerIds.*").isMongoId().withMessage("Invalid worker id"),
];

export const recordArrivalValidator = [
  body("workerId").isMongoId().withMessage("Valid worker id is required"),
  body("arrived").isBoolean().withMessage("Arrived flag is required"),
  body("note").optional().trim().isLength({ max: 500 }),
];
