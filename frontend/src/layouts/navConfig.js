/**
 * Sidebar navigation per role. `to` values are relative to the role's base path.
 */
export const DASHBOARD_BASE = {
  super_admin: "/admin",
  naka_admin: "/naka",
  worker: "/worker",
  customer: "/dashboard",
};

export const DASHBOARD_NAV = {
  worker: [
    { to: "", icon: "speedometer2", key: "nav.dashboard", end: true },
    { to: "jobs", icon: "list-check", key: "nav.myJobs" },
    { to: "reviews", icon: "star", key: "nav.reviews" },
    { to: "profile", icon: "person", key: "nav.myProfile" },
    { to: "change-password", icon: "key", key: "nav.changePassword" },
  ],
  customer: [
    { to: "", icon: "speedometer2", key: "nav.dashboard", end: true },
    { to: "bookings/new", icon: "plus-circle", key: "nav.createBooking" },
    { to: "bookings", icon: "list-check", key: "nav.myBookings" },
    { to: "complaints", icon: "exclamation-circle", key: "nav.myComplaints" },
    { to: "profile", icon: "person", key: "nav.myProfile" },
    { to: "change-password", icon: "key", key: "nav.changePassword" },
  ],
  naka_admin: [
    { to: "", icon: "speedometer2", key: "nav.dashboard", end: true },
    { to: "bookings/new", icon: "bell", key: "nav.newBookings" },
    { to: "bookings/assigned", icon: "clipboard-check", key: "nav.assignedBookings" },
    { to: "workers", icon: "people", key: "nav.workers" },
    { to: "complaints", icon: "exclamation-circle", key: "nav.complaints" },
    { to: "reviews", icon: "star", key: "nav.reviews" },
    { to: "bookings/history", icon: "clock-history", key: "nav.bookingHistory" },
    { to: "profile", icon: "person", key: "nav.myProfile" },
    { to: "change-password", icon: "key", key: "nav.changePassword" },
  ],
  super_admin: [
    { to: "", icon: "speedometer2", key: "nav.dashboard", end: true },
    { to: "nakas", icon: "geo-alt", key: "nav.nakas" },
    { to: "naka-admins", icon: "person-badge", key: "nav.nakaAdmins" },
    { to: "workers", icon: "people", key: "nav.workers" },
    { to: "customers", icon: "person-lines-fill", key: "nav.customers" },
    { to: "bookings", icon: "journal-check", key: "nav.bookings" },
    { to: "complaints", icon: "exclamation-circle", key: "nav.complaints" },
    { to: "reviews", icon: "star", key: "nav.reviews" },
    { to: "services", icon: "grid", key: "nav.manageServices" },
    { to: "reports", icon: "bar-chart", key: "nav.reports" },
    { to: "audit-logs", icon: "shield-check", key: "nav.auditLogs" },
    { to: "profile", icon: "person", key: "nav.myProfile" },
    { to: "change-password", icon: "key", key: "nav.changePassword" },
  ],
};

export default DASHBOARD_NAV;
