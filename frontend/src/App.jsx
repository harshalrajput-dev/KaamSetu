import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Spinner from "./components/Spinner.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import { dashboardPathFor } from "./utils/roleHome.js";

import PublicLayout from "./layouts/PublicLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import Home from "./pages/public/Home.jsx";
import About from "./pages/public/About.jsx";
import ServicesPage from "./pages/public/ServicesPage.jsx";
import Contact from "./pages/public/Contact.jsx";
import Privacy from "./pages/public/Privacy.jsx";
import Terms from "./pages/public/Terms.jsx";
import NotFound from "./pages/public/NotFound.jsx";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import CreateBooking from "./pages/customer/CreateBooking.jsx";
import MyBookings from "./pages/customer/MyBookings.jsx";
import BookingDetails from "./pages/shared/BookingDetails.jsx";

import NakaDashboard from "./pages/naka/NakaDashboard.jsx";
import NakaBookings from "./pages/naka/NakaBookings.jsx";
import NakaWorkers from "./pages/naka/NakaWorkers.jsx";

import WorkerDashboard from "./pages/worker/WorkerDashboard.jsx";
import WorkerJobs from "./pages/worker/WorkerJobs.jsx";
import WorkerJobDetails from "./pages/worker/WorkerJobDetails.jsx";
import WorkerReviews from "./pages/worker/WorkerReviews.jsx";
import WorkerProfile from "./pages/worker/WorkerProfile.jsx";

import SuperDashboard from "./pages/super/SuperDashboard.jsx";
import ManageNakas from "./pages/super/ManageNakas.jsx";
import ManageNakaAdmins from "./pages/super/ManageNakaAdmins.jsx";
import ManageUsers from "./pages/super/ManageUsers.jsx";
import ManageWorkers from "./pages/super/ManageWorkers.jsx";
import ManageBookings from "./pages/super/ManageBookings.jsx";
import ManageServices from "./pages/super/ManageServices.jsx";
import Reports from "./pages/super/Reports.jsx";
import AuditLogs from "./pages/super/AuditLogs.jsx";

import Profile from "./pages/shared/Profile.jsx";
import ChangePassword from "./pages/shared/ChangePassword.jsx";
import Complaints from "./pages/shared/Complaints.jsx";
import Reviews from "./pages/shared/Reviews.jsx";

function RootRedirect() {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <Spinner fullscreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPathFor(role)} replace />;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/app" element={<RootRedirect />} />

        {/* Customer */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["customer"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="bookings/new" element={<CreateBooking />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Naka Admin */}
        <Route
          path="/naka"
          element={
            <ProtectedRoute roles={["naka_admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<NakaDashboard />} />
          <Route path="bookings/new" element={<NakaBookings mode="new" />} />
          <Route path="bookings/assigned" element={<NakaBookings mode="assigned" />} />
          <Route path="bookings/history" element={<NakaBookings mode="history" />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="workers" element={<NakaWorkers />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Worker */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute roles={["worker"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkerDashboard />} />
          <Route path="jobs" element={<WorkerJobs />} />
          <Route path="jobs/:id" element={<WorkerJobDetails />} />
          <Route path="reviews" element={<WorkerReviews />} />
          <Route path="profile" element={<WorkerProfile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Super Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["super_admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperDashboard />} />
          <Route path="nakas" element={<ManageNakas />} />
          <Route path="naka-admins" element={<ManageNakaAdmins />} />
          <Route path="workers" element={<ManageWorkers />} />
          <Route path="customers" element={<ManageUsers />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="services" element={<ManageServices />} />
          <Route path="reports" element={<Reports />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
