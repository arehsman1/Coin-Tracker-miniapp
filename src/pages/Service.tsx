import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";
import type { ProviderHealth, ScannerStatus } from "../types";

export function ServicePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<ScannerStatus | null>(null);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [ready, setReady] = useState<Record<string, boolean> | null>(null);
  const [mon, setMon] = useState<{
    storage?: string;
    db_available?: boolean;
    job_failure_tracker?: { tracked_failures: number; exhausted: number };
    wallet_performance_snapshots_cached?: number;
    outcomes?: Record<string, number | null | undefined>;
    safety?: Record<string, boolean>;
    note?: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sc, pr, rd, m] = await Promise.all([
        api.scannerStatus(),
        api.providersHealth(),
        api.ready(),
        api.monitoringStatus().catch(() => null),
      ]);
      setScanner(sc);
      setProviders(pr.providers || []);
      setReady(rd.checks || null);
      setMon(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading label="Loading service status…" />;
  if (error && !scanner) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div className="page">
      <section className="card">
        <div className="card-head">
          <h2>Scanner desired vs actual</h2>
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        <p className="disclaimer">
          Controls that change global scanning require admin auth and Supabase. This screen is
          read-only until those are connected.
        </p>
        <h3 className="subh">Desired (defaults)</h3>
        <ul className="list">
          {scanner &&
            Object.entries(scanner.desired || {}).map(([k, v]) => (
              <li key={k} className="list-row">
                <span>{k.replace(/_/g, " ")}</span>
                <span className={`pill ${v === "OFF" ? "pill-ok" : "pill-neutral"}`}>{v}</span>
              </li>
            ))}
        </ul>
        <h3 className="subh">Actual</h3>
        <div className="kv-grid">
          <div>
            <span className="k">Service</span>
            <span className="v">{scanner?.actual?.service}</span>
          </div>
          <div>
            <span className="k">Health</span>
            <span className="v">{scanner?.health}</span>
          </div>
        </div>
        <ul className="list">
          {scanner &&
            Object.entries(scanner.actual?.chains || {}).map(([c, s]) => (
              <li key={c} className="list-row">
                <span className="mono">{c}</span>
                <span className={`pill ${s === "BLOCKED" ? "pill-bad" : "pill-warn"}`}>{s}</span>
              </li>
            ))}
        </ul>
        {scanner?.actual?.reason && <p className="muted small">{scanner.actual.reason}</p>}
      </section>

      {mon && (
        <section className="card">
          <h2>Worker / outcomes</h2>
          <div className="kv-grid">
            <div>
              <span className="k">Storage</span>
              <span className="v">{mon.storage || "—"}</span>
            </div>
            <div>
              <span className="k">DB available</span>
              <span className="v">{mon.db_available ? "yes" : "no"}</span>
            </div>
            <div>
              <span className="k">Job failures tracked</span>
              <span className="v">{mon.job_failure_tracker?.tracked_failures ?? 0}</span>
            </div>
            <div>
              <span className="k">Wallet snapshots cached</span>
              <span className="v">{mon.wallet_performance_snapshots_cached ?? 0}</span>
            </div>
            <div>
              <span className="k">Outcomes complete</span>
              <span className="v">{mon.outcomes?.complete ?? "—"}</span>
            </div>
            <div>
              <span className="k">Live trading</span>
              <span className="v">{mon.safety?.live_trading ? "ON" : "OFF"}</span>
            </div>
          </div>
          {mon.note && <p className="disclaimer small">{mon.note}</p>}
        </section>
      )}

      <section className="card">
        <h2>Readiness checks</h2>
        {ready ? (
          <ul className="list">
            {Object.entries(ready).map(([k, ok]) => (
              <li key={k} className="list-row">
                <span>{k.replace(/_/g, " ")}</span>
                <span className={`pill ${ok ? "pill-ok" : "pill-bad"}`}>{ok ? "yes" : "no"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Unavailable</p>
        )}
      </section>

      <section className="card">
        <h2>Providers</h2>
        <ul className="list">
          {providers.map((p) => (
            <li key={p.name} className="list-row">
              <div>
                <div className="mono">{p.name}</div>
                <div className="muted small">{(p.capabilities || []).join(", ") || "—"}</div>
              </div>
              <span className={`pill ${p.ping_ok ? "pill-ok" : "pill-bad"}`}>
                {p.ping_ok ? "OK" : p.health}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {error && <ErrorBox message={error} onRetry={load} />}
    </div>
  );
}
