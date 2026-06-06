"use client";

import type { ScreeningResult } from "@/lib/stock-api/types";

function formatMarketCap(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万亿`;
  }
  return `${value.toFixed(0)}亿`;
}

interface StockListItemProps {
  stock: ScreeningResult;
}

export default function StockListItem({ stock }: StockListItemProps) {
  const isUp = stock.changePercent > 0;
  const isDown = stock.changePercent < 0;

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      {/* Header: name + code */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-base text-card-foreground">
          {stock.name}
        </h3>
        <span className="text-gray-500 text-sm">{stock.code}</span>
      </div>

      {/* Price + change */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-lg font-bold text-card-foreground">
          ¥{stock.price.toFixed(2)}
        </span>
        <span
          className={`text-sm font-medium ${
            isUp
              ? "text-danger"
              : isDown
                ? "text-success"
                : "text-muted-foreground"
          }`}
        >
          {isUp ? "+" : ""}
          {stock.changePercent.toFixed(2)}%
        </span>
      </div>

      {/* Bottom metrics */}
      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
        <div>
          <span className="text-card-foreground font-medium">
            {formatMarketCap(stock.marketCap)}
          </span>{" "}
          市值
        </div>
        <div>
          <span className="text-card-foreground font-medium">
            {stock.pe !== null ? stock.pe.toFixed(1) : "-"}
          </span>{" "}
          PE
        </div>
        <div>
          <span className="text-card-foreground font-medium">
            {stock.turnoverRate.toFixed(1)}%
          </span>{" "}
          换手
        </div>
      </div>
    </div>
  );
}
