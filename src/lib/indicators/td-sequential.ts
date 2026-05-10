import type { KLineData } from "@/lib/stock-api/types";

export interface TDResult {
  date: string;
  buySetup: number;
  sellSetup: number;
  buyCountdown: number;
  sellCountdown: number;
  close: number;
  low: number;
  high: number;
}

/**
 * TD Sequential (九转序列) 计算
 *
 * Setup 阶段：连续 9 根 K 线的 close 与其前第 4 根 K 线的 close 比较
 *   - 买入 Setup: close < close[i-4]，连续 9 次计数到 9
 *   - 卖出 Setup: close > close[i-4]，连续 9 次计数到 9
 *
 * Countdown 阶段：在 Setup=9 完成后激活
 *   - 买入 Countdown: close <= low[i-2]，非连续计数到 13
 *   - 卖出 Countdown: close >= high[i-2]，非连续计数到 13
 */
export function calcTDSequential(klines: KLineData[]): TDResult[] {
  const results: TDResult[] = klines.map((k) => ({
    date: k.date,
    buySetup: 0,
    sellSetup: 0,
    buyCountdown: 0,
    sellCountdown: 0,
    close: k.close,
    low: k.low,
    high: k.high,
  }));

  let buySetupCount = 0;
  let sellSetupCount = 0;
  let buyCountdownCount = 0;
  let sellCountdownCount = 0;
  let buyCountdownActive = false;
  let sellCountdownActive = false;

  for (let i = 4; i < klines.length; i++) {
    const cur = klines[i];
    const ref = klines[i - 4];

    // Buy Setup
    if (cur.close < ref.close) {
      buySetupCount++;
      sellSetupCount = 0;
      if (sellCountdownActive) {
        sellCountdownActive = false;
        sellCountdownCount = 0;
      }
    }
    // Sell Setup
    else if (cur.close > ref.close) {
      sellSetupCount++;
      buySetupCount = 0;
      if (buyCountdownActive) {
        buyCountdownActive = false;
        buyCountdownCount = 0;
      }
    } else {
      buySetupCount = 0;
      sellSetupCount = 0;
    }

    results[i].buySetup = buySetupCount > 0 ? buySetupCount : 0;
    results[i].sellSetup = sellSetupCount > 0 ? sellSetupCount : 0;

    if (buySetupCount === 9) {
      buyCountdownActive = true;
      buyCountdownCount = 0;
    }
    if (sellSetupCount === 9) {
      sellCountdownActive = true;
      sellCountdownCount = 0;
    }

    // Buy Countdown
    if (buyCountdownActive && i >= 2) {
      if (cur.close <= klines[i - 2].low) {
        buyCountdownCount++;
        results[i].buyCountdown = buyCountdownCount;
        if (buyCountdownCount >= 13) {
          buyCountdownActive = false;
          buyCountdownCount = 0;
        }
      }
    }

    // Sell Countdown
    if (sellCountdownActive && i >= 2) {
      if (cur.close >= klines[i - 2].high) {
        sellCountdownCount++;
        results[i].sellCountdown = sellCountdownCount;
        if (sellCountdownCount >= 13) {
          sellCountdownActive = false;
          sellCountdownCount = 0;
        }
      }
    }
  }

  return results;
}

export function findLatestBuySetup9(
  results: TDResult[]
): { index: number; td9Low: number } | null {
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].buySetup === 9) {
      return { index: i, td9Low: results[i].low };
    }
  }
  return null;
}
