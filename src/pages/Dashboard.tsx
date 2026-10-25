import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";
import { StatusBadge } from "../components/StatusBadge";
import type { DiscoverySummary, ProviderHealth, ScannerStatus, TokenRow } from "../types";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<ScannerStatus | null>(null);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [storage, setStorage] = useState<string>("?");
  const [discovery, setDiscovery] = useState<DiscoverySummary | null>(null);
  const [discovering, setDiscovering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sc, pr, tok, last] = await Promise.all([
        api.scannerStatus(),
        api.providersHealth().catch(() => ({ providers: [] as ProviderHealth[] })),
        api.listTokens({ limit: 8 }),
        api.lastDiscovery().catch(() => ({ last: null, storage: "?" })),
      ]);
      setScanner(sc);
      setProviders(pr.providers || []);
      setTokens(tok.items || []);
      setStorage(tok.storage || sc.storage || "?");
      setDiscovery(last.last);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onDiscover() {
    setDiscovering(true);
    setError(null);
    try {
      const res = await api.runDiscovery(undefined, 6);
      setDiscovery(res);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDiscovering(false);
    }
  }

  if (loading) return <Loading label="Loading dashboard…" />;
  if (error && !scanner) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div className="page">
      <section className="card">
        <div className="card-head">
          <h2>Service</h2>
          <span className={`pill ${scanner?.actual?.service === "STOPPED" ? "pill-warn" : "pill-ok"}`}>
            {scanner?.actual?.service || "UNKNOWN"}
          </span>
        </div>
        <p className="muted small">{scanner?.actual?.reason || scanner?.note}</p>
        <div className="kv-grid">
          <div>
            <span className="k">Storage</span>
            <span className="v">{storage}</span>
          </div>
          <div>
            <span className="k">Health</span>
            <span className="v">{scanner?.health || "—"}</span>
          </div>
          <div>
            <span className="k">Trading</span>
            <span className="v">OFF</span>
          </div>
          <div>
            <span className="k">Chains</span>
            <span className="v">
              {scanner?.actual?.chains
                ? Object.entries(scanner.actual.chains)
                    .map(([c, s]) => `${c}:${s}`)
                    .join(" · ")
                : "—"}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Providers</h2>
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        {providers.length === 0 ? (
          <p className="muted">No provider health data (API may be offline).</p>
        ) : (
          <ul className="list">
            {providers.map((p) => (
              <li key={p.name} className="list-row">
                <span className="mono">{p.name}</span>
                <span className={`pill ${p.ping_ok ? "pill-ok" : "pill-bad"}`}>
                  {p.ping_ok ? "OK" : p.health}
                </span>
                {p.latency_ms != null && (
                  <span className="muted small">{Math.round(p.latency_ms)}ms</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Discovery</h2>
          <button
            type="button"
            className="btn btn-primary"
            disabled={discovering}
            onClick={onDiscover}
          >
            {discovering ? "Running…" : "Run now"}
          </button>
        </div>
        {discovery ? (
          <div className="kv-grid">
            <div>
              <span className="k">Pairs scanned</span>
              <span className="v">{discovery.scanned_pairs ?? "—"}</span>
            </div>
            <div>
              <span className="k">Candidates</span>
              <span className="v">{discovery.candidates ?? "—"}</span>
            </div>
            <div>
              <span className="k">Enqueued</span>
              <span className="v">{discovery.enqueued?.length ?? 0}</span>
            </div>
            <div>
              <span className="k">Ignored / known</span>
              <span className="v">
                {(discovery.skipped_ignored ?? 0) + (discovery.skipped_known ?? 0)}
              </span>
            </div>
          </div>
        ) : (
          <p className="muted">No discovery cycle yet. Run one to find new pairs.</p>
        )}
        <p className="disclaimer">
          Discovery only enqueues evaluation. It never auto-qualifies or trades.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Recent tokens</h2>
          <Link to="/tokens" className="link">
            View all
          </Link>
        </div>
        {tokens.length === 0 ? (
          <p className="muted">No tokens in store yet. Run discovery or evaluate an address.</p>
        ) : (
          <ul className="list">
            {tokens.map((t) => (
              <li key={`${t.chain}:${t.address}`}>
                <Link
                  className="list-row link-row"
                  to={`/tokens/${t.chain}/${encodeURIComponent(t.address)}`}
                >
                  <div>
                    <div className="token-name">
                      {t.symbol || "?"} <span className="muted">{t.name || ""}</span>
                    </div>
                    <div className="mono small muted">
                      {t.chain} · {t.address.slice(0, 8)}…{t.address.slice(-4)}
                    </div>
                  </div>
                  <StatusBadge status={t.current_status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <ErrorBox message={error} onRetry={load} />}
    </div>
  );
}
