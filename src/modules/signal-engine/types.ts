import type { KLineData } from "@/lib/stock-api/types";
import type { BollingerResult } from "@/lib/indicators/bollinger";
import type { TDResult } from "@/lib/indicators/td-sequential";

export type SignalSection = "td9" | "pending" | "other";

export interface RuleInput {
  code: string;
  name: string;
  klines: KLineData[];
  tdResults: TDResult[];
  bollinger: BollingerResult;
}

export interface DisplayBadge {
  text: string;
  tone: "danger" | "warning" | "neutral" | "success";
}

export interface StrategyMetrics {
  price: number | null;
  tdSetup: number;
  sellSetup: number;
  buyCountdown: number;
  sellCountdown: number;
  bollingerLower: number | null;
  bollingerMid: number | null;
  bollingerUpper: number | null;
  distanceToLowerPercent: number | null;
  latestSetup9Low: number | null;
  latestSetup9Date: string | null;
}

export interface DisplayHints {
  section: SignalSection;
  highlight: boolean;
  summary: string;
  badges: DisplayBadge[];
}

export interface EntrySignalInfo {
  canTrack: boolean;
  stopLossBase: number | null;
  signalDate: string | null;
  label: string | null;
}

export interface StrategyEvaluation {
  matched: boolean;
  strategyId: string;
  strategyVersion: string;
  priority: number;
  reasons: string[];
  metrics: StrategyMetrics;
  displayHints: DisplayHints;
  entrySignal: EntrySignalInfo;
}

export interface AnalysisSnapshot {
  code: string;
  name: string;
  klines: KLineData[];
  tdResults: TDResult[];
  bollinger: BollingerResult;
  evaluation: StrategyEvaluation;
}

export interface ScanStrategy {
  id: string;
  version: string;
  evaluate(input: RuleInput): StrategyEvaluation;
}

export interface ScanListItem {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  matched: boolean;
  priority: number;
  strategyId: string;
  strategyVersion: string;
  section: SignalSection;
  highlight: boolean;
  summary: string;
  badges: DisplayBadge[];
  reasons: string[];
  tdSetup: number;
  bollingerLower: number | null;
  bollingerMid: number | null;
  bollingerUpper: number | null;
  distanceToLowerPercent: number | null;
  signalType: "buy_td9" | "buy_td13" | "sell_mid" | "sell_upper";
}

export interface StockDetailAnalysis {
  code: string;
  name: string;
  strategyId: string;
  strategyVersion: string;
  currentSignal: {
    matched: boolean;
    section: SignalSection;
    summary: string;
    reasons: string[];
    badges: DisplayBadge[];
    highlight: boolean;
  };
  latestMetrics: {
    price: number | null;
    tdSetup: number;
    sellSetup: number;
    buyCountdown: number;
    sellCountdown: number;
    tdLabel: string;
    bollingerPosition: string;
    bollingerLower: number | null;
    bollingerMid: number | null;
    bollingerUpper: number | null;
  };
  tracking: {
    canTrack: boolean;
    stopLossBase: number | null;
    signalDate: string | null;
    entrySignalLabel: string | null;
  };
  chart: {
    klines: KLineData[];
    tdResults: TDResult[];
    bollinger: BollingerResult;
  };
}

export interface StrategyRunRecord {
  strategyId: string;
  strategyVersion: string;
  stockPoolVersion: string;
  matchedCount: number;
  sampleCodes: string[];
  durationMs: number;
  errorCount: number;
  notes?: Record<string, unknown>;
  runAt?: string;
}
