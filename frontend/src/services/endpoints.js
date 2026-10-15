import api from "./api.js";

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  me: () => api.get("/api/auth/me"),
  updateProfile: (payload) => api.patch("/api/auth/me", payload),
  changePassword: (payload) => api.post("/api/auth/change-password", payload),
  forgotPassword: (payload) => api.post("/api/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/api/auth/reset-password", payload),
};

export const bookingApi = {
  create: (payload) => api.post("/api/bookings", payload),
  list: (params) => api.get("/api/bookings", { params }),
  get: (id) => api.get(`/api/bookings/${id}`),
  assignWorkers: (id, workerIds) => api.post(`/api/bookings/${id}/assign-workers`, { workerIds }),
  suggestedWorkers: (id) => api.get(`/api/bookings/${id}/suggested-workers`),
  recordArrival: (id, payload) => api.post(`/api/bookings/${id}/arrivals`, payload),
  updateStatus: (id, payload) => api.patch(`/api/bookings/${id}/status`, payload),
};

export const workerApi = {
  list: (params) => api.get("/api/workers", { params }),
  get: (id) => api.get(`/api/workers/${id}`),
  stats: (id) => api.get(`/api/workers/${id}/stats`),
  create: (payload) => api.post("/api/workers", payload),
  update: (id, payload) => api.patch(`/api/workers/${id}`, payload),
  remove: (id) => api.delete(`/api/workers/${id}`),
  attendance: (id, payload) => api.post(`/api/workers/${id}/attendance`, payload),
  sanction: (id, payload) => api.post(`/api/workers/${id}/sanction`, payload),
  setAccount: (id, payload) => api.post(`/api/workers/${id}/account`, payload),
};

export const workerSelfApi = {
  me: () => api.get("/api/worker/me"),
  updateMe: (payload) => api.patch("/api/worker/me", payload),
  stats: () => api.get("/api/worker/stats"),
  jobs: (params) => api.get("/api/worker/jobs", { params }),
  job: (id) => api.get(`/api/worker/jobs/${id}`),
  respond: (id, payload) => api.post(`/api/worker/jobs/${id}/respond`, payload),
  setStatus: (id, payload) => api.post(`/api/worker/jobs/${id}/status`, payload),
  reportAbsence: (id, payload) => api.post(`/api/worker/jobs/${id}/absence`, payload),
  reviews: (params) => api.get("/api/worker/reviews", { params }),
};

export const reviewApi = {
  list: (params) => api.get("/api/reviews", { params }),
  summary: (params) => api.get("/api/reviews/summary", { params }),
  forBooking: (bookingId) => api.get(`/api/reviews/booking/${bookingId}`),
  create: (payload) => api.post("/api/reviews", payload),
  setVisibility: (id, isVisible) => api.patch(`/api/reviews/${id}/visibility`, { isVisible }),
};

export const complaintApi = {
  list: (params) => api.get("/api/complaints", { params }),
  get: (id) => api.get(`/api/complaints/${id}`),
  create: (payload) => api.post("/api/complaints", payload),
  update: (id, payload) => api.patch(`/api/complaints/${id}`, payload),
  escalate: (id, payload) => api.post(`/api/complaints/${id}/escalate`, payload || {}),
};

export const auditApi = {
  list: (params) => api.get("/api/audit-logs", { params }),
};

export const nakaApi = {
  list: (params) => api.get("/api/nakas", { params }),
  get: (id) => api.get(`/api/nakas/${id}`),
  create: (payload) => api.post("/api/nakas", payload),
  update: (id, payload) => api.patch(`/api/nakas/${id}`, payload),
  createAdmin: (nakaId, payload) => api.post(`/api/nakas/${nakaId}/admins`, payload),
};

export const userApi = {
  list: (params) => api.get("/api/users", { params }),
  get: (id) => api.get(`/api/users/${id}`),
  create: (payload) => api.post("/api/users", payload),
  update: (id, payload) => api.patch(`/api/users/${id}`, payload),
  setActive: (id, isActive) => api.patch(`/api/users/${id}/active`, { isActive }),
  resetPassword: (id, password) => api.post(`/api/users/${id}/reset-password`, { password }),
};

export const serviceApi = {
  listPublic: () => api.get("/api/services"),
  listAdmin: () => api.get("/api/services/admin/all"),
  create: (payload) => api.post("/api/services", payload),
  update: (id, payload) => api.patch(`/api/services/${id}`, payload),
};

export const reportApi = {
  dashboard: () => api.get("/api/reports/dashboard"),
  bookings: (params) => api.get("/api/reports/bookings", { params }),
};
