import { ROLES } from "../models/User.js";

// Canonical booking lifecycle used across the platform.
export const BOOKING_STATUS = Object.freeze({
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  COMPLAINT: "Complaint",
});

export const BOOKING_STATUS_VALUES = Object.freeze(Object.values(BOOKING_STATUS));

// Allowed status transitions. Backend validates each change.
export const BOOKING_STATUS_TRANSITIONS = Object.freeze({
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.ASSIGNED,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.ASSIGNED]: [
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.IN_PROGRESS,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.ACCEPTED]: [
    BOOKING_STATUS.IN_PROGRESS,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.IN_PROGRESS]: [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.COMPLAINT,
    BOOKING_STATUS.CANCELLED,
  ],
  // A completed job may still be disputed by the customer.
  [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.COMPLAINT],
  // An open complaint is resolved by an admin moving it back to work or closing it.
  [BOOKING_STATUS.COMPLAINT]: [
    BOOKING_STATUS.IN_PROGRESS,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.CANCELLED]: [],
});

export const SERVICE_CATEGORIES = Object.freeze([
  "Plumber",
  "Electrician",
  "Painter",
  "Mason",
  "General Labour",
  "Carpenter",
  "Other",
]);

// Complaint (dispute) workflow.
export const COMPLAINT_STATUS = Object.freeze({
  OPEN: "Open",
  IN_REVIEW: "In Review",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
});

export const COMPLAINT_STATUS_VALUES = Object.freeze(Object.values(COMPLAINT_STATUS));

export const COMPLAINT_CATEGORIES = Object.freeze([
  "Worker No-Show",
  "Work Not Completed",
  "Poor Quality",
  "Worker Behaviour",
  "Payment Issue",
  "Other",
]);

export const COMPLAINT_TRANSITIONS = Object.freeze({
  [COMPLAINT_STATUS.OPEN]: [
    COMPLAINT_STATUS.IN_REVIEW,
    COMPLAINT_STATUS.ESCALATED,
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.REJECTED,
  ],
  [COMPLAINT_STATUS.IN_REVIEW]: [
    COMPLAINT_STATUS.ESCALATED,
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.REJECTED,
  ],
  [COMPLAINT_STATUS.ESCALATED]: [
    COMPLAINT_STATUS.IN_REVIEW,
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.REJECTED,
  ],
  [COMPLAINT_STATUS.RESOLVED]: [],
  [COMPLAINT_STATUS.REJECTED]: [],
});

export { ROLES };
