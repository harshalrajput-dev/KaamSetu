import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <Link to="/" className="footer-brand d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
              <span className="brand-badge brand-badge-light">
                <i className="bi bi-tools" aria-hidden="true" />
              </span>
              <span className="fs-5 fw-bold text-white">KaamSetu</span>
            </Link>
            <p className="footer-tagline mb-0">
              KaamSetu — Connecting customers with skilled local professionals.
            </p>
          </div>

          <div className="col-6 col-lg-2 col-md-3">
            <h6 className="footer-heading">{t("footer.quickLinks")}</h6>
            <ul className="list-unstyled footer-links mb-0">
              <li><Link to="/">{t("nav.home")}</Link></li>
              <li><Link to="/about">{t("nav.about")}</Link></li>
              <li><Link to="/services">{t("nav.services")}</Link></li>
              <li><Link to="/contact">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-2 col-md-3">
            <h6 className="footer-heading">{t("footer.legal")}</h6>
            <ul className="list-unstyled footer-links mb-0">
              <li><Link to="/privacy">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms">{t("footer.terms")}</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-12">
            <h6 className="footer-heading">{t("footer.contact")}</h6>
            <ul className="list-unstyled footer-links mb-0">
              <li>
                <i className="bi bi-geo-alt me-2" aria-hidden="true" />
                {t("contact.addressValue")}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container py-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 text-center text-sm-start">
          <span className="footer-credit">Created by Harshal Rajput | Full Stack Developer</span>
          <span className="footer-copy">
            © {year} KaamSetu. {t("footer.rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
