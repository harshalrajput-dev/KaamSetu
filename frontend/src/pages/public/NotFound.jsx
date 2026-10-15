import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicNavbar from "../../components/PublicNavbar.jsx";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="d-flex flex-column min-vh-100">
      <PublicNavbar />
      <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center p-4">
        <i className="bi bi-compass text-primary" style={{ fontSize: "4rem" }} />
        <h1 className="display-5 fw-bold mt-3">404</h1>
        <p className="text-muted">{t("common.noData")}</p>
        <Link className="btn btn-primary" to="/">
          <i className="bi bi-house me-1" /> {t("nav.home")}
        </Link>
      </div>
    </div>
  );
}
