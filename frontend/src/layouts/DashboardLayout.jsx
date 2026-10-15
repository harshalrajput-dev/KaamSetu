import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth.js";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import { DASHBOARD_BASE, DASHBOARD_NAV } from "./navConfig.js";

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const base = DASHBOARD_BASE[user?.role] || "/dashboard";
  const items = DASHBOARD_NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard-wrap">
      <aside className={`dashboard-sidebar bg-white border-end ${open ? "open" : ""}`}>
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <Link to="/" className="fw-bold text-primary text-decoration-none d-flex align-items-center gap-2">
            <i className="bi bi-tools" /> KaamSetu
          </Link>
          <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={() => setOpen(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="p-3 border-bottom">
          <div className="fw-semibold text-truncate">{user?.name}</div>
          <span className="badge text-bg-primary-subtle text-primary-emphasis">
            {t(`roles.${user?.role}`)}
          </span>
          {user?.naka?.name ? <div className="small text-muted mt-1">{user.naka.name}</div> : null}
        </div>

        <nav className="nav flex-column p-2">
          {items.map((item) => (
            <NavLink
              key={item.to || "root"}
              to={`${base}${item.to ? `/${item.to}` : ""}`}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link dashboard-link d-flex align-items-center gap-2 rounded ${
                  isActive ? "active" : ""
                }`
              }
            >
              <i className={`bi bi-${item.icon}`} />
              <span className="text-truncate">{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {open ? <div className="sidebar-backdrop d-lg-none" onClick={() => setOpen(false)} /> : null}

      <div className="dashboard-main">
        <header className="dashboard-topbar bg-white border-bottom px-3 py-2 d-flex align-items-center justify-content-between sticky-top">
          <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={() => setOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <div className="fw-semibold d-none d-sm-block">{t(`roles.${user?.role}`)}</div>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitcher />
            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" />
              <span className="d-none d-sm-inline ms-1">{t("common.logout")}</span>
            </button>
          </div>
        </header>

        <main className="p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
