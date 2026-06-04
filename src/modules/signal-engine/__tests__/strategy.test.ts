import { describe, expect, it } from "vitest";
import { calcBollinger } from "@/lib/indicators/bollinger";
import { calcTDSequential } from "@/lib/indicators/td-sequential";
import type { KLineData } from "@/lib/stock-api/types";
import { td9BollV1Strategy } from "@/modules/signal-engine/strategies/td9_boll_v1/strategy";
import type { RuleInput } from "@/modules/signal-engine/types";

function buildKlines(closes: number[]): KLineData[] {
  return closes.map((close, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, "0")}`,
    open: close + 0.5,
    close,
    high: close + 1,
    low: close - 1,
    volume: 1000 + index,
    turnover: 10000 + index,
  }));
}

function buildInput(code: string, name: string, closes: number[]): RuleInput {
  const klines = buildKlines(closes);
  return {
    code,
    name,
    klines,
    tdResults: calcTDSequential(klines),
    bollinger: calcBollinger(closes),
  };
}

describe("td9_boll_v1 strategy", () => {
  it("returns a stable evaluation for a matched td9 scenario", () => {
    const input = buildInput("sh600001", "测试股票", [
      20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20,
      19, 18, 17, 16, 15, 14, 13, 12, 11,
    ]);

    const evaluation = td9BollV1Strategy.evaluate(input);

    expect(evaluation.matched).toBe(true);
    expect(evaluation.strategyId).toBe("td9_boll_v1");
    expect(evaluation.strategyVersion).toBe("1.0.0");
    expect(evaluation.metrics.tdSetup).toBe(9);
    expect(evaluation.entrySignal.canTrack).toBe(true);
    expect(evaluation.entrySignal.stopLossBase).toBe(10);
    expect(evaluation.entrySignal.signalDate).toBe("2026-01-20");
    expect(evaluation.displayHints.section).toBe("td9");
  });

  it("returns an unmatched evaluation when setup threshold is not reached", () => {
    const input = buildInput("sz000001", "平稳股票", [
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    ]);

    const evaluation = td9BollV1Strategy.evaluate(input);

    expect(evaluation.matched).toBe(false);
    expect(evaluation.metrics.tdSetup).toBe(0);
    expect(evaluation.entrySignal.canTrack).toBe(false);
    expect(evaluation.displayHints.section).toBe("other");
  });

  it("returns a data-insufficient evaluation when kline history is too short", () => {
    const input = buildInput("hk000001", "样本不足", [10, 10, 11, 11, 10, 10, 11, 11, 10, 10]);

    const evaluation = td9BollV1Strategy.evaluate(input);

    expect(evaluation.matched).toBe(false);
    expect(evaluation.reasons).toContain("insufficient_kline_history");
    expect(evaluation.metrics.bollingerLower).toBeNull();
    expect(evaluation.entrySignal.canTrack).toBe(false);
  });
});
