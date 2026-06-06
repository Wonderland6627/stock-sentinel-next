export interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
}

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  turnover: number;
}

export type MarketType = "sh" | "sz" | "hk";

export function parseMarket(code: string): MarketType {
  if (code.startsWith("hk")) return "hk";
  if (code.startsWith("sh")) return "sh";
  return "sz";
}

export function toEastMoneySecId(code: string): string {
  const market = parseMarket(code);
  const num = code.replace(/^(sh|sz|hk)/, "");
  if (market === "sh") return `1.${num}`;
  if (market === "sz") return `0.${num}`;
  return `116.${num}`;
}

export function toSinaCode(code: string): string {
  return code;
}

// ─── 市场筛选类型 ───────────────────────────────────

export interface ScreeningParams {
  /** 支持多选，逗号分隔，如 "sh,kcb" */
  market?: string;
  priceMin?: number;
  priceMax?: number;
  changePercentMin?: number;
  changePercentMax?: number;
  marketCapMin?: number; // 单位：亿
  marketCapMax?: number;
  peMin?: number;
  peMax?: number;
  turnoverRateMin?: number;
  turnoverRateMax?: number;
  sector?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ScreeningResult {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number; // 亿元
  pe: number | null;
  turnoverRate: number;
  amplitude: number; // 振幅%
  volume: number;
  high: number;
  low: number;
  open: number;
  sector?: string;
}

export interface ScreeningResponse {
  data: ScreeningResult[];
  total: number;
  page: number;
  pageSize: number;
}
