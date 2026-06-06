"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { ScreeningParams, ScreeningResult, ScreeningResponse } from "@/lib/stock-api/types";
import FilterChips from "./components/FilterChips";
import type { FilterKey } from "./components/FilterChips";
import FilterDrawer from "./components/FilterDrawer";
import StockList from "./components/StockList";

const PAGE_SIZE = 20;

// Clear all fields related to a given filter key
function clearFilterKey(filters: ScreeningParams, key: FilterKey): ScreeningParams {
  const next = { ...filters };
  switch (key) {
    case "market":
      delete next.market;
      break;
    case "price":
      delete next.priceMin;
      delete next.priceMax;
      break;
    case "changePercent":
      delete next.changePercentMin;
      delete next.changePercentMax;
      break;
    case "marketCap":
      delete next.marketCapMin;
      delete next.marketCapMax;
      break;
    case "pe":
      delete next.peMin;
      delete next.peMax;
      break;
    case "turnoverRate":
      delete next.turnoverRateMin;
      delete next.turnoverRateMax;
      break;
  }
  return next;
}

export default function ScreenerClient() {
  const [filters, setFilters] = useState<ScreeningParams>({
    sortField: "marketCap",
    sortOrder: "desc",
  });
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);

  // Track a debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest fetch request to avoid stale responses
  const fetchIdRef = useRef(0);

  // Build query string from filters + pagination
  function buildQueryString(params: ScreeningParams, pageNum: number): string {
    const sp = new URLSearchParams();
    if (params.market) sp.set("market", params.market);
    if (params.priceMin !== undefined) sp.set("priceMin", String(params.priceMin));
    if (params.priceMax !== undefined) sp.set("priceMax", String(params.priceMax));
    if (params.changePercentMin !== undefined)
      sp.set("changePercentMin", String(params.changePercentMin));
    if (params.changePercentMax !== undefined)
      sp.set("changePercentMax", String(params.changePercentMax));
    if (params.marketCapMin !== undefined) sp.set("marketCapMin", String(params.marketCapMin));
    if (params.marketCapMax !== undefined) sp.set("marketCapMax", String(params.marketCapMax));
    if (params.peMin !== undefined) sp.set("peMin", String(params.peMin));
    if (params.peMax !== undefined) sp.set("peMax", String(params.peMax));
    if (params.turnoverRateMin !== undefined)
      sp.set("turnoverRateMin", String(params.turnoverRateMin));
    if (params.turnoverRateMax !== undefined)
      sp.set("turnoverRateMax", String(params.turnoverRateMax));
    if (params.sector) sp.set("sector", params.sector);
    if (params.sortField) sp.set("sortField", params.sortField);
    if (params.sortOrder) sp.set("sortOrder", params.sortOrder);
    sp.set("page", String(pageNum));
    sp.set("pageSize", String(PAGE_SIZE));
    return sp.toString();
  }

  // Fetch first page (reset results)
  const fetchFirst = useCallback(
    async (params: ScreeningParams) => {
      const id = ++fetchIdRef.current;
      setLoading(true);
      try {
        const qs = buildQueryString(params, 1);
        const res = await fetch(`/api/stock/screen?${qs}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: ScreeningResponse = await res.json();
        if (id !== fetchIdRef.current) return; // stale
        setResults(data.data);
        setTotal(data.total);
        setPage(2); // next page to load
        setHasMore(data.data.length < data.total);
      } catch {
        if (id !== fetchIdRef.current) return;
        setResults([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        if (id === fetchIdRef.current) setLoading(false);
      }
    },
    []
  );

  // Fetch next page (append results)
  const fetchMore = useCallback(
    async (params: ScreeningParams, pageNum: number) => {
      const id = ++fetchIdRef.current;
      setLoading(true);
      try {
        const qs = buildQueryString(params, pageNum);
        const res = await fetch(`/api/stock/screen?${qs}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: ScreeningResponse = await res.json();
        if (id !== fetchIdRef.current) return; // stale
        setResults((prev) => [...prev, ...data.data]);
        setPage(pageNum + 1);
        setHasMore(data.data.length >= PAGE_SIZE);
      } catch {
        // Keep existing results on error
      } finally {
        if (id === fetchIdRef.current) setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    void fetchFirst(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter change with debounce
  const handleFilterApply = useCallback(
    (key: FilterKey, value: Partial<ScreeningParams>) => {
      setFilters((prev) => {
        // Clear old fields for this key first, then merge new ones
        const cleaned = clearFilterKey(prev, key);
        const next = { ...cleaned, ...value };
        // Debounce: reset timer and schedule new fetch
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void fetchFirst(next);
        }, 300);
        return next;
      });
    },
    [fetchFirst]
  );

  const handleFilterReset = useCallback(
    (key: FilterKey) => {
      setFilters((prev) => {
        const next = clearFilterKey(prev, key);
        void fetchFirst(next);
        return next;
      });
    },
    [fetchFirst]
  );

  const handleLoadMore = useCallback(() => {
    void fetchMore(filters, page);
  }, [filters, page, fetchMore]);

  const handleFilterClick = useCallback((key: FilterKey) => {
    setActiveFilter((prev) => (prev === key ? null : key));
  }, []);

  const handleDrawerClose = useCallback(() => {
    setActiveFilter(null);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Page header */}
      <h1 className="text-xl font-bold text-foreground mb-3">股票筛选</h1>

      {/* Filter chips */}
      <FilterChips
        filters={filters}
        activeFilter={activeFilter}
        onFilterClick={handleFilterClick}
      />

      {/* Top loading bar — shows when refreshing after filter change */}
      {loading && results.length > 0 && (
        <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[loading_1.2s_ease-in-out_infinite]" style={{ width: "40%" }} />
        </div>
      )}

      {/* Initial loading */}
      {loading && results.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <StockList
          results={results}
          total={total}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      )}

      {/* Filter drawer */}
      <FilterDrawer
        activeFilter={activeFilter}
        filters={filters}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
