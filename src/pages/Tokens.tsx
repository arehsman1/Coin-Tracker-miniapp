import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import type { TokenRow } from "../types";

const CHAINS = ["", "solana", "ethereum", "base"];

export function Tokens() {
  const navigate = useNavigate();
  const [items, setItems] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState("");
  const [status, setStatus] = useState("");
  const [storage, setStorage] = useState("?");

  // Evaluate form
  const [evalChain, setEvalChain] = useState("solana");
  const [evalAddr, setEvalAddr] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTokens({
        chain: chain || undefined,
        status: status || undefined,
        limit: 50,
      });
      setItems(res.items || []);
      setStorage(res.storage);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [chain, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function onEvaluate(e: FormEvent) {
    e.preventDefault();
    if (!evalAddr.trim()) return;
    setEvaluating(true);
    setError(null);
    try {
      const res = await api.evaluate(evalChain, evalAddr.trim(), true);
      navigate(`/tokens/${res.chain}/${encodeURIComponent(res.token_address)}`, {
        state: { evaluation: res },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h2>Evaluate token</h2>
        <form className="form" onSubmit={onEvaluate}>
          <label>
            Chain
            <select value={evalChain} onChange={(e) => setEvalChain(e.target.value)}>
              <option value="solana">Solana</option>
              <option value="ethereum">Ethereum</option>
              <option value="base">Base</option>
            </select>
          </label>
          <label>
            Address / mint
            <input
              value={evalAddr}
              onChange={(e) => setEvalAddr(e.target.value)}
              placeholder="Token address"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={evaluating}>
            {evaluating ? "Evaluating…" : "Evaluate now"}
          </button>
        </form>
        <p className="disclaimer">
          Live provider calls. Result is assessed by the backend engine — not by this UI.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Stored tokens</h2>
          <span className="muted small">storage: {storage}</span>
        </div>
        <div className="filters">
          <select value={chain} onChange={(e) => setChain(e.target.value)} aria-label="Filter chain">
            {CHAINS.map((c) => (
              <option key={c || "all"} value={c}>
                {c ? c : "All chains"}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter status"
          >
            <option value="">All statuses</option>
            <option value="QUALIFIED_TRADE_CANDIDATE">Qualified</option>
            <option value="PENDING_DATA_INCOMPLETE">Pending</option>
            <option value="MONITOR_NOT_YET_QUALIFIED">Monitor</option>
            <option value="REJECTED_CRITICAL_RISK">Rejected</option>
            <option value="SECURITY_QUALIFIED_NO_TRADE_SIGNAL">Security OK</option>
            <option value="QUALIFICATION_REVOKED">Revoked</option>
          </select>
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>

        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No tokens yet"
            body="Run discovery from Home, or evaluate an address above."
          />
        )}
        {!loading && items.length > 0 && (
          <ul className="list">
            {items.map((t) => (
              <li key={`${t.chain}:${t.address}`}>
                <Link
                  className="list-row link-row"
                  to={`/tokens/${t.chain}/${encodeURIComponent(t.address)}`}
                >
                  <div>
                    <div className="token-name">
                      {t.symbol || "?"}{" "}
                      <span className="muted">{t.name || ""}</span>
                    </div>
                    <div className="mono small muted">
                      {t.chain} · {t.address.slice(0, 10)}…
                    </div>
                  </div>
                  <StatusBadge status={t.current_status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
