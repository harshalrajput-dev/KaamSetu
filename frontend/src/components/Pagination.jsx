import { useTranslation } from "react-i18next";

export default function Pagination({ page, pages, total, onPageChange }) {
  const { t } = useTranslation();
  if (!pages || pages <= 1) return null;

  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i += 1) items.push(i);

  return (
    <nav className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
      <small className="text-muted">
        {t("common.showing")} {total} • {t("common.page")} {page} {t("common.of")} {pages}
      </small>
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)}>
            &laquo;
          </button>
        </li>
        {items.map((p) => (
          <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page >= pages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)}>
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
}
