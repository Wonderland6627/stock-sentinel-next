"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw, Loader2, Search, Info } from "lucide-react";
import StockCard from "@/components/stock/StockCard";
import AlertInfoModal from "@/components/dashboard/AlertInfoModal";
import type { StockSignal } from "@/lib/stock-api/types";
import { toLegacyStockSignal } from "@/modules/signal-engine/adapters";
import type { ScanListItem } from "@/modules/signal-engine/types";

const LOAD_ERROR = "数据加载失败，请稍后重试";

async function fetchSignals(): Promise<StockSignal[]> {
  const res = await fetch("/api/stock/scan");
  if (!res.ok) throw new Error("scan_failed");
  const data: ScanListItem[] = await res.json();
  return data.map(toLegacyStockSignal);
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  async function loadSignals() {
    setLoading(true);
    setError("");
    try {
      setSignals(await fetchSignals());
    } catch {
      setError(LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialSignals() {
      try {
        const nextSignals = await fetchSignals();
        if (!ignore) setSignals(nextSignals);
      } catch {
        if (!ignore) setError(LOAD_ERROR);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadInitialSignals();

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = signals.filter(
    (signal) => signal.name.includes(search) || signal.code.includes(search)
  );

  const td9Signals = filtered.filter((signal) => signal.tdSetup === 9);
  const pendingSignals = filtered.filter(
    (signal) => signal.tdSetup >= 7 && signal.tdSetup < 9
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">今日预警</h1>
          <button
            onClick={() => setShowInfo(true)}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="预警条件说明"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={loadSignals}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="刷新预警"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
                买入预警 - TD = 9
              </h2>
              <div className="space-y-3">
                {td9Signals.map((signal) => (
                  <StockCard key={signal.code} signal={signal} />
                ))}
              </div>
            </section>
          )}

          {pendingSignals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warning mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                关注中 - TD 7/8
              </h2>
              <div className="space-y-3">
                {pendingSignals.map((signal) => (
                  <StockCard key={signal.code} signal={signal} />
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

      <AlertInfoModal open={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}
