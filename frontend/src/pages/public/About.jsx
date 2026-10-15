import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <h1 className="section-title mb-3">{t("about.title")}</h1>
          <p className="text-muted lead">{t("about.body")}</p>
          <div className="row g-4 mt-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <i className="bi bi-bullseye text-primary fs-2" />
                  <h5 className="mt-3 fw-semibold">{t("about.missionTitle")}</h5>
                  <p className="text-muted mb-0">{t("about.missionText")}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <i className="bi bi-eye text-primary fs-2" />
                  <h5 className="mt-3 fw-semibold">{t("about.visionTitle")}</h5>
                  <p className="text-muted mb-0">{t("about.visionText")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
