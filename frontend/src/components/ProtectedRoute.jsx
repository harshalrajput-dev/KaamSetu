import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import Spinner from "./Spinner.jsx";
import { dashboardPathFor } from "../utils/roleHome.js";

/**
 * Guards a route. Optionally restricts to a set of roles.
 * Frontend guards improve UX; the backend enforces the real security.
 * Signed-in users who lack the required role are sent to their own
 * dashboard instead of a dead end.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullscreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(role)) return <Navigate to={dashboardPathFor(role)} replace />;

  return children;
}
