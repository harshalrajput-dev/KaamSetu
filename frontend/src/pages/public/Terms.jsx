import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <h1 className="section-title mb-3">{t("terms.title")}</h1>
          <p className="text-muted">{t("terms.body")}</p>
        </div>
      </div>
    </div>
  );
}
