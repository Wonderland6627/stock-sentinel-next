"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddStockModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddStockModal({
  open,
  onClose,
  onAdded,
}: AddStockModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [td9Low, setTd9Low] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("请先登录");
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("user_stocks").insert({
      user_id: user.id,
      stock_code: code.trim(),
      stock_name: name.trim() || null,
      entry_date: new Date().toISOString().split("T")[0],
      entry_price: Number(entryPrice),
      td9_low_price: Number(td9Low),
      layer_count: 1,
      status: "holding",
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setCode("");
    setName("");
    setEntryPrice("");
    setTd9Low("");
    setLoading(false);
    onAdded();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">手动添加自选</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                股票代码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="如 sh600036"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                股票名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如 招商银行"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                买入价格
              </label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                止损线 (九转9低价)
              </label>
              <input
                type="number"
                step="0.01"
                value={td9Low}
                onChange={(e) => setTd9Low(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {error && (
            <p className="text-danger text-xs bg-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            添加
          </button>
        </form>
      </div>
    </div>
  );
}
