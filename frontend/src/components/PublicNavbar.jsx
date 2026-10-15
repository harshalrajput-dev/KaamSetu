import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth.js";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { dashboardPathFor } from "../utils/roleHome.js";

export default function PublicNavbar() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardPath = dashboardPathFor(user?.role);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top public-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/" onClick={close}>
          <span className="brand-badge">
            <i className="bi bi-tools" aria-hidden="true" />
          </span>
          <span className="text-primary">KaamSetu</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-controls="public-nav"
          aria-expanded={open}
          aria-label={t("nav.menu", { defaultValue: "Menu" })}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${open ? "show" : ""}`} id="public-nav">
          <ul className="navbar-nav me-auto my-2 my-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link px-lg-3" to="/" end onClick={close}>
                {t("nav.home")}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-lg-3" to="/about" onClick={close}>
                {t("nav.about")}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-lg-3" to="/services" onClick={close}>
                {t("nav.services")}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link px-lg-3" to="/contact" onClick={close}>
                {t("nav.contact")}
              </NavLink>
            </li>
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 gap-lg-2">
            <LanguageSwitcher className="order-2 order-lg-1" buttonClassName="w-100 justify-content-between justify-content-lg-center" />
            {isAuthenticated ? (
              <div className="d-flex flex-column flex-lg-row gap-2 order-1 order-lg-2">
                <Link className="btn btn-outline-primary btn-sm" to={dashboardPath} onClick={close}>
                  <i className="bi bi-speedometer2 me-1" aria-hidden="true" />
                  {t("nav.dashboard")}
                </Link>
                <button className="btn btn-primary btn-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                  {t("common.logout")}
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column flex-lg-row gap-2 order-1 order-lg-2">
                <Link className="btn btn-outline-primary btn-sm" to="/login" onClick={close}>
                  {t("nav.login")}
                </Link>
                <Link className="btn btn-primary btn-sm" to="/register" onClick={close}>
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
