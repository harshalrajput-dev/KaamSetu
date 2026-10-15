import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

export default function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useTranslation();

  const highlights = [
    { icon: "patch-check-fill", title: t("home.why1Title") },
    { icon: "eye-fill", title: t("home.why2Title") },
    { icon: "geo-alt-fill", title: t("home.why3Title") },
  ];

  return (
    <div className="auth-wrap">
      <div className="auth-card card border-0 shadow-lg">
        <div className="row g-0">
          <aside className="col-lg-5 auth-side d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5 text-white">
            <Link to="/" className="footer-brand d-inline-flex align-items-center gap-2 text-decoration-none">
              <span className="brand-badge brand-badge-light">
                <i className="bi bi-tools" aria-hidden="true" />
              </span>
              <span className="fs-4 fw-bold text-white">KaamSetu</span>
            </Link>
            <div>
              <h2 className="h3 fw-bold mb-3">{t("common.tagline")}</h2>
              <ul className="list-unstyled auth-highlights mb-0">
                {highlights.map((h) => (
                  <li key={h.title} className="d-flex align-items-center gap-2 mb-2">
                    <i className={`bi bi-${h.icon}`} aria-hidden="true" />
                    <span>{h.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="small text-white-50 mb-0">{t("contact.addressValue")}</p>
          </aside>

          <div className="col-lg-7">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Link
                  to="/"
                  className="fw-bold text-primary text-decoration-none d-flex align-items-center gap-2 fs-5 d-lg-none"
                >
                  <i className="bi bi-tools" aria-hidden="true" /> KaamSetu
                </Link>
                <span className="d-none d-lg-block" />
                <LanguageSwitcher />
              </div>
              <h1 className="h4 fw-bold mb-1">{title}</h1>
              {subtitle ? <p className="text-muted mb-4">{subtitle}</p> : null}
              {children}
              {footer ? <div className="text-center mt-4 small">{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
