import { NextResponse } from "next/server";
import { fetchKLine } from "@/lib/stock-api/eastmoney";
import stockPool from "@/data/stock-pool.json";
import { logStrategyRun } from "@/modules/signal-engine/audit";
import { buildScanItem } from "@/modules/signal-engine";
import { getActiveStrategy } from "@/modules/signal-engine/registry";
import type { ScanListItem } from "@/modules/signal-engine/types";

const BATCH_SIZE = 5;
const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStockPoolVersion(stocks: Array<{ code: string }>) {
  return `pool:${stocks.length}:${stocks.at(0)?.code ?? "empty"}:${stocks.at(-1)?.code ?? "empty"}`;
}

export async function GET() {
  const startedAt = Date.now();
  const signals: ScanListItem[] = [];
  const stocks = stockPool.stocks;
  const strategy = getActiveStrategy();
  let errorCount = 0;

  for (let index = 0; index < stocks.length; index += BATCH_SIZE) {
    const batch = stocks.slice(index, index + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (stock) => {
        const klines = await fetchKLine(stock.code, 60);
        return buildScanItem(stock.code, stock.name, klines);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        signals.push(result.value);
      } else if (result.status === "rejected") {
        errorCount += 1;
      }
    }

    if (index + BATCH_SIZE < stocks.length) {
      await sleep(DELAY_MS);
    }
  }

  signals.sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return right.tdSetup - left.tdSetup;
  });

  await logStrategyRun({
    strategyId: strategy.id,
    strategyVersion: strategy.version,
    stockPoolVersion: getStockPoolVersion(stocks),
    matchedCount: signals.length,
    sampleCodes: signals.slice(0, 10).map((item) => item.code),
    durationMs: Date.now() - startedAt,
    errorCount,
    notes: {
      batchSize: BATCH_SIZE,
      totalStocks: stocks.length,
    },
  });

  return NextResponse.json(signals);
}
