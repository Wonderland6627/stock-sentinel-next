"use client";

import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { ScreeningResult } from "@/lib/stock-api/types";
import StockListItem from "./StockListItem";

interface StockListProps {
  results: ScreeningResult[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function StockList({
  results,
  total,
  loading,
  hasMore,
  onLoadMore,
}: StockListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);

  // Keep refs in sync so the observer callback sees latest values
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const handleLoadMore = useCallback(() => {
    if (!loadingRef.current && hasMoreRef.current) {
      onLoadMore();
    }
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  return (
    <div className="mt-3">
      {/* Total count */}
      <div className="text-sm text-muted-foreground mb-3 px-1">
        共 <span className="font-medium text-foreground">{total}</span> 只股票
      </div>

      {/* Result list */}
      {results.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">未找到符合条件的股票</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {results.map((stock) => (
          <StockListItem key={stock.code} stock={stock} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* No more data */}
      {!hasMore && results.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          没有更多数据
        </div>
      )}
    </div>
  );
}
