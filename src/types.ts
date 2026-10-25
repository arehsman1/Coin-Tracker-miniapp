export type ChainId = "solana" | "ethereum" | "base";

export type QualificationStatus =
  | "REJECTED_CRITICAL_RISK"
  | "PENDING_DATA_INCOMPLETE"
  | "MONITOR_NOT_YET_QUALIFIED"
  | "SECURITY_QUALIFIED_NO_TRADE_SIGNAL"
  | "QUALIFIED_TRADE_CANDIDATE"
  | "QUALIFICATION_REVOKED";

export interface TokenRow {
  id?: string;
  chain: string;
  address: string;
  name?: string | null;
  symbol?: string | null;
  current_status?: string | null;
  updated_at?: string;
  discovered_at?: string;
  current_evaluation_id?: string;
}

export interface EvaluateResponse {
  evaluation_id: string;
  chain: string;
  token_address: string;
  final_status: string;
  status_label: string;
  security_risk_score: number;
  manipulation_risk_score: number;
  trade_quality_score: number;
  data_confidence_score: number;
  reasons: string[];
  missing_evidence: string[];
  policy_version: string;
  engine_version: string;
  evaluated_at: string;
  name?: string | null;
  symbol?: string | null;
  persisted?: boolean;
  storage?: string;
  token_id?: string;
  limitations_note?: string;
}

export interface ScannerStatus {
  desired: Record<string, string>;
  actual: {
    service: string;
    reason?: string;
    chains: Record<string, string>;
  };
  health: string;
  storage?: string;
  db_available?: boolean;
  note?: string;
}

export interface ProviderHealth {
  name: string;
  health: string;
  ping_ok?: boolean;
  ping_error?: string | null;
  latency_ms?: number | null;
  last_success?: string | null;
  capabilities?: string[];
  chains?: string[];
}

export interface DiscoverySummary {
  ok?: boolean;
  scanned_pairs?: number;
  candidates?: number;
  enqueued?: string[];
  skipped_known?: number;
  skipped_ignored?: number;
  errors?: string[];
  started_at?: string;
  finished_at?: string;
  storage?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  REJECTED_CRITICAL_RISK: "Rejected — Critical Risk",
  PENDING_DATA_INCOMPLETE: "Pending — Data Incomplete",
  MONITOR_NOT_YET_QUALIFIED: "Monitor — Not Yet Qualified",
  SECURITY_QUALIFIED_NO_TRADE_SIGNAL: "Security OK — No Trade Signal",
  QUALIFIED_TRADE_CANDIDATE: "Qualified — Trade Candidate",
  QUALIFICATION_REVOKED: "Qualification Revoked",
};

export const STATUS_CLASS: Record<string, string> = {
  REJECTED_CRITICAL_RISK: "status-rejected",
  PENDING_DATA_INCOMPLETE: "status-pending",
  MONITOR_NOT_YET_QUALIFIED: "status-monitor",
  SECURITY_QUALIFIED_NO_TRADE_SIGNAL: "status-secure",
  QUALIFIED_TRADE_CANDIDATE: "status-qualified",
  QUALIFICATION_REVOKED: "status-revoked",
};

export type WalletEventType =
  | "SWAP_BUY"
  | "SWAP_SELL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "LIQUIDITY_ADD"
  | "LIQUIDITY_REMOVE"
  | "CONTRACT_INTERACTION"
  | "FAILED"
  | "UNKNOWN";

export interface TrackedWalletRow {
  id?: string | null;
  chain: string;
  address: string;
  label?: string | null;
  source?: string;
  tags?: string[];
  is_active?: boolean;
  significant_swap_usd_threshold?: number | null;
  last_activity_at?: string | null;
  notes?: string | null;
}

export interface WalletTxRow {
  id?: string | null;
  tx_signature: string;
  event_type: string;
  token_address?: string | null;
  amount_ui?: number | null;
  value_usd?: number | null;
  value_usd_status?: string;
  is_significant?: boolean;
  block_time?: string | null;
  counterparty?: string | null;
  dex_or_protocol?: string | null;
  provider?: string | null;
}

export interface WalletProfileSummary {
  observed_trade_count?: number;
  observed_significant_count?: number;
  data_completeness_score?: number;
  confidence_score?: number;
  first_observed_at?: string | null;
  last_observed_at?: string | null;
}

export interface WalletDetailResponse {
  storage?: string;
  tracked?: TrackedWalletRow | null;
  profile?: WalletProfileSummary | null;
  recent_transactions?: WalletTxRow[];
  note?: string;
}

export interface WalletPerformance {
  chain?: string;
  wallet_address?: string;
  observed_trade_count?: number;
  closed_trade_count?: number;
  win_count?: number;
  loss_count?: number;
  win_rate?: number | null;
  realized_pnl_usd?: number | null;
  realized_pnl_status?: string;
  sample_size?: number;
  data_completeness_score?: number;
  confidence_score?: number;
  observation_period_start?: string | null;
  observation_period_end?: string | null;
  limitations?: string[];
  scoring_rule_version?: string;
  components?: Record<string, number>;
  open_positions?: {
    token_address: string;
    qty_open: number;
    cost_basis_status: string;
    realized_pnl_usd: number;
    realized_pnl_status: string;
    buy_count: number;
    sell_count: number;
  }[];
  disclaimer?: string;
}
