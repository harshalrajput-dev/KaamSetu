import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

export function notFound(_req, _res, next) {
  next(ApiError.notFound("Route not found"));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate value";
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  const body = { success: false, message };
  if (details) body.details = details;
  if (env.nodeEnv !== "production" && statusCode >= 500) {
    body.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
  }

  res.status(statusCode).json(body);
}

export default { notFound, errorHandler };
