export interface BollingerResult {
  upper: number[];
  mid: number[];
  lower: number[];
}

/**
 * 布林线 (Bollinger Bands) 计算
 *
 * 中轨 = N 日 SMA
 * 上轨 = 中轨 + K × 标准差
 * 下轨 = 中轨 - K × 标准差
 */
export function calcBollinger(
  closes: number[],
  period = 20,
  multiplier = 2
): BollingerResult {
  const upper: number[] = [];
  const mid: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      mid.push(NaN);
      lower.push(NaN);
      continue;
    }

    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance =
      slice.reduce((sum, v) => sum + (v - sma) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    mid.push(sma);
    upper.push(sma + multiplier * stdDev);
    lower.push(sma - multiplier * stdDev);
  }

  return { upper, mid, lower };
}
