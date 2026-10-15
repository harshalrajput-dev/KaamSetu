export const NAKA_ADMIN_POPULATE = {
  path: "customer",
  select: "name phone email city",
};

/**
 * Normalises ?page & ?limit query params into safe pagination values.
 */
export function paginate(query = {}, defaultLimit = 10, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export default { NAKA_ADMIN_POPULATE, paginate };
