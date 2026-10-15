import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * Runs after express-validator chains. Collects errors into one response.
 */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(ApiError.badRequest("Validation failed", details));
}

export default validate;
