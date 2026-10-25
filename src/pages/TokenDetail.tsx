import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";
import { ScoreBar } from "../components/ScoreBar";
import { StatusBadge } from "../components/StatusBadge";
import type { EvaluateResponse } from "../types";

export function TokenDetail() {
  const { chain = "", address = "" } = useParams();
  const location = useLocation();
  const preloaded = (location.state as { evaluation?: EvaluateResponse } | null)?.evaluation;

  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluateResponse | null>(preloaded || null);
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const [reevaluating, setReevaluating] = useState(false);

  const load = useCallback(async () => {
    if (!chain || !address) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getToken(chain, decodeURIComponent(address));
      setRaw(data);
      // If live evaluation embedded
      if (data.current_status && data.scores) {
        const scores = data.scores as Record<string, number>;
        setEvalResult({
          evaluation_id: String(data.current_evaluation_id || ""),
          chain: String(data.chain || chain),
          token_address: String(data.address || address),
          final_status: String(data.current_status),
          status_label: String(data.status_label || data.current_status),
          security_risk_score: scores.security_risk_score ?? 0,
          manipulation_risk_score: scores.manipulation_risk_score ?? 0,
          trade_quality_score: scores.trade_quality_score ?? 0,
          data_confidence_score: scores.data_confidence_score ?? 0,
          reasons: (data.reasons as string[]) || [],
          missing_evidence: [],
          policy_version: "",
          engine_version: "",
          evaluated_at: String(data.evaluated_at || ""),
          name: data.name as string | undefined,
          symbol: data.symbol as string | undefined,
        });
      } else if (data.token) {
        const t = data.token as Record<string, unknown>;
        const recent = (data.recent_evaluations as Record<string, unknown>[]) || [];
        const last = recent[0];
        setEvalResult({
          evaluation_id: String(last?.id || t.current_evaluation_id || ""),
          chain: String(t.chain || chain),
          token_address: String(t.address || address),
          final_status: String(t.current_status || ""),
          status_label: String(t.current_status || ""),
          security_risk_score: Number(last?.security_risk_score ?? 0),
          manipulation_risk_score: Number(last?.manipulation_risk_score ?? 0),
          trade_quality_score: Number(last?.trade_quality_score ?? 0),
          data_confidence_score: Number(last?.data_confidence_score ?? 0),
          reasons: (last?.reasons as string[]) || [],
          missing_evidence: (last?.missing_evidence as string[]) || [],
          policy_version: String(last?.policy_version || ""),
          engine_version: String(last?.engine_version || ""),
          evaluated_at: String(last?.evaluated_at || t.updated_at || ""),
          name: t.name as string | undefined,
          symbol: t.symbol as string | undefined,
          persisted: true,
          storage: data.storage as string | undefined,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [chain, address]);

  useEffect(() => {
    if (!preloaded) load();
  }, [load, preloaded]);

  async function reevaluate() {
    setReevaluating(true);
    setError(null);
    try {
      const res = await api.evaluate(chain, decodeURIComponent(address), true);
      setEvalResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReevaluating(false);
    }
  }

  if (loading) return <Loading label="Loading token…" />;
  if (error && !evalResult) return <ErrorBox message={error} onRetry={load} />;
  if (!evalResult) {
    return (
      <div className="page">
        <ErrorBox message="Token not found" onRetry={load} />
        <Link to="/tokens" className="link">
          ← Back to tokens
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/tokens" className="back-link">
        ← Tokens
      </Link>

      <section className="card">
        <div className="card-head">
          <div>
            <h1 className="token-title">
              {evalResult.symbol || "?"}{" "}
              <span className="muted">{evalResult.name || ""}</span>
            </h1>
            <div className="mono small muted break">
              {evalResult.chain} · {evalResult.token_address}
            </div>
          </div>
          <StatusBadge status={evalResult.final_status} />
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={reevaluating}
            onClick={reevaluate}
          >
            {reevaluating ? "Re-evaluating…" : "Re-evaluate"}
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Scores</h2>
        <ScoreBar label="Security risk" value={evalResult.security_risk_score} invert />
        <ScoreBar label="Manipulation risk" value={evalResult.manipulation_risk_score} invert />
        <ScoreBar label="Trade quality" value={evalResult.trade_quality_score} />
        <ScoreBar label="Data confidence" value={evalResult.data_confidence_score} />
      </section>

      <section className="card">
        <h2>Reasons</h2>
        {evalResult.reasons?.length ? (
          <ul className="bullets">
            {evalResult.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">No reasons recorded.</p>
        )}
        {evalResult.missing_evidence?.length > 0 && (
          <>
            <h3 className="subh">Missing evidence</h3>
            <ul className="bullets">
              {evalResult.missing_evidence.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>Meta</h2>
        <div className="kv-grid">
          <div>
            <span className="k">Evaluated</span>
            <span className="v small">
              {evalResult.evaluated_at
                ? new Date(evalResult.evaluated_at).toLocaleString()
                : "—"}
            </span>
          </div>
          <div>
            <span className="k">Policy</span>
            <span className="v">{evalResult.policy_version || "—"}</span>
          </div>
          <div>
            <span className="k">Engine</span>
            <span className="v">{evalResult.engine_version || "—"}</span>
          </div>
          <div>
            <span className="k">Storage</span>
            <span className="v">
              {evalResult.storage || (raw?.storage as string) || "—"}
            </span>
          </div>
        </div>
        <p className="disclaimer">
          {evalResult.limitations_note ||
            "Assessment is not a guarantee of safety, sellability, or profit. Live trading is OFF."}
        </p>
      </section>

      {error && <ErrorBox message={error} />}
    </div>
  );
}
