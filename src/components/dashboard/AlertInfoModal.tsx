"use client";

import { X } from "lucide-react";

interface AlertInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AlertInfoModal({ open, onClose }: AlertInfoModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">预警条件说明</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Buy signal condition */}
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3">
            <p className="text-xs font-semibold text-danger mb-1">买入预警</p>
            <p className="text-sm text-foreground">
              TD Sequential buySetup 计数 = 9，且当日收盘价 ≤ 布林带下轨
            </p>
          </div>

          {/* Watch condition */}
          <div className="rounded-lg bg-warning/10 border border-warning/20 px-4 py-3">
            <p className="text-xs font-semibold text-warning mb-1">关注中</p>
            <p className="text-sm text-foreground">
              TD Sequential buySetup 计数 ∈ {"{7, 8}"}
            </p>
          </div>

          {/* Bollinger parameters */}
          <div className="rounded-lg bg-muted border border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">布林带参数</p>
            <p className="text-sm text-foreground">
              20 日均线为中轨，上下各 2 倍标准差（±2σ）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
