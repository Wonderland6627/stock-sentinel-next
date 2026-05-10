"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw, Loader2, Search } from "lucide-react";
import StockCard from "@/components/stock/StockCard";
import type { StockSignal } from "@/lib/stock-api/types";

export default function DashboardPage() {
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadSignals() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stock/scan");
      if (!res.ok) throw new Error("扫描失败");
      const data = await res.json();
      setSignals(data);
    } catch {
      setError("数据加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignals();
  }, []);

  const filtered = signals.filter(
    (s) =>
      s.name.includes(search) ||
      s.code.includes(search)
  );

  const td9Signals = filtered.filter((s) => s.tdSetup === 9);
  const pendingSignals = filtered.filter((s) => s.tdSetup >= 7 && s.tdSetup < 9);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">今日预警</h1>
        </div>
        <button
          onClick={loadSignals}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索股票代码或名称..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">正在扫描市场数据...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-danger text-sm mb-3">{error}</p>
          <button
            onClick={loadSignals}
            className="text-primary text-sm font-medium hover:underline"
          >
            重新加载
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {td9Signals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-danger mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                买入预警 · 九转=9
              </h2>
              <div className="space-y-3">
                {td9Signals.map((s) => (
                  <StockCard key={s.code} signal={s} />
                ))}
              </div>
            </section>
          )}

          {pendingSignals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warning mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                关注中 · 九转≥7
              </h2>
              <div className="space-y-3">
                {pendingSignals.map((s) => (
                  <StockCard key={s.code} signal={s} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">
                {search ? "未找到匹配的股票" : "今日暂无预警信号"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
