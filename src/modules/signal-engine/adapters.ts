import type { StockSignal } from "@/lib/stock-api/types";
import type {
  AnalysisSnapshot,
  ScanListItem,
  StockDetailAnalysis,
} from "@/modules/signal-engine/types";

function getChangePercent(closes: number[]): number {
  if (closes.length < 2 || closes[closes.length - 2] === 0) {
    return 0;
  }

  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  return ((last - prev) / prev) * 100;
}

function getSignalType(snapshot: AnalysisSnapshot): StockSignal["signalType"] {
  const { tdSetup, buyCountdown } = snapshot.evaluation.metrics;
  if (buyCountdown >= 13) {
    return "buy_td13";
  }
  if (tdSetup >= 7) {
    return "buy_td9";
  }
  return "sell_mid";
}

function getBollingerPosition(
  price: number | null,
  lower: number | null,
  mid: number | null,
  upper: number | null
): string {
  if (price === null || lower === null || mid === null || upper === null) {
    return "-";
  }
  if (price <= lower) return "Below lower band";
  if (price >= upper) return "Above upper band";
  if (price >= mid) return "Above mid band";
  return "Below mid band";
}

function getTdLabel(tdSetup: number, sellSetup: number): string {
  if (tdSetup > 0) return `买入 ${tdSetup}`;
  if (sellSetup > 0) return `卖出 ${sellSetup}`;
  return "无信号";
}

export function toScanListItem(snapshot: AnalysisSnapshot): ScanListItem | null {
  const { evaluation, klines, code, name } = snapshot;
  if (!evaluation.matched) {
    return null;
  }

  const price = klines.at(-1)?.close ?? 0;
  const changePercent = getChangePercent(klines.map((item) => item.close));

  return {
    code,
    name,
    price,
    changePercent,
    matched: evaluation.matched,
    priority: evaluation.priority,
    strategyId: evaluation.strategyId,
    strategyVersion: evaluation.strategyVersion,
    section: evaluation.displayHints.section,
    highlight: evaluation.displayHints.highlight,
    summary: evaluation.displayHints.summary,
    badges: evaluation.displayHints.badges,
    reasons: evaluation.reasons,
    tdSetup: evaluation.metrics.tdSetup,
    bollingerLower: evaluation.metrics.bollingerLower,
    bollingerMid: evaluation.metrics.bollingerMid,
    bollingerUpper: evaluation.metrics.bollingerUpper,
    distanceToLowerPercent: evaluation.metrics.distanceToLowerPercent,
    signalType: getSignalType(snapshot),
  };
}

export function toLegacyStockSignal(item: ScanListItem): StockSignal {
  return {
    code: item.code,
    name: item.name,
    price: item.price,
    changePercent: item.changePercent,
    tdSetup: item.tdSetup,
    bollingerLower: item.bollingerLower ?? item.price,
    bollingerMid: item.bollingerMid ?? item.price,
    bollingerUpper: item.bollingerUpper ?? item.price,
    signalType: item.signalType,
  };
}

export function toStockDetailAnalysis(snapshot: AnalysisSnapshot): StockDetailAnalysis {
  const { code, name, klines, tdResults, bollinger, evaluation } = snapshot;

  return {
    code,
    name,
    strategyId: evaluation.strategyId,
    strategyVersion: evaluation.strategyVersion,
    currentSignal: {
      matched: evaluation.matched,
      section: evaluation.displayHints.section,
      summary: evaluation.displayHints.summary,
      reasons: evaluation.reasons,
      badges: evaluation.displayHints.badges,
      highlight: evaluation.displayHints.highlight,
    },
    latestMetrics: {
      price: evaluation.metrics.price,
      tdSetup: evaluation.metrics.tdSetup,
      sellSetup: evaluation.metrics.sellSetup,
      buyCountdown: evaluation.metrics.buyCountdown,
      sellCountdown: evaluation.metrics.sellCountdown,
      tdLabel: getTdLabel(evaluation.metrics.tdSetup, evaluation.metrics.sellSetup),
      bollingerPosition: getBollingerPosition(
        evaluation.metrics.price,
        evaluation.metrics.bollingerLower,
        evaluation.metrics.bollingerMid,
        evaluation.metrics.bollingerUpper
      ),
      bollingerLower: evaluation.metrics.bollingerLower,
      bollingerMid: evaluation.metrics.bollingerMid,
      bollingerUpper: evaluation.metrics.bollingerUpper,
    },
    tracking: {
      canTrack: evaluation.entrySignal.canTrack,
      stopLossBase: evaluation.entrySignal.stopLossBase,
      signalDate: evaluation.entrySignal.signalDate,
      entrySignalLabel: evaluation.entrySignal.label,
    },
    chart: {
      klines,
      tdResults,
      bollinger,
    },
  };
}
