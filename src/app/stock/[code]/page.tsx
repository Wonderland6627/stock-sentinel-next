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
import type { StockQuote } from "@/lib/stock-api/types";
import { createClient } from "@/lib/supabase/client";
import type { StockDetailAnalysis } from "@/modules/signal-engine/types";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [analysis, setAnalysis] = useState<StockDetailAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [analysisRes, quoteRes] = await Promise.all([
          fetch(`/api/stock/analyze?code=${code}`),
          fetch(`/api/stock/quote?code=${code}`),
        ]);

        const analysisData = await analysisRes.json();
        const quoteData = await quoteRes.json();

        if (analysisData && !analysisData.error) {
          setAnalysis(analysisData);
        }

        if (quoteData && !quoteData.error) {
          setQuote(quoteData);
        }
      } catch {
        // The page can still render partial stock data when one request fails.
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [code]);

  async function handleAddToTracking() {
    if (
      !quote ||
      !analysis?.tracking.canTrack ||
      analysis.tracking.stopLossBase === null
    ) {
      return;
    }

    setAdding(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdding(false);
      router.push("/login");
      return;
    }

    await supabase.from("user_stocks").insert({
      user_id: user.id,
      stock_code: code,
      stock_name: quote.name,
      entry_date: new Date().toISOString().split("T")[0],
      entry_price: quote.price,
      td9_low_price: analysis.tracking.stopLossBase,
      strategy_id: analysis.strategyId,
      strategy_version: analysis.strategyVersion,
      signal_date: analysis.tracking.signalDate,
      entry_signal_label: analysis.tracking.entrySignalLabel,
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

  const latestMetrics = analysis?.latestMetrics ?? null;
  const tracking = analysis?.tracking ?? null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-base">{quote?.name ?? code}</h1>
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
              <p className="font-medium text-foreground">
                {quote.prevClose.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="px-2">
          <KLineChart
            klines={analysis.chart.klines}
            bollinger={analysis.chart.bollinger}
            tdResults={analysis.chart.tdResults}
          />
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        <h2 className="text-sm font-semibold">策略指标</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">TD 序列</p>
            <p className="text-lg font-bold">{latestMetrics?.tdLabel ?? "-"}</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">布林位置</p>
            <p className="text-lg font-bold">
              {latestMetrics?.bollingerPosition ?? "-"}
            </p>
          </div>
        </div>

        {latestMetrics && latestMetrics.bollingerLower !== null && (
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-2">布林带</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-warning">上轨</p>
                <p className="font-medium">
                  {latestMetrics.bollingerUpper?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-primary">中轨</p>
                <p className="font-medium">
                  {latestMetrics.bollingerMid?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-success">下轨</p>
                <p className="font-medium">
                  {latestMetrics.bollingerLower?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {tracking && tracking.stopLossBase !== null && (
          <div className="bg-card rounded-xl p-3 border border-danger/30">
            <p className="text-xs text-muted-foreground mb-1">
              止损基准线（{tracking.entrySignalLabel ?? "策略输出"}）
            </p>
            <p className="text-lg font-bold text-danger">
              {tracking.stopLossBase.toFixed(2)}
            </p>
            {tracking.signalDate && (
              <p className="text-xs text-muted-foreground mt-1">
                信号日期: {tracking.signalDate}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleAddToTracking}
          disabled={adding || added || !tracking?.canTrack}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            added
              ? "bg-success/10 text-success"
              : !tracking?.canTrack
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
          }`}
        >
          {adding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : added ? (
            "已加入自选"
          ) : !tracking?.canTrack ? (
            "暂无 TD9 信号，无法加入"
          ) : (
            <>
              <Plus className="w-5 h-5" />
              加入自选（止损线 {tracking.stopLossBase?.toFixed(2)}）
            </>
          )}
        </button>
      </div>
    </div>
  );
}
