import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";
import { ErrorBox } from "../components/ErrorBox";
import { Loading } from "../components/Loading";

interface PublicSettings {
  supported_chains: string[];
  engine_version: string;
  policy_version: string;
  live_trading: boolean;
  automatic_buying?: boolean;
  automatic_selling?: boolean;
  wallet_signing?: boolean;
  auto_trading_enabled?: boolean;
  wallet_connection_enabled?: boolean;
  public_wallet_tracking_enabled?: boolean;
  significant_swap_usd_threshold_default?: number;
  outcome_horizons_minutes?: number[];
  safety_notes?: string[];
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="list-row">
      <span>{label}</span>
      <span className={on ? "pill pill-warn" : "pill pill-ok"}>{on ? "ON" : "OFF"}</span>
    </div>
  );
}

export function Settings() {
  const { user, isTelegram, initData } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [health, setHealth] = useState<{ version?: string; engine_version?: string } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, h] = await Promise.all([api.publicSettings(), api.health()]);
        setSettings(s as PublicSettings);
        setHealth(h);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="page">
      <section className="card">
        <h2>Safety controls</h2>
        <p className="disclaimer">
          These flags are independent. Turning on public tracking does not enable personal wallet
          connection or trading.
        </p>
        <Flag on={!!settings?.live_trading} label="Live trading" />
        <Flag on={!!settings?.auto_trading_enabled} label="Auto-trading" />
        <Flag on={!!settings?.automatic_buying} label="Automatic buying" />
        <Flag on={!!settings?.automatic_selling} label="Automatic selling" />
        <Flag on={!!settings?.wallet_signing} label="Wallet signing" />
        <Flag on={!!settings?.wallet_connection_enabled} label="Personal wallet connection" />
        <Flag
          on={settings?.public_wallet_tracking_enabled !== false}
          label="Public wallet tracking"
        />
        <p className="muted small" style={{ marginTop: 10 }}>
          Significant-swap alert default: $
          {settings?.significant_swap_usd_threshold_default ?? 500}
        </p>
        {(settings?.safety_notes || []).map((n) => (
          <p key={n} className="disclaimer small">
            {n}
          </p>
        ))}
      </section>

      <section className="card">
        <h2>About</h2>
        <div className="kv-grid">
          <div>
            <span className="k">API version</span>
            <span className="v">{health?.version || "—"}</span>
          </div>
          <div>
            <span className="k">Engine</span>
            <span className="v">{settings?.engine_version || health?.engine_version || "—"}</span>
          </div>
          <div>
            <span className="k">Policy</span>
            <span className="v">{settings?.policy_version || "—"}</span>
          </div>
        </div>
        <p className="disclaimer">
          This Mini App never receives wallet keys, service-role secrets, or bot tokens. All
          qualification decisions are made on the server.
        </p>
      </section>

      <section className="card">
        <h2>Supported chains</h2>
        <ul className="list">
          {(settings?.supported_chains || ["solana", "ethereum", "base"]).map((c) => (
            <li key={c} className="list-row">
              <span className="mono">{c}</span>
              <span className="pill pill-neutral">mainnet</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Telegram session</h2>
        <div className="kv-grid">
          <div>
            <span className="k">Inside Telegram</span>
            <span className="v">{isTelegram ? "yes" : "no (browser)"}</span>
          </div>
          <div>
            <span className="k">User</span>
            <span className="v">
              {user ? `${user.first_name || ""} @${user.username || user.id}` : "—"}
            </span>
          </div>
          <div>
            <span className="k">initData</span>
            <span className="v">{initData ? `${initData.slice(0, 24)}…` : "empty"}</span>
          </div>
        </div>
        <p className="muted small">
          Backend must validate initData HMAC before trusting user id. Client does not authorize
          itself.
        </p>
      </section>

      <section className="card">
        <h2>Alert preferences</h2>
        <p className="muted">
          Per-user alert toggles require Supabase + authenticated Telegram user. Public wallet
          activity alerts are independent of token qualification status.
        </p>
      </section>

      {error && <ErrorBox message={error} />}
    </div>
  );
}
