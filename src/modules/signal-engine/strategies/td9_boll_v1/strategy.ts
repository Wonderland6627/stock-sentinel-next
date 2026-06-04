import { findLatestBuySetup9 } from "@/lib/indicators/td-sequential";
import type {
  DisplayBadge,
  EntrySignalInfo,
  RuleInput,
  ScanStrategy,
  StrategyEvaluation,
} from "@/modules/signal-engine/types";

const STRATEGY_ID = "td9_boll_v1";
const STRATEGY_VERSION = "1.0.0";

function toFixedNumber(value: number | null): number | null {
  return value === null ? null : Number(value.toFixed(4));
}

function createBadges(tdSetup: number, isNearLower: boolean): DisplayBadge[] {
  const badges: DisplayBadge[] = [];

  if (tdSetup === 9) {
    badges.push({ text: "TD9", tone: "danger" });
  } else if (tdSetup >= 7) {
    badges.push({ text: `TD${tdSetup}`, tone: "warning" });
  }

  if (isNearLower) {
    badges.push({ text: "Near lower band", tone: "success" });
  }

  return badges;
}

function createEntrySignal(
  signalDate: string | null,
  stopLossBase: number | null
): EntrySignalInfo {
  const canTrack = stopLossBase !== null;
  return {
    canTrack,
    stopLossBase,
    signalDate,
    label: canTrack ? "TD9 low stop base" : null,
  };
}

function createEmptyEvaluation(
  price: number | null,
  reason: string,
  summary: string
): StrategyEvaluation {
  return {
    matched: false,
    strategyId: STRATEGY_ID,
    strategyVersion: STRATEGY_VERSION,
    priority: 0,
    reasons: [reason],
    metrics: {
      price,
      tdSetup: 0,
      sellSetup: 0,
      buyCountdown: 0,
      sellCountdown: 0,
      bollingerLower: null,
      bollingerMid: null,
      bollingerUpper: null,
      distanceToLowerPercent: null,
      latestSetup9Low: null,
      latestSetup9Date: null,
    },
    displayHints: {
      section: "other",
      highlight: false,
      summary,
      badges: [],
    },
    entrySignal: createEntrySignal(null, null),
  };
}

export const td9BollV1Strategy: ScanStrategy = {
  id: STRATEGY_ID,
  version: STRATEGY_VERSION,
  evaluate(input: RuleInput): StrategyEvaluation {
    const { klines, tdResults, bollinger } = input;

    if (klines.length < 20) {
      return createEmptyEvaluation(
        klines.at(-1)?.close ?? null,
        "insufficient_kline_history",
        "Not enough kline history for this strategy"
      );
    }

    const last = klines.length - 1;
    const latestKline = klines[last];
    const latestTD = tdResults[last];
    const latestLower = Number.isNaN(bollinger.lower[last])
      ? null
      : bollinger.lower[last];
    const latestMid = Number.isNaN(bollinger.mid[last]) ? null : bollinger.mid[last];
    const latestUpper = Number.isNaN(bollinger.upper[last])
      ? null
      : bollinger.upper[last];
    const latestSetup9 = findLatestBuySetup9(tdResults);

    const tdSetup = latestTD?.buySetup ?? 0;
    const sellSetup = latestTD?.sellSetup ?? 0;
    const buyCountdown = latestTD?.buyCountdown ?? 0;
    const sellCountdown = latestTD?.sellCountdown ?? 0;
    const distanceToLowerPercent =
      latestLower !== null && latestLower > 0
        ? ((latestKline.close - latestLower) / latestLower) * 100
        : null;
    const isNearLower = latestLower !== null && latestKline.close <= latestLower * 1.02;
    const matched = tdSetup >= 7 && latestLower !== null;

    const reasons =
      tdSetup === 9
        ? ["td_setup_9", isNearLower ? "near_lower_band" : "awaiting_confirmation"]
        : tdSetup >= 7
          ? [`td_setup_${tdSetup}`, "pending_setup"]
          : ["td_setup_below_threshold"];

    const priority =
      tdSetup === 9 && isNearLower
        ? 100
        : tdSetup === 9
          ? 90
          : tdSetup === 8
            ? 80
            : tdSetup === 7
              ? 70
              : 0;

    const summary =
      tdSetup === 9
        ? isNearLower
          ? "TD9 is near the lower Bollinger band"
          : "TD9 appeared, waiting for stronger confirmation"
        : tdSetup >= 7
          ? `TD setup ${tdSetup} is forming`
          : "Current setup is outside the watch zone";

    return {
      matched,
      strategyId: STRATEGY_ID,
      strategyVersion: STRATEGY_VERSION,
      priority,
      reasons,
      metrics: {
        price: latestKline.close,
        tdSetup,
        sellSetup,
        buyCountdown,
        sellCountdown,
        bollingerLower: toFixedNumber(latestLower),
        bollingerMid: toFixedNumber(latestMid),
        bollingerUpper: toFixedNumber(latestUpper),
        distanceToLowerPercent: toFixedNumber(distanceToLowerPercent),
        latestSetup9Low: latestSetup9 ? toFixedNumber(latestSetup9.td9Low) : null,
        latestSetup9Date: latestSetup9
          ? tdResults[latestSetup9.index]?.date ?? null
          : null,
      },
      displayHints: {
        section: tdSetup === 9 ? "td9" : tdSetup >= 7 ? "pending" : "other",
        highlight: tdSetup === 9 && isNearLower,
        summary,
        badges: createBadges(tdSetup, isNearLower),
      },
      entrySignal: createEntrySignal(
        latestSetup9 ? tdResults[latestSetup9.index]?.date ?? null : null,
        latestSetup9 ? latestSetup9.td9Low : null
      ),
    };
  },
};
