"use client";

import { ChevronDown } from "lucide-react";
import type { ScreeningParams } from "@/lib/stock-api/types";

export type FilterKey =
  | "market"
  | "price"
  | "changePercent"
  | "marketCap"
  | "pe"
  | "turnoverRate";

interface FilterChipDef {
  key: FilterKey;
  label: string;
}

const FILTER_CHIPS: FilterChipDef[] = [
  { key: "market", label: "市场" },
  { key: "price", label: "价格" },
  { key: "changePercent", label: "涨跌%" },
  { key: "marketCap", label: "总市值" },
  { key: "pe", label: "P/E" },
  { key: "turnoverRate", label: "换手率" },
];

const MARKET_LABELS: Record<string, string> = {
  all: "全部",
  sh: "沪市",
  sz: "深市",
  cyb: "创业板",
  kcb: "科创板",
};

function getChipValue(key: FilterKey, filters: ScreeningParams): string {
  switch (key) {
    case "market": {
      if (!filters.market || filters.market === "all") return "";
      const parts = filters.market.split(",").filter(Boolean);
      return parts.map((p) => MARKET_LABELS[p] ?? p).join("+");
    }
    case "price": {
      const min = filters.priceMin;
      const max = filters.priceMax;
      if (min !== undefined && max !== undefined) return `${min}-${max}`;
      if (min !== undefined) return `≥${min}`;
      if (max !== undefined) return `≤${max}`;
      return "";
    }
    case "changePercent": {
      const min = filters.changePercentMin;
      const max = filters.changePercentMax;
      if (min !== undefined && max !== undefined) return `${min}%-${max}%`;
      if (min !== undefined) return `≥${min}%`;
      if (max !== undefined) return `≤${max}%`;
      return "";
    }
    case "marketCap": {
      const min = filters.marketCapMin;
      const max = filters.marketCapMax;
      if (min !== undefined && max !== undefined) return `${min}-${max}亿`;
      if (min !== undefined) return `≥${min}亿`;
      if (max !== undefined) return `≤${max}亿`;
      return "";
    }
    case "pe": {
      const min = filters.peMin;
      const max = filters.peMax;
      if (min !== undefined && max !== undefined) return `${min}-${max}`;
      if (min !== undefined) return `≥${min}`;
      if (max !== undefined) return `≤${max}`;
      return "";
    }
    case "turnoverRate": {
      const min = filters.turnoverRateMin;
      const max = filters.turnoverRateMax;
      if (min !== undefined && max !== undefined) return `${min}%-${max}%`;
      if (min !== undefined) return `≥${min}%`;
      if (max !== undefined) return `≤${max}%`;
      return "";
    }
  }
}

function isFilterActive(key: FilterKey, filters: ScreeningParams): boolean {
  switch (key) {
    case "market":
      return !!filters.market && filters.market !== "all";
    case "price":
      return filters.priceMin !== undefined || filters.priceMax !== undefined;
    case "changePercent":
      return filters.changePercentMin !== undefined || filters.changePercentMax !== undefined;
    case "marketCap":
      return filters.marketCapMin !== undefined || filters.marketCapMax !== undefined;
    case "pe":
      return filters.peMin !== undefined || filters.peMax !== undefined;
    case "turnoverRate":
      return filters.turnoverRateMin !== undefined || filters.turnoverRateMax !== undefined;
  }
}

interface FilterChipsProps {
  filters: ScreeningParams;
  activeFilter: string | null;
  onFilterClick: (filterName: FilterKey) => void;
}

export default function FilterChips({
  filters,
  activeFilter,
  onFilterClick,
}: FilterChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      {FILTER_CHIPS.map((chip) => {
        const isActive = isFilterActive(chip.key, filters);
        const isOpen = activeFilter === chip.key;
        const value = getChipValue(chip.key, filters);

        return (
          <button
            key={chip.key}
            onClick={() => onFilterClick(chip.key)}
            className={`
              inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium
              transition-colors shrink-0
              ${
                isOpen
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-transparent"
              }
            `}
          >
            <span>{chip.label}</span>
            {value && <span className="opacity-70">{value}</span>}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export { FILTER_CHIPS, MARKET_LABELS };
