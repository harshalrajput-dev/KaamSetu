import axios from "axios";

// Fallback URL add karyo chhe jethi VITE_API_URL miss thay to pan seedhu backend par request jay
const baseURL = import.meta.env.VITE_API_URL || "https://kaamsetu-backend.vercel.app";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

const TOKEN_KEY = "kaamsetu_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  }
);

/**
 * Turns an axios error into a friendly message string.
 */
export function apiErrorMessage(error, fallback = "Something went wrong") {
  const data = error.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => d.message).join(", ");
  }
  return data?.message || error.message || fallback;
}

export default api;