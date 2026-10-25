export function ScoreBar({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  // invert: high risk is bad (red when high)
  let tone = "tone-mid";
  if (invert) {
    if (v >= 60) tone = "tone-bad";
    else if (v <= 30) tone = "tone-good";
  } else {
    if (v >= 60) tone = "tone-good";
    else if (v <= 30) tone = "tone-bad";
  }
  return (
    <div className="score-row">
      <div className="score-meta">
        <span>{label}</span>
        <span className="score-val">{v.toFixed(0)}</span>
      </div>
      <div className="score-track">
        <div className={`score-fill ${tone}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
