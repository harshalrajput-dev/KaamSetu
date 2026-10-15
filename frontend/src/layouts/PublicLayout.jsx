import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar.jsx";
import Footer from "../components/Footer.jsx";

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light-soft">
      <PublicNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
