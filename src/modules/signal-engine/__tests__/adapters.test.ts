import { describe, expect, it } from "vitest";
import type { KLineData } from "@/lib/stock-api/types";
import { analyzeStockDetail, analyzeStockSnapshot } from "@/modules/signal-engine";
import { toLegacyStockSignal, toScanListItem } from "@/modules/signal-engine/adapters";

function buildKlines(closes: number[]): KLineData[] {
  return closes.map((close, index) => ({
    date: `2026-02-${String(index + 1).padStart(2, "0")}`,
    open: close + 0.5,
    close,
    high: close + 1,
    low: close - 1,
    volume: 2000 + index,
    turnover: 20000 + index,
  }));
}

const matchedKlines = buildKlines([
  20, 21, 20, 21, 20, 21, 20, 21, 20, 21, 20,
  19, 18, 17, 16, 15, 14, 13, 12, 11,
]);

describe("signal engine adapters", () => {
  it("maps a matched snapshot into a scan list item and legacy stock signal", () => {
    const snapshot = analyzeStockSnapshot("sh600036", "招商银行", matchedKlines);
    const item = toScanListItem(snapshot);

    expect(item).not.toBeNull();
    expect(item?.strategyId).toBe("td9_boll_v1");
    expect(item?.tdSetup).toBe(9);
    expect(item?.summary).toBeTruthy();

    const legacy = toLegacyStockSignal(item!);
    expect(legacy.code).toBe("sh600036");
    expect(legacy.name).toBe("招商银行");
    expect(legacy.tdSetup).toBe(9);
    expect(legacy.bollingerLower).toBe(item?.bollingerLower);
  });

  it("builds detail analysis with stable tracking fields from the strategy output", () => {
    const detail = analyzeStockDetail("sh600036", "招商银行", matchedKlines);

    expect(detail.strategyId).toBe("td9_boll_v1");
    expect(detail.currentSignal.matched).toBe(true);
    expect(detail.latestMetrics.tdLabel).toBe("买入 9");
    expect(detail.tracking.canTrack).toBe(true);
    expect(detail.tracking.stopLossBase).toBe(10);
    expect(detail.tracking.signalDate).toBe("2026-02-20");
    expect(detail.chart.klines).toHaveLength(20);
  });
});
