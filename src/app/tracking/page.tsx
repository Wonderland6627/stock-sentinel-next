"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserStock } from "@/lib/supabase/types";
import type { StockQuote } from "@/lib/stock-api/types";
import AddStockModal from "@/components/tracking/AddStockModal";
import SellActionModal from "@/components/tracking/SellActionModal";

export default function TrackingPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<UserStock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sellTarget, setSellTarget] = useState<UserStock | null>(null);
  const [tab, setTab] = useState<"holding" | "history">("holding");

  const loadStocks = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("user_stocks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setStocks(data as UserStock[]);
    setLoading(false);
  }, [router]);

  const loadQuotes = useCallback(async () => {
    const holdingStocks = stocks.filter((s) => s.status === "holding");
    if (holdingStocks.length === 0) return;

    const results = await Promise.allSettled(
      holdingStocks.map(async (s) => {
        const res = await fetch(`/api/stock/quote?code=${s.stock_code}`);
        if (!res.ok) return null;
        return res.json() as Promise<StockQuote>;
      })
    );

    const newQuotes: Record<string, StockQuote> = {};
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value) {
        newQuotes[r.value.code] = r.value;
      }
    });
    setQuotes((prev) => ({ ...prev, ...newQuotes }));
  }, [stocks]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  useEffect(() => {
    if (stocks.length > 0) loadQuotes();
  }, [stocks, loadQuotes]);

  async function handleStopLoss(stock: UserStock) {
    const supabase = createClient();
    await supabase
      .from("user_stocks")
      .update({ status: "stop_loss", updated_at: new Date().toISOString() })
      .eq("id", stock.id);
    loadStocks();
  }

  async function handleAddLayer(stock: UserStock) {
    if (stock.layer_count >= 2) return;
    const supabase = createClient();
    await supabase
      .from("user_stocks")
      .update({ layer_count: 2, updated_at: new Date().toISOString() })
      .eq("id", stock.id);
    loadStocks();
  }

  const holding = stocks.filter((s) => s.status === "holding");
  const history = stocks.filter((s) => s.status !== "holding");

  const displayList = tab === "holding" ? holding : history;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">自选管理</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex mb-4 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab("holding")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "holding"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          持仓 ({holding.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          历史 ({history.length})
        </button>
      </div>

      {displayList.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">
            {tab === "holding"
              ? "暂无持仓，点击右上角 + 添加"
              : "暂无历史记录"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {displayList.map((stock) => {
          const quote = quotes[stock.stock_code];
          const currentPrice = quote?.price ?? 0;
          const pnl =
            currentPrice > 0
              ? ((currentPrice - stock.entry_price) / stock.entry_price) * 100
              : 0;
          const stopDist =
            currentPrice > 0
              ? ((currentPrice - stock.td9_low_price) / stock.td9_low_price) * 100
              : 0;
          const isBroken = currentPrice > 0 && currentPrice < stock.td9_low_price;

          return (
            <div
              key={stock.id}
              className={`bg-card rounded-xl border p-4 transition-all ${
                isBroken
                  ? "border-danger bg-danger/5 shadow-sm shadow-danger/10"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={() => router.push(`/stock/${stock.stock_code}`)}
                  className="text-left group"
                >
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {stock.stock_name ?? stock.stock_code}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stock.stock_code}
                  </p>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-0.5">
                    <Layers className="w-3 h-3" />
                    {stock.layer_count}层
                  </span>
                  {stock.status !== "holding" && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        stock.status === "sold"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {stock.status === "sold" ? "已卖出" : "已止损"}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground">买入价</p>
                  <p className="font-medium">{Number(stock.entry_price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">现价</p>
                  <p className="font-medium">
                    {currentPrice > 0 ? currentPrice.toFixed(2) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">盈亏</p>
                  <p
                    className={`font-medium ${
                      pnl > 0
                        ? "text-danger"
                        : pnl < 0
                          ? "text-success"
                          : ""
                    }`}
                  >
                    {currentPrice > 0
                      ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">止损距离</p>
                  <p
                    className={`font-medium ${
                      isBroken ? "text-danger" : stopDist < 3 ? "text-warning" : ""
                    }`}
                  >
                    {currentPrice > 0 ? `${stopDist.toFixed(1)}%` : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShieldAlert className="w-3 h-3" />
                  <span>
                    止损线: {Number(stock.td9_low_price).toFixed(2)}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {stock.entry_date}
                </p>
              </div>

              {isBroken && stock.status === "holding" && (
                <div className="mt-3 p-2 rounded-lg bg-danger/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-danger text-xs font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    已跌破止损线！
                  </div>
                  <button
                    onClick={() => handleStopLoss(stock)}
                    className="px-3 py-1 rounded-md bg-danger text-white text-xs font-medium hover:opacity-90 transition"
                  >
                    执行止损
                  </button>
                </div>
              )}

              {stock.status === "holding" && !isBroken && (
                <div className="mt-3 flex gap-2">
                  {stock.layer_count < 2 && (
                    <button
                      onClick={() => handleAddLayer(stock)}
                      className="flex-1 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                    >
                      补仓 (→2层)
                    </button>
                  )}
                  <button
                    onClick={() => setSellTarget(stock)}
                    className="flex-1 py-2 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                  >
                    卖出操作
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddStockModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={loadStocks}
      />

      <SellActionModal
        open={!!sellTarget}
        stock={sellTarget}
        currentPrice={
          sellTarget ? (quotes[sellTarget.stock_code]?.price ?? 0) : 0
        }
        onClose={() => setSellTarget(null)}
        onDone={loadStocks}
      />
    </div>
  );
}
