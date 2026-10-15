import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useServiceLabel from "../../utils/serviceLabel.js";
import { serviceIcon as iconForService } from "../../utils/serviceIcon.js";

export default function Home() {
  const { t } = useTranslation();
  const label = useServiceLabel();

  const services = ["Plumber", "Electrician", "Painter", "Carpenter", "Mason", "General Labour"];
  const steps = [
    { icon: "hand-index-thumb", title: t("home.step1Title"), text: t("home.step1Text") },
    { icon: "clipboard-plus", title: t("home.step2Title"), text: t("home.step2Text") },
    { icon: "people-fill", title: t("home.step3Title"), text: t("home.step3Text") },
    { icon: "graph-up-arrow", title: t("home.step4Title"), text: t("home.step4Text") },
  ];
  const why = [
    { icon: "patch-check-fill", title: t("home.why1Title"), text: t("home.why1Text") },
    { icon: "eye-fill", title: t("home.why2Title"), text: t("home.why2Text") },
    { icon: "geo-alt-fill", title: t("home.why3Title"), text: t("home.why3Text") },
  ];

  return (
    <div>
      <section className="hero">
        <div className="container position-relative">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge text-bg-light text-primary mb-3">Udhna, Surat</span>
              <h1 className="mb-3">{t("home.heroTitle")}</h1>
              <p className="lead mb-4 opacity-75">{t("home.heroSubtitle")}</p>
              <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-light btn-lg text-primary fw-semibold" to="/register">
                  <i className="bi bi-calendar-plus me-2" />
                  {t("home.heroCta")}
                </Link>
                <Link className="btn btn-outline-light btn-lg" to="/services">
                  {t("home.heroCtaSecondary")}
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center d-none d-lg-block">
              <i className="bi bi-tools" style={{ fontSize: "12rem", opacity: 0.25 }} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">{t("home.howItWorks")}</h2>
          </div>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div className="col-6 col-lg-3" key={s.title}>
                <div className="card border-0 shadow-sm h-100 text-center p-3">
                  <div className="service-icon text-bg-primary mx-auto mb-3">
                    <i className={`bi bi-${s.icon}`} />
                  </div>
                  <span className="badge text-bg-light text-muted align-self-center mb-2">
                    {i + 1}
                  </span>
                  <h6 className="fw-semibold">{s.title}</h6>
                  <p className="text-muted small mb-0">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 bg-light-soft">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">{t("home.servicesTitle")}</h2>
            <p className="text-muted">{t("home.servicesSubtitle")}</p>
          </div>
          <div className="row g-3 g-md-4">
            {services.map((name) => (
              <div className="col-6 col-md-4 col-lg-2" key={name}>
                <Link
                  to={`/services?service=${encodeURIComponent(name)}`}
                  className="card service-card border-0 shadow-sm h-100 text-center text-decoration-none text-reset p-3"
                >
                  <i className={`bi bi-${iconForService(name)} text-primary fs-2 mb-2`} />
                  <div className="fw-semibold small">{label(name)}</div>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link className="btn btn-outline-primary" to="/services">
              {t("home.heroCtaSecondary")} <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">{t("home.whyTitle")}</h2>
          </div>
          <div className="row g-4">
            {why.map((w) => (
              <div className="col-md-4" key={w.title}>
                <div className="d-flex gap-3">
                  <i className={`bi bi-${w.icon} text-primary fs-3 flex-shrink-0`} />
                  <div>
                    <h6 className="fw-semibold">{w.title}</h6>
                    <p className="text-muted small mb-0">{w.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="fw-bold">{t("home.ctaTitle")}</h2>
          <p className="opacity-75 mb-4">{t("home.ctaText")}</p>
          <Link className="btn btn-light text-primary fw-semibold btn-lg" to="/register">
            {t("home.ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
