export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}
