import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";
import type { TrackedWalletRow } from "../types";

const CHAINS = ["", "solana", "ethereum", "base"];

function shortAddr(addr: string, n = 6): string {
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

export function Wallets() {
  const [items, setItems] = useState<TrackedWalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState("");
  const [storage, setStorage] = useState("?");

  // Track form
  const [trackChain, setTrackChain] = useState("solana");
  const [trackAddr, setTrackAddr] = useState("");
  const [trackLabel, setTrackLabel] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackMsg, setTrackMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listWallets({
        chain: chain || undefined,
        active_only: true,
        limit: 50,
      });
      setItems(res.wallets || []);
      setStorage(res.storage);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [chain]);

  useEffect(() => {
    load();
  }, [load]);

  async function onTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackAddr.trim()) return;
    setTracking(true);
    setError(null);
    setTrackMsg(null);
    try {
      const res = await api.trackWallet({
        chain: trackChain,
        address: trackAddr.trim(),
        label: trackLabel.trim() || undefined,
        source: "manual",
      });
      setTrackMsg(`Tracking ${res.wallet.address}`);
      setTrackAddr("");
      setTrackLabel("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTracking(false);
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h2>Track public wallet</h2>
        <p className="disclaimer">
          Public wallet monitoring does not require connecting your personal wallet.
          Trading and signing stay OFF.
        </p>
        <form className="form" onSubmit={onTrack}>
          <label>
            Chain
            <select value={trackChain} onChange={(e) => setTrackChain(e.target.value)}>
              <option value="solana">Solana</option>
              <option value="ethereum">Ethereum</option>
              <option value="base">Base</option>
            </select>
          </label>
          <label>
            Address
            <input
              value={trackAddr}
              onChange={(e) => setTrackAddr(e.target.value)}
              placeholder="Wallet address"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label>
            Label (optional)
            <input
              value={trackLabel}
              onChange={(e) => setTrackLabel(e.target.value)}
              placeholder="e.g. Whale A"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={tracking}>
            {tracking ? "Saving…" : "Start tracking"}
          </button>
        </form>
        {trackMsg && <p className="ok-msg">{trackMsg}</p>}
        <p className="disclaimer small">
          Track/untrack requires authorised backend permission. Unauthorised calls return 403.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Tracked wallets</h2>
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
          <button type="button" className="btn btn-ghost" onClick={() => load()}>
            Refresh
          </button>
        </div>

        {error && <ErrorBox message={error} />}
        {loading && <Loading />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No tracked wallets"
            body="Add a public address above. Activity alerts are independent of token qualification."
          />
        )}
        {!loading && items.length > 0 && (
          <ul className="list">
            {items.map((w) => (
              <li key={`${w.chain}:${w.address}`} className="list-item">
                <Link
                  to={`/wallets/${w.chain}/${encodeURIComponent(w.address)}`}
                  className="list-link"
                >
                  <div className="list-row">
                    <span className="chip chain-chip">{w.chain}</span>
                    {w.label ? (
                      <strong>{w.label}</strong>
                    ) : (
                      <code className="mono">{shortAddr(w.address)}</code>
                    )}
                  </div>
                  <div className="list-meta muted small">
                    {w.label && <code className="mono">{shortAddr(w.address)}</code>}
                    {w.last_activity_at && (
                      <span> · last {formatTime(w.last_activity_at)}</span>
                    )}
                    {w.source && <span> · {w.source}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
