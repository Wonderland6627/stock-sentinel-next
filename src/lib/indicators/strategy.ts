import type { KLineData } from "@/lib/stock-api/types";
import { calcTDSequential, type TDResult } from "./td-sequential";
import { calcBollinger, type BollingerResult } from "./bollinger";

export interface StrategyAnalysis {
  td: TDResult[];
  bollinger: BollingerResult;
  buySignal: boolean;
  latestTD: TDResult | null;
  latestBollinger: { upper: number; mid: number; lower: number } | null;
}

export function analyzeStock(klines: KLineData[]): StrategyAnalysis {
  const td = calcTDSequential(klines);
  const closes = klines.map((k) => k.close);
  const bollinger = calcBollinger(closes);

  const last = klines.length - 1;
  const latestTD = td[last] ?? null;
  const latestBollinger =
    last >= 0 && !isNaN(bollinger.upper[last])
      ? {
          upper: bollinger.upper[last],
          mid: bollinger.mid[last],
          lower: bollinger.lower[last],
        }
      : null;

  const buySignal =
    latestTD !== null &&
    latestBollinger !== null &&
    latestTD.buySetup === 9 &&
    latestTD.close <= latestBollinger.lower;

  return { td, bollinger, buySignal, latestTD, latestBollinger };
}

export function isBuySignal(
  tdSetup: number,
  close: number,
  lowerBand: number
): boolean {
  return tdSetup === 9 && close <= lowerBand;
}

export function isAddPositionSignal(
  tdSetup: number,
  tdCountdown: number,
  close: number,
  lowerBand: number,
  td9Low: number
): boolean {
  if (close <= td9Low) return false;
  return (tdSetup === 9 || tdCountdown === 13) && close <= lowerBand;
}

export type SellReason = "touch_mid" | "touch_upper" | "td9_clear" | "ma5_break";

export function checkSellSignals(
  close: number,
  midBand: number,
  upperBand: number,
  tdSellSetup: number,
  ma5: number
): SellReason[] {
  const signals: SellReason[] = [];
  if (close >= upperBand) signals.push("touch_upper");
  else if (close >= midBand) signals.push("touch_mid");
  if (tdSellSetup === 9) signals.push("td9_clear");
  if (close < ma5) signals.push("ma5_break");
  return signals;
}

export function calcMA(closes: number[], period: number): number[] {
  return closes.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}
