import { useTranslation } from "react-i18next";

const STATUS_STYLES = {
  Pending: "warning",
  Assigned: "info",
  Accepted: "primary",
  "In Progress": "primary",
  Completed: "success",
  Cancelled: "secondary",
  Complaint: "danger",
  // Complaint workflow statuses.
  Open: "danger",
  "In Review": "warning",
  Escalated: "dark",
  Resolved: "success",
  Rejected: "secondary",
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const color = STATUS_STYLES[status] || "secondary";
  const label = t(`booking.status.${status}`, {
    defaultValue: t(`complaint.status.${status}`, { defaultValue: status }),
  });
  return <span className={`badge text-bg-${color} status-badge`}>{label}</span>;
}
