"use client";

import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { KLineData } from "@/lib/stock-api/types";
import type { BollingerResult } from "@/lib/indicators/bollinger";
import type { TDResult } from "@/lib/indicators/td-sequential";

interface KLineChartProps {
  klines: KLineData[];
  bollinger: BollingerResult;
  tdResults: TDResult[];
  showDays?: number;
}

interface ChartDataItem {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  upper: number | null;
  mid: number | null;
  lower: number | null;
  range: [number, number];
  buySetup: number;
  sellSetup: number;
  isGreen: boolean;
}

export default function KLineChart({
  klines,
  bollinger,
  tdResults,
  showDays = 60,
}: KLineChartProps) {
  const startIdx = Math.max(0, klines.length - showDays);
  const visibleKlines = klines.slice(startIdx);

  const data: ChartDataItem[] = visibleKlines.map((k, i) => {
    const realIdx = startIdx + i;
    return {
      date: k.date.slice(5),
      close: k.close,
      open: k.open,
      high: k.high,
      low: k.low,
      volume: k.volume,
      upper: isNaN(bollinger.upper[realIdx]) ? null : bollinger.upper[realIdx],
      mid: isNaN(bollinger.mid[realIdx]) ? null : bollinger.mid[realIdx],
      lower: isNaN(bollinger.lower[realIdx]) ? null : bollinger.lower[realIdx],
      range: [k.low, k.high],
      buySetup: tdResults[realIdx]?.buySetup ?? 0,
      sellSetup: tdResults[realIdx]?.sellSetup ?? 0,
      isGreen: k.close >= k.open,
    };
  });

  const allPrices = data.flatMap((d) => [
    d.close,
    d.high,
    d.low,
    d.upper,
    d.lower,
  ]).filter((v): v is number => v !== null && !isNaN(v));
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  const td9Points = data.filter((d) => d.buySetup === 9);
  const tdSell9Points = data.filter((d) => d.sellSetup === 9);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            orientation="right"
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                close: "收盘",
                upper: "上轨",
                mid: "中轨",
                lower: "下轨",
              };
              const v = typeof value === "number" ? value.toFixed(2) : String(value ?? "");
              const n = typeof name === "string" ? name : "";
              return [v, labels[n] ?? n];
            }}
          />

          <Area
            type="monotone"
            dataKey="upper"
            stroke="transparent"
            fill="var(--primary)"
            fillOpacity={0.05}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="transparent"
            fill="var(--background)"
            fillOpacity={1}
            connectNulls
          />

          <Line
            type="monotone"
            dataKey="upper"
            stroke="var(--warning)"
            strokeWidth={1}
            dot={false}
            connectNulls
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="mid"
            stroke="var(--primary)"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="lower"
            stroke="var(--success)"
            strokeWidth={1}
            dot={false}
            connectNulls
            strokeDasharray="4 2"
          />

          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--foreground)"
            strokeWidth={1.5}
            dot={false}
          />

          {td9Points.map((p) => (
            <ReferenceDot
              key={`buy-${p.date}`}
              x={p.date}
              y={p.low * 0.99}
              r={4}
              fill="var(--success)"
              stroke="var(--success)"
              label={{
                value: "9",
                position: "bottom",
                fontSize: 10,
                fontWeight: "bold",
                fill: "var(--success)",
              }}
            />
          ))}
          {tdSell9Points.map((p) => (
            <ReferenceDot
              key={`sell-${p.date}`}
              x={p.date}
              y={p.high * 1.01}
              r={4}
              fill="var(--danger)"
              stroke="var(--danger)"
              label={{
                value: "9",
                position: "top",
                fontSize: 10,
                fontWeight: "bold",
                fill: "var(--danger)",
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={60}>
        <ComposedChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Bar
            dataKey="volume"
            fill="var(--muted-foreground)"
            opacity={0.3}
            radius={[1, 1, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
