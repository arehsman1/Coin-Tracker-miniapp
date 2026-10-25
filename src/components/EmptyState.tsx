export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {body && <p className="empty-body">{body}</p>}
      {action}
    </div>
  );
}
