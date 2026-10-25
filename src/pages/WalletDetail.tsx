import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";
import type {
  TrackedWalletRow,
  WalletPerformance,
  WalletProfileSummary,
  WalletTxRow,
} from "../types";

function shortAddr(addr: string, n = 8): string {
  if (!addr || addr.length <= n * 2 + 2) return addr;
  return `${addr.slice(0, n + (addr.startsWith("0x") ? 2 : 0))}…${addr.slice(-n)}`;
}

function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function eventClass(eventType: string): string {
  if (eventType === "SWAP_BUY") return "event-buy";
  if (eventType === "SWAP_SELL") return "event-sell";
  if (eventType.startsWith("TRANSFER")) return "event-transfer";
  return "event-other";
}

function formatPct(rate?: number | null): string {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function formatUsd(v?: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function WalletDetail() {
  const { chain = "", address: rawAddress = "" } = useParams();
  const address = decodeURIComponent(rawAddress);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracked, setTracked] = useState<TrackedWalletRow | null>(null);
  const [profile, setProfile] = useState<WalletProfileSummary | null>(null);
  const [perf, setPerf] = useState<WalletPerformance | null>(null);
  const [txs, setTxs] = useState<WalletTxRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [storage, setStorage] = useState("?");
  const [sigOnly, setSigOnly] = useState(false);
  const [untracking, setUntracking] = useState(false);

  const load = useCallback(async () => {
    if (!chain || !address) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await api.getWallet(chain, address);
      setTracked(detail.tracked || null);
      setProfile(detail.profile || null);
      setTxs(detail.recent_transactions || []);
      setNote(detail.note || null);
      setStorage(detail.storage || "?");

      if (sigOnly) {
        const txRes = await api.listWalletTransactions(chain, address, {
          significant_only: true,
          limit: 50,
        });
        setTxs(txRes.transactions || []);
      }

      try {
        const p = await api.getWalletPerformance(chain, address);
        setPerf(p.performance || null);
      } catch {
        setPerf(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [chain, address, sigOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function onUntrack() {
    if (!chain || !address) return;
    if (!confirm("Stop tracking this wallet? History is kept.")) return;
    setUntracking(true);
    setError(null);
    try {
      await api.untrackWallet(chain, address);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUntracking(false);
    }
  }

  if (loading && !tracked && txs.length === 0) {
    return (
      <div className="page">
        <Loading />
      </div>
    );
  }

  return (
    <div className="page">
      <p className="back-link">
        <Link to="/wallets">← Wallets</Link>
      </p>

      {error && <ErrorBox message={error} />}

      <section className="card">
        <div className="card-head">
          <h2>{tracked?.label || "Wallet"}</h2>
          <span className="chip chain-chip">{chain}</span>
        </div>
        <p className="mono break-all">{address}</p>
        <div className="meta-grid">
          <div>
            <span className="muted small">Status</span>
            <div>
              {tracked?.is_active === false ? "Inactive" : tracked ? "Tracking" : "Not tracked"}
            </div>
          </div>
          <div>
            <span className="muted small">Source</span>
            <div>{tracked?.source || "—"}</div>
          </div>
          <div>
            <span className="muted small">Last activity</span>
            <div>{formatTime(tracked?.last_activity_at)}</div>
          </div>
          <div>
            <span className="muted small">Sig. threshold</span>
            <div>
              {tracked?.significant_swap_usd_threshold != null
                ? `$${tracked.significant_swap_usd_threshold}`
                : "$500 (default)"}
            </div>
          </div>
        </div>
        {tracked?.notes && <p className="muted">{tracked.notes}</p>}
        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={() => load()}>
            Refresh
          </button>
          {tracked?.is_active !== false && tracked && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onUntrack}
              disabled={untracking}
            >
              {untracking ? "…" : "Untrack"}
            </button>
          )}
        </div>
        <p className="disclaimer small">storage: {storage}</p>
      </section>

      {profile && (
        <section className="card">
          <h2>Observed profile</h2>
          <div className="meta-grid">
            <div>
              <span className="muted small">Observed swaps</span>
              <div>{profile.observed_trade_count ?? 0}</div>
            </div>
            <div>
              <span className="muted small">Significant</span>
              <div>{profile.observed_significant_count ?? 0}</div>
            </div>
            <div>
              <span className="muted small">Data completeness</span>
              <div>{profile.data_completeness_score ?? 0}/100</div>
            </div>
            <div>
              <span className="muted small">Confidence</span>
              <div>{profile.confidence_score ?? 0}/100</div>
            </div>
          </div>
        </section>
      )}

      {perf && (
        <section className="card">
          <div className="card-head">
            <h2>Performance (observed)</h2>
            <span className="muted small">{perf.scoring_rule_version || "v0.1"}</span>
          </div>
          <div className="meta-grid">
            <div>
              <span className="muted small">Sample size</span>
              <div>{perf.sample_size ?? 0}</div>
            </div>
            <div>
              <span className="muted small">Closed trades</span>
              <div>{perf.closed_trade_count ?? 0}</div>
            </div>
            <div>
              <span className="muted small">Win rate</span>
              <div>
                {formatPct(perf.win_rate)}{" "}
                <span className="muted small">
                  ({perf.win_count ?? 0}W / {perf.loss_count ?? 0}L)
                </span>
              </div>
            </div>
            <div>
              <span className="muted small">Realized PnL</span>
              <div>
                {formatUsd(perf.realized_pnl_usd)}{" "}
                <span className="muted small">({perf.realized_pnl_status || "UNKNOWN"})</span>
              </div>
            </div>
            <div>
              <span className="muted small">Completeness</span>
              <div>{perf.data_completeness_score ?? 0}/100</div>
            </div>
            <div>
              <span className="muted small">Confidence</span>
              <div>{perf.confidence_score ?? 0}/100</div>
            </div>
          </div>
          {perf.components && (
            <div className="meta-grid" style={{ marginTop: 8 }}>
              <div>
                <span className="muted small">Quality composite</span>
                <div>{perf.components.composite_quality?.toFixed?.(2) ?? "—"}</div>
              </div>
              <div>
                <span className="muted small">Sample factor</span>
                <div>{perf.components.sample_factor?.toFixed?.(2) ?? "—"}</div>
              </div>
            </div>
          )}
          {perf.open_positions && perf.open_positions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span className="muted small">Open positions (observed)</span>
              <ul className="list">
                {perf.open_positions.map((p) => (
                  <li key={p.token_address} className="list-item">
                    <code className="mono">{shortAddr(p.token_address, 6)}</code>
                    <div className="list-meta small">
                      qty {p.qty_open} · basis {p.cost_basis_status} · realized{" "}
                      {formatUsd(p.realized_pnl_usd)} ({p.realized_pnl_status})
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {perf.limitations && perf.limitations.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <span className="muted small">Limitations</span>
              <ul className="small muted">
                {perf.limitations.slice(0, 8).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="disclaimer small">
            {perf.disclaimer ||
              "Observed swaps only. Incomplete history is not full lifetime P&L. Not a prediction."}
          </p>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Activity</h2>
          <label className="check-inline">
            <input
              type="checkbox"
              checked={sigOnly}
              onChange={(e) => setSigOnly(e.target.checked)}
            />
            Significant only
          </label>
        </div>
        {txs.length === 0 && (
          <p className="muted">No transactions recorded yet for this wallet.</p>
        )}
        {txs.length > 0 && (
          <ul className="list">
            {txs.map((t) => (
              <li key={`${t.tx_signature}:${t.event_type}`} className="list-item tx-item">
                <div className="list-row">
                  <span className={`chip ${eventClass(t.event_type)}`}>{t.event_type}</span>
                  {t.is_significant && <span className="chip chip-sig">significant</span>}
                </div>
                <div className="list-meta small">
                  {t.value_usd != null ? (
                    <span>
                      ~${Number(t.value_usd).toLocaleString()} ({t.value_usd_status || "?"})
                    </span>
                  ) : (
                    <span className="muted">USD unknown</span>
                  )}
                  {t.token_address && (
                    <span>
                      {" "}
                      · token <code className="mono">{shortAddr(t.token_address, 4)}</code>
                    </span>
                  )}
                  {t.dex_or_protocol && <span> · {t.dex_or_protocol}</span>}
                </div>
                <div className="muted small">
                  {formatTime(t.block_time)} ·{" "}
                  <code className="mono">{shortAddr(t.tx_signature, 6)}</code>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {note && (
        <section className="card">
          <p className="disclaimer">{note}</p>
        </section>
      )}
    </div>
  );
}
