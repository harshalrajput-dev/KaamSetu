import { body } from "express-validator";
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUS_VALUES } from "../config/constants.js";

export const createComplaintValidator = [
  body("booking").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid booking"),
  body("subject").trim().notEmpty().withMessage("Subject is required").isLength({ max: 160 }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 }),
  body("category").optional().isIn(COMPLAINT_CATEGORIES).withMessage("Invalid category"),
];

export const updateComplaintValidator = [
  body("status").optional().isIn(COMPLAINT_STATUS_VALUES).withMessage("Invalid complaint status"),
  body("resolutionNote").optional().trim().isLength({ max: 1000 }),
  body("assignedTo").optional({ checkFalsy: true }).isMongoId().withMessage("Invalid admin id"),
];

export const escalateComplaintValidator = [
  body("note").optional().trim().isLength({ max: 500 }),
];

export default {
  createComplaintValidator,
  updateComplaintValidator,
  escalateComplaintValidator,
};
