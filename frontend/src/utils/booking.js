/**
 * Booking helpers shared by the customer views.
 *
 * The backend may send the assigned worker in several shapes (populated
 * `assignedWorker` / `worker` objects, an `assignedWorkers` array, nested user
 * objects, or flat `workerName` / `workerPhone` strings). These helpers
 * normalise all of them into a single, predictable worker object so the UI
 * never silently drops the assigned worker.
 */

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function normalizeWorker(raw) {
  if (!raw) return null;

  // A bare string could be a worker name or (more likely) an unpopulated id.
  if (typeof raw === "string") {
    const value = raw.trim();
    if (!value || OBJECT_ID_RE.test(value)) return null;
    return { name: value, phone: "", skills: [], photo: "" };
  }

  if (typeof raw !== "object") return null;

  // Some payloads nest the login/user record one level deeper.
  const nested = raw.user || raw.loginUser || raw.workerUser || raw.account || {};

  const name = firstDefined(
    raw.name,
    raw.workerName,
    raw.fullName,
    raw.displayName,
    nested.name
  );
  const phone = firstDefined(
    raw.phone,
    raw.contactNumber,
    raw.phoneNumber,
    raw.mobile,
    raw.workerPhone,
    nested.phone,
    nested.contactNumber
  );
  const skills = firstDefined(raw.skills, raw.service, nested.skills);
  const photo = firstDefined(
    raw.photo,
    raw.photoUrl,
    raw.avatar,
    raw.image,
    nested.photo,
    nested.photoUrl
  );

  if (!name && !phone) return null;

  return {
    name: name || "",
    phone: phone || "",
    skills: Array.isArray(skills) ? skills.filter(Boolean) : [skills].filter(Boolean),
    photo: photo || "",
  };
}

/**
 * Returns the normalised assigned worker for a booking, or null when none can
 * be found. Tolerates every field variation the backend/API might return.
 */
export function getAssignedWorker(booking) {
  if (!booking) return null;

  const sources = [
    booking.assignedWorker,
    booking.worker,
    booking.assignedWorkerDetails,
    booking.workerDetails,
    booking.assignedWorkers,
    booking.workers,
  ];

  for (const source of sources) {
    for (const candidate of toArray(source)) {
      const worker = normalizeWorker(candidate);
      if (worker) return worker;
    }
  }

  // Flat properties carried directly on the booking.
  return normalizeWorker({
    name: firstDefined(booking.workerName, booking.assignedWorkerName),
    phone: firstDefined(booking.workerPhone, booking.assignedWorkerPhone),
    skills: booking.workerSkills || booking.assignedWorkerSkills,
    photo: booking.workerPhoto || booking.assignedWorkerPhoto,
  });
}

/**
 * True when the booking is assigned or already carries worker details.
 */
export function hasAssignedWorker(booking) {
  if (!booking) return false;
  return Boolean(getAssignedWorker(booking)) || booking.status === "Assigned";
}

export default { getAssignedWorker, hasAssignedWorker };
