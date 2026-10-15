import { body } from "express-validator";

export const createReviewValidator = [
  body("booking").isMongoId().withMessage("Valid booking is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }),
];

export const reviewVisibilityValidator = [
  body("isVisible").isBoolean().withMessage("isVisible must be a boolean"),
];

export default { createReviewValidator, reviewVisibilityValidator };
