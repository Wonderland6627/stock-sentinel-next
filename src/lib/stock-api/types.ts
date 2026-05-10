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

export interface StockSignal {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  tdSetup: number;
  bollingerLower: number;
  bollingerMid: number;
  bollingerUpper: number;
  signalType: "buy_td9" | "buy_td13" | "sell_mid" | "sell_upper";
}

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
