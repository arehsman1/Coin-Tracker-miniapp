/**
 * Backend API client.
 * Never sends or stores service-role keys, bot tokens, or provider secrets.
 * Base URL: VITE_API_BASE_URL or same-origin (Vite proxy in dev).
 */

import type {
  DiscoverySummary,
  EvaluateResponse,
  ProviderHealth,
  ScannerStatus,
  TokenRow,
  TrackedWalletRow,
  WalletDetailResponse,
  WalletPerformance,
  WalletTxRow,
} from "../types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.message || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; version: string; engine_version: string }>("/health"),

  ready: () =>
    request<{ ready: boolean; checks: Record<string, boolean>; storage?: string }>("/ready"),

  chains: () =>
    request<{ chains: { id: string; name: string; enabled: boolean }[] }>("/api/v1/chains"),

  publicSettings: () =>
    request<{
      supported_chains: string[];
      engine_version: string;
      policy_version: string;
      live_trading: boolean;
    }>("/api/v1/settings/public"),

  scannerStatus: () => request<ScannerStatus>("/api/v1/scanner/status"),

  providersHealth: () =>
    request<{ providers: ProviderHealth[] }>("/api/v1/providers/health"),

  listTokens: (params?: { status?: string; chain?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.chain) q.set("chain", params.chain);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{ items: TokenRow[]; total: number; storage: string }>(
      `/api/v1/tokens${qs ? `?${qs}` : ""}`
    );
  },

  getToken: (chain: string, address: string) =>
    request<Record<string, unknown>>(`/api/v1/tokens/${chain}/${encodeURIComponent(address)}`),

  evaluate: (chain: string, address: string, persist = true) =>
    request<EvaluateResponse>("/api/v1/tokens/evaluate", {
      method: "POST",
      body: JSON.stringify({ chain, address, persist }),
    }),

  enqueueEvaluate: (chain: string, address: string) =>
    request<{ job_id: string; status: string }>("/api/v1/jobs/evaluate", {
      method: "POST",
      body: JSON.stringify({ chain, address }),
    }),

  runDiscovery: (chains?: string[], max_per_chain = 8) =>
    request<DiscoverySummary>("/api/v1/discovery/run", {
      method: "POST",
      body: JSON.stringify({ chains: chains ?? null, max_per_chain }),
    }),

  lastDiscovery: () =>
    request<{ last: DiscoverySummary | null; storage: string }>("/api/v1/discovery/last"),

  outcomes: (evaluationId?: string) => {
    const q = evaluationId ? `?evaluation_id=${encodeURIComponent(evaluationId)}` : "";
    return request<{ items: unknown[]; storage: string }>(`/api/v1/outcomes${q}`);
  },

  // --- Wallet Intelligence (public tracking; no personal wallet required) ---

  listWallets: (params?: { chain?: string; active_only?: boolean; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.chain) q.set("chain", params.chain);
    if (params?.active_only === false) q.set("active_only", "false");
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{ wallets: TrackedWalletRow[]; count: number; storage: string }>(
      `/api/v1/wallets${qs ? `?${qs}` : ""}`
    );
  },

  getWallet: (chain: string, address: string) =>
    request<WalletDetailResponse>(
      `/api/v1/wallets/${chain}/${encodeURIComponent(address)}`
    ),

  listWalletTransactions: (
    chain: string,
    address: string,
    params?: { significant_only?: boolean; limit?: number }
  ) => {
    const q = new URLSearchParams();
    if (params?.significant_only) q.set("significant_only", "true");
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{ transactions: WalletTxRow[]; count: number; storage: string }>(
      `/api/v1/wallets/${chain}/${encodeURIComponent(address)}/transactions${qs ? `?${qs}` : ""}`
    );
  },

  trackWallet: (body: {
    chain: string;
    address: string;
    label?: string;
    source?: string;
    notes?: string;
    significant_swap_usd_threshold?: number;
  }) =>
    request<{ ok: boolean; wallet: TrackedWalletRow; storage: string }>(
      "/api/v1/wallets/track",
      { method: "POST", body: JSON.stringify(body) }
    ),

  untrackWallet: (chain: string, address: string) =>
    request<{ ok: boolean; storage: string }>(
      `/api/v1/wallets/untrack?chain=${encodeURIComponent(chain)}&address=${encodeURIComponent(address)}`,
      { method: "POST" }
    ),

  getWalletPerformance: (chain: string, address: string) =>
    request<{ storage: string; performance: WalletPerformance }>(
      `/api/v1/wallets/${chain}/${encodeURIComponent(address)}/performance`
    ),

  monitoringStatus: () =>
    request<{
      storage: string;
      db_available?: boolean;
      job_failure_tracker?: { tracked_failures: number; exhausted: number };
      wallet_performance_snapshots_cached?: number;
      outcomes?: Record<string, number | null | undefined>;
      safety?: Record<string, boolean>;
      note?: string;
    }>("/api/v1/monitoring/status"),
};
