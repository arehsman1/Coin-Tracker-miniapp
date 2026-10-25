import { STATUS_CLASS, STATUS_LABELS } from "../types";

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="badge status-unknown">Unknown</span>;
  const cls = STATUS_CLASS[status] || "status-unknown";
  const label = STATUS_LABELS[status] || status;
  return <span className={`badge ${cls}`}>{label}</span>;
}
