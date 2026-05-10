"use client";

import Link from "next/link";
import { TrendingDown, AlertTriangle } from "lucide-react";
import type { StockSignal } from "@/lib/stock-api/types";

interface StockCardProps {
  signal: StockSignal;
}

export default function StockCard({ signal }: StockCardProps) {
  const isNearLower = signal.price <= signal.bollingerLower * 1.02;
  const distToLower =
    ((signal.price - signal.bollingerLower) / signal.bollingerLower) * 100;

  return (
    <Link href={`/stock/${signal.code}`}>
      <div
        className={`bg-card rounded-xl p-4 border transition-all hover:shadow-md active:scale-[0.98] ${
          signal.tdSetup === 9 && isNearLower
            ? "border-danger/50 shadow-danger/10 shadow-sm"
            : "border-border"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-base">{signal.name}</h3>
            <p className="text-xs text-muted-foreground">{signal.code}</p>
          </div>
          <div className="flex items-center gap-1">
            {signal.tdSetup === 9 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-danger/10 text-danger">
                九转9
              </span>
            )}
            {signal.tdSetup >= 7 && signal.tdSetup < 9 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-warning/10 text-warning">
                九转{signal.tdSetup}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-bold tabular-nums">
              {signal.price.toFixed(2)}
            </p>
            <p
              className={`text-sm font-medium ${
                signal.changePercent >= 0 ? "text-danger" : "text-success"
              }`}
            >
              {signal.changePercent >= 0 ? "+" : ""}
              {signal.changePercent.toFixed(2)}%
            </p>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingDown className="w-3 h-3" />
              <span>下轨 {signal.bollingerLower.toFixed(2)}</span>
            </div>
            <div
              className={`font-medium ${
                isNearLower ? "text-danger" : "text-muted-foreground"
              }`}
            >
              {isNearLower && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
              距下轨 {distToLower.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
