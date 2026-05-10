import { NextResponse } from "next/server";
import { fetchKLine } from "@/lib/stock-api/eastmoney";
import { analyzeStock } from "@/lib/indicators/strategy";
import stockPool from "@/data/stock-pool.json";
import type { StockSignal } from "@/lib/stock-api/types";

const BATCH_SIZE = 5;
const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET() {
  const signals: StockSignal[] = [];
  const stocks = stockPool.stocks;

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (stock) => {
        const klines = await fetchKLine(stock.code, 60);
        if (klines.length < 20) return null;

        const analysis = analyzeStock(klines);
        const last = klines.length - 1;

        if (!analysis.latestBollinger) return null;

        const tdSetup = analysis.td[last]?.buySetup ?? 0;
        if (tdSetup < 7) return null;

        const signal: StockSignal = {
          code: stock.code,
          name: stock.name,
          price: klines[last].close,
          changePercent: last > 0
            ? ((klines[last].close - klines[last - 1].close) / klines[last - 1].close) * 100
            : 0,
          tdSetup,
          bollingerLower: analysis.latestBollinger.lower,
          bollingerMid: analysis.latestBollinger.mid,
          bollingerUpper: analysis.latestBollinger.upper,
          signalType: analysis.buySignal ? "buy_td9" : "buy_td9",
        };

        return signal;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        signals.push(r.value);
      }
    }

    if (i + BATCH_SIZE < stocks.length) {
      await sleep(DELAY_MS);
    }
  }

  signals.sort((a, b) => b.tdSetup - a.tdSetup);
  return NextResponse.json(signals);
}
