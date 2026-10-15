export function formatDate(value, locale = "gu-IN") {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
}

export function formatDateTime(value, locale = "gu-IN") {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

/**
 * Builds a full URL for an uploaded file path returned by the backend.
 */
export function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || "";
  return `${base}${path}`;
}

export default { formatDate, formatDateTime, assetUrl };
