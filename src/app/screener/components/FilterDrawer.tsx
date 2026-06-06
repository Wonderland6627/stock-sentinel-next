"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScreeningParams } from "@/lib/stock-api/types";
import type { FilterKey } from "./FilterChips";
import { MARKET_LABELS } from "./FilterChips";

interface FilterDrawerProps {
  activeFilter: FilterKey | null;
  filters: ScreeningParams;
  onApply: (key: FilterKey, value: Partial<ScreeningParams>) => void;
  onReset: (key: FilterKey) => void;
  onClose: () => void;
}

// Preset definitions per filter type
const PRESETS: Record<string, { label: string; value: Partial<ScreeningParams> }[]> = {
  price: [
    { label: "0-10", value: { priceMin: 0, priceMax: 10 } },
    { label: "10-50", value: { priceMin: 10, priceMax: 50 } },
    { label: "50-100", value: { priceMin: 50, priceMax: 100 } },
    { label: ">100", value: { priceMin: 100 } },
  ],
  marketCap: [
    { label: ">100亿", value: { marketCapMin: 100 } },
    { label: ">500亿", value: { marketCapMin: 500 } },
    { label: ">1000亿", value: { marketCapMin: 1000 } },
  ],
  pe: [
    { label: "0-20", value: { peMin: 0, peMax: 20 } },
    { label: "20-50", value: { peMin: 20, peMax: 50 } },
    { label: "50-100", value: { peMin: 50, peMax: 100 } },
  ],
  changePercent: [
    { label: "涨停", value: { changePercentMin: 9.5 } },
    { label: "涨>5%", value: { changePercentMin: 5 } },
    { label: "跌>5%", value: { changePercentMax: -5 } },
  ],
  turnoverRate: [
    { label: ">5%", value: { turnoverRateMin: 5 } },
    { label: ">10%", value: { turnoverRateMin: 10 } },
    { label: "<3%", value: { turnoverRateMax: 3 } },
  ],
};

const MARKET_OPTIONS: { value: string; label: string }[] = [
  { value: "sh", label: "沪市" },
  { value: "sz", label: "深市" },
  { value: "cyb", label: "创业板" },
  { value: "kcb", label: "科创板" },
];

// Map filter key to its min/max field names
function getRangeFields(
  key: FilterKey
): { minKey: keyof ScreeningParams; maxKey: keyof ScreeningParams } | null {
  switch (key) {
    case "price":
      return { minKey: "priceMin", maxKey: "priceMax" };
    case "changePercent":
      return { minKey: "changePercentMin", maxKey: "changePercentMax" };
    case "marketCap":
      return { minKey: "marketCapMin", maxKey: "marketCapMax" };
    case "pe":
      return { minKey: "peMin", maxKey: "peMax" };
    case "turnoverRate":
      return { minKey: "turnoverRateMin", maxKey: "turnoverRateMax" };
    default:
      return null;
  }
}

export default function FilterDrawer({
  activeFilter,
  filters,
  onApply,
  onReset,
  onClose,
}: FilterDrawerProps) {
  const [localMin, setLocalMin] = useState<string>("");
  const [localMax, setLocalMax] = useState<string>("");
  const [localMarkets, setLocalMarkets] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  // Sync local state when activeFilter changes
  useEffect(() => {
    if (activeFilter) {
      if (activeFilter === "market") {
        const currentMarket = filters.market;
        if (!currentMarket || currentMarket === "all") {
          setLocalMarkets([]);
        } else {
          setLocalMarkets(currentMarket.split(",").filter(Boolean));
        }
      } else {
        const fields = getRangeFields(activeFilter);
        if (fields) {
          const min = filters[fields.minKey];
          const max = filters[fields.maxKey];
          setLocalMin(min !== undefined ? String(min) : "");
          setLocalMax(max !== undefined ? String(max) : "");
        }
      }
      // Trigger slide-in animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [activeFilter, filters]);

  const handleApply = useCallback(() => {
    if (!activeFilter) return;

    if (activeFilter === "market") {
      if (localMarkets.length === 0) {
        onApply(activeFilter, { market: undefined });
      } else {
        onApply(activeFilter, { market: localMarkets.join(",") });
      }
    } else {
      const fields = getRangeFields(activeFilter);
      if (fields) {
        const update: Record<string, number> = {};
        const min = localMin.trim();
        const max = localMax.trim();
        if (min !== "") update[fields.minKey] = Number(min);
        if (max !== "") update[fields.maxKey] = Number(max);
        onApply(activeFilter, update as Partial<ScreeningParams>);
      }
    }
    onClose();
  }, [activeFilter, localMin, localMax, localMarkets, onApply, onClose]);

  const handleReset = useCallback(() => {
    if (!activeFilter) return;
    onReset(activeFilter);
    onClose();
  }, [activeFilter, onReset, onClose]);

  const handlePreset = useCallback(
    (preset: Partial<ScreeningParams>) => {
      if (!activeFilter) return;
      onApply(activeFilter, preset);
      onClose();
    },
    [activeFilter, onApply, onClose]
  );

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Filter title
  const FILTER_TITLES: Record<FilterKey, string> = {
    market: "市场",
    price: "价格",
    changePercent: "涨跌幅",
    marketCap: "总市值",
    pe: "P/E",
    turnoverRate: "换手率",
  };

  const isOpen = activeFilter !== null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Drawer panel — positioned above BottomNav (h-14 = 3.5rem) */}
      <div
        className={`fixed bottom-14 left-0 right-0 z-[60] bg-card rounded-t-2xl shadow-lg
          transition-transform duration-300 ease-out max-h-[calc(80vh-3.5rem)] overflow-y-auto
          ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        {activeFilter && (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                {FILTER_TITLES[activeFilter]}
              </h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            {/* Market: checkbox group (multi-select) */}
            {activeFilter === "market" && (
              <div className="flex flex-wrap gap-2 mb-6">
                {MARKET_OPTIONS.map((opt) => {
                  const checked = localMarkets.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setLocalMarkets((prev) =>
                          checked
                            ? prev.filter((v) => v !== opt.value)
                            : [...prev, opt.value]
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        checked
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Range filters: min/max inputs + presets */}
            {activeFilter !== "market" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      最小值
                    </label>
                    <input
                      type="number"
                      value={localMin}
                      onChange={(e) => setLocalMin(e.target.value)}
                      placeholder="不限"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">—</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      最大值
                    </label>
                    <input
                      type="number"
                      value={localMax}
                      onChange={(e) => setLocalMax(e.target.value)}
                      placeholder="不限"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Presets */}
                {PRESETS[activeFilter] && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {PRESETS[activeFilter].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePreset(preset.value)}
                        className="px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground
                          hover:bg-muted/80 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium
                  text-muted-foreground hover:bg-muted transition-colors"
              >
                重置
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm
                  font-medium hover:opacity-90 transition-opacity"
              >
                确认
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
