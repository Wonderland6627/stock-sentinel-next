import { KLineData, StockQuote } from "./types";

const QUOTE_URL = "https://hq.sinajs.cn/list=";
const KLINE_URL =
  "https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData";

export async function fetchSinaQuote(
  code: string
): Promise<StockQuote | null> {
  const res = await fetch(`${QUOTE_URL}${code}`, {
    headers: {
      Referer: "http://finance.sina.com.cn/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const text = await res.text();
  const match = text.match(/"(.+)"/);
  if (!match) return null;

  const parts = match[1].split(",");
  if (parts.length < 32) return null;

  return {
    code,
    name: parts[0],
    open: Number(parts[1]),
    prevClose: Number(parts[2]),
    price: Number(parts[3]),
    high: Number(parts[4]),
    low: Number(parts[5]),
    volume: Number(parts[8]),
    turnover: Number(parts[9]),
    change: Number(parts[3]) - Number(parts[2]),
    changePercent:
      ((Number(parts[3]) - Number(parts[2])) / Number(parts[2])) * 100,
  };
}

export async function fetchSinaKLine(
  code: string,
  days = 120
): Promise<KLineData[]> {
  const params = new URLSearchParams({
    symbol: code,
    scale: "240", // daily
    ma: "no",
    datalen: String(days),
  });

  const res = await fetch(`${KLINE_URL}?${params}`, {
    headers: {
      Referer: "http://finance.sina.com.cn/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const json = await res.json();
  if (!Array.isArray(json)) return [];

  return json.map(
    (item: { day: string; open: string; high: string; low: string; close: string; volume: string }) => ({
      date: item.day,
      open: Number(item.open),
      close: Number(item.close),
      high: Number(item.high),
      low: Number(item.low),
      volume: Number(item.volume),
      turnover: 0,
    })
  );
}
