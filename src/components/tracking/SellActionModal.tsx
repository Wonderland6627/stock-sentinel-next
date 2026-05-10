"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserStock, SellRecord } from "@/lib/supabase/types";

interface SellActionModalProps {
  open: boolean;
  stock: UserStock | null;
  currentPrice: number;
  onClose: () => void;
  onDone: () => void;
}

const SELL_OPTIONS = [
  { ratio: "1/3", label: "卖出 1/3 (触中轨保本)", reason: "touch_mid" },
  { ratio: "1/3", label: "卖出 1/3 (触上轨获利)", reason: "touch_upper" },
  { ratio: "all", label: "清仓 (九转9/跌破MA5)", reason: "clear" },
];

export default function SellActionModal({
  open,
  stock,
  currentPrice,
  onClose,
  onDone,
}: SellActionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open || !stock) return null;

  async function handleSell(ratio: string, reason: string) {
    if (!stock) return;
    setLoading(true);

    const supabase = createClient();
    const newRecord: SellRecord = {
      date: new Date().toISOString().split("T")[0],
      price: currentPrice,
      ratio,
      reason,
    };

    const records = [...(stock.sell_records ?? []), newRecord];
    const isClear = reason === "clear";

    await supabase
      .from("user_stocks")
      .update({
        sell_records: records,
        status: isClear ? "sold" : "holding",
        updated_at: new Date().toISOString(),
      })
      .eq("id", stock.id);

    setLoading(false);
    onDone();
    onClose();
  }

  const pnl = ((currentPrice - stock.entry_price) / stock.entry_price) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">卖出操作</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-muted text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">股票：</span>
            {stock.stock_name} ({stock.stock_code})
          </p>
          <p>
            <span className="text-muted-foreground">买入价：</span>
            {stock.entry_price}
          </p>
          <p>
            <span className="text-muted-foreground">现价：</span>
            {currentPrice.toFixed(2)}
            <span className={`ml-2 font-medium ${pnl >= 0 ? "text-danger" : "text-success"}`}>
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">已卖出次数：</span>
            {stock.sell_records?.length ?? 0}
          </p>
        </div>

        <div className="space-y-2">
          {SELL_OPTIONS.map((opt) => (
            <button
              key={opt.reason}
              onClick={() => handleSell(opt.ratio, opt.reason)}
              disabled={loading}
              className="w-full py-3 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
