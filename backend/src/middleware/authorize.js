import ApiError from "../utils/ApiError.js";

/**
 * Role based access control. Usage: authorize(ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN)
 */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden("You do not have permission to perform this action"));
  }
  return next();
};

export default authorize;
