"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import KLineChart from "@/components/stock/KLineChart";
import type { KLineData, StockQuote } from "@/lib/stock-api/types";
import { calcTDSequential, findLatestBuySetup9 } from "@/lib/indicators/td-sequential";
import { calcBollinger } from "@/lib/indicators/bollinger";
import { createClient } from "@/lib/supabase/client";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [klines, setKlines] = useState<KLineData[]>([]);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [kRes, qRes] = await Promise.all([
          fetch(`/api/stock/kline?code=${code}&days=120`),
          fetch(`/api/stock/quote?code=${code}`),
        ]);
        const kData = await kRes.json();
        const qData = await qRes.json();
        if (Array.isArray(kData)) setKlines(kData);
        if (qData && !qData.error) setQuote(qData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  const tdResults = klines.length > 0 ? calcTDSequential(klines) : [];
  const bollinger =
    klines.length > 0
      ? calcBollinger(klines.map((k) => k.close))
      : { upper: [], mid: [], lower: [] };
  const latestSetup9 = findLatestBuySetup9(tdResults);

  async function handleAddToTracking() {
    if (!quote || !latestSetup9) return;
    setAdding(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    await supabase.from("user_stocks").insert({
      user_id: user.id,
      stock_code: code,
      stock_name: quote.name,
      entry_date: new Date().toISOString().split("T")[0],
      entry_price: quote.price,
      td9_low_price: latestSetup9.td9Low,
      layer_count: 1,
      status: "holding",
    });

    setAdding(false);
    setAdded(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const lastIdx = klines.length - 1;
  const latestTD = tdResults[lastIdx];
  const latestBoll = lastIdx >= 0 && !isNaN(bollinger.mid[lastIdx])
    ? { upper: bollinger.upper[lastIdx], mid: bollinger.mid[lastIdx], lower: bollinger.lower[lastIdx] }
    : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-base">
              {quote?.name ?? code}
            </h1>
            <p className="text-xs text-muted-foreground">{code}</p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {quote && (
        <div className="px-4 py-4">
          <div className="flex items-end gap-3 mb-1">
            <span className="text-3xl font-bold tabular-nums">
              {quote.price.toFixed(2)}
            </span>
            <span
              className={`text-sm font-semibold flex items-center gap-0.5 ${
                quote.changePercent >= 0 ? "text-danger" : "text-success"
              }`}
            >
              {quote.changePercent > 0 && <TrendingUp className="w-4 h-4" />}
              {quote.changePercent < 0 && <TrendingDown className="w-4 h-4" />}
              {quote.changePercent === 0 && <Minus className="w-4 h-4" />}
              {quote.changePercent >= 0 ? "+" : ""}
              {quote.changePercent.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mt-3">
            <div>
              <p>开盘</p>
              <p className="font-medium text-foreground">{quote.open.toFixed(2)}</p>
            </div>
            <div>
              <p>最高</p>
              <p className="font-medium text-danger">{quote.high.toFixed(2)}</p>
            </div>
            <div>
              <p>最低</p>
              <p className="font-medium text-success">{quote.low.toFixed(2)}</p>
            </div>
            <div>
              <p>昨收</p>
              <p className="font-medium text-foreground">{quote.prevClose.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {klines.length > 0 && (
        <div className="px-2">
          <KLineChart
            klines={klines}
            bollinger={bollinger}
            tdResults={tdResults}
          />
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        <h2 className="text-sm font-semibold">策略指标</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">九转序列</p>
            <p className="text-lg font-bold">
              {latestTD
                ? latestTD.buySetup > 0
                  ? `买入 ${latestTD.buySetup}`
                  : latestTD.sellSetup > 0
                    ? `卖出 ${latestTD.sellSetup}`
                    : "无信号"
                : "-"}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">布林位置</p>
            {latestBoll && quote ? (
              <p className="text-lg font-bold">
                {quote.price <= latestBoll.lower
                  ? "下轨以下"
                  : quote.price >= latestBoll.upper
                    ? "上轨以上"
                    : quote.price >= latestBoll.mid
                      ? "中轨上方"
                      : "中轨下方"}
              </p>
            ) : (
              <p className="text-lg font-bold">-</p>
            )}
          </div>
        </div>

        {latestBoll && (
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-2">布林带</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-warning">上轨</p>
                <p className="font-medium">{latestBoll.upper.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-primary">中轨</p>
                <p className="font-medium">{latestBoll.mid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-success">下轨</p>
                <p className="font-medium">{latestBoll.lower.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {latestSetup9 && (
          <div className="bg-card rounded-xl p-3 border border-danger/30">
            <p className="text-xs text-muted-foreground mb-1">止损基准线 (九转9最低价)</p>
            <p className="text-lg font-bold text-danger">
              {latestSetup9.td9Low.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleAddToTracking}
          disabled={adding || added || !latestSetup9}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            added
              ? "bg-success/10 text-success"
              : !latestSetup9
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
          }`}
        >
          {adding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : added ? (
            "已加入自选"
          ) : !latestSetup9 ? (
            "暂无九转9信号，无法加入"
          ) : (
            <>
              <Plus className="w-5 h-5" />
              加入自选 (止损线: {latestSetup9.td9Low.toFixed(2)})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
