import { KLineData, StockQuote, toEastMoneySecId } from "./types";

const KLINE_URL = "https://push2his.eastmoney.com/api/qt/stock/kline/get";
const QUOTE_URL = "https://push2.eastmoney.com/api/qt/stock/get";

export async function fetchKLine(
  code: string,
  days = 120
): Promise<KLineData[]> {
  const secid = toEastMoneySecId(code);
  const params = new URLSearchParams({
    secid,
    fields1: "f1,f2,f3,f4,f5,f6",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    klt: "101", // daily
    fqt: "1",  // forward-adjusted
    lmt: String(days),
    end: "20500101",
    _: String(Date.now()),
  });

  const res = await fetch(`${KLINE_URL}?${params}`, {
    headers: {
      Referer: "https://finance.eastmoney.com/",
      "User-Agent": "Mozilla/5.0",
    },
    next: { revalidate: 300 },
  });

  const json = await res.json();
  if (!json.data?.klines) return [];

  return json.data.klines.map((line: string) => {
    const [date, open, close, high, low, volume, turnover] = line.split(",");
    return {
      date,
      open: Number(open),
      close: Number(close),
      high: Number(high),
      low: Number(low),
      volume: Number(volume),
      turnover: Number(turnover),
    };
  });
}

export async function fetchQuote(code: string): Promise<StockQuote | null> {
  const secid = toEastMoneySecId(code);
  const params = new URLSearchParams({
    secid,
    fields: "f43,f44,f45,f46,f47,f48,f57,f58,f60,f169,f170",
    _: String(Date.now()),
  });

  const res = await fetch(`${QUOTE_URL}?${params}`, {
    headers: {
      Referer: "https://finance.eastmoney.com/",
      "User-Agent": "Mozilla/5.0",
    },
    next: { revalidate: 15 },
  });

  const json = await res.json();
  if (!json.data) return null;

  const d = json.data;
  const divisor = code.startsWith("hk") ? 1000 : 100;

  return {
    code,
    name: d.f58 ?? code,
    price: d.f43 / divisor,
    change: d.f169 / divisor,
    changePercent: d.f170 / 100,
    high: d.f44 / divisor,
    low: d.f45 / divisor,
    open: d.f46 / divisor,
    prevClose: d.f60 / divisor,
    volume: d.f47,
    turnover: d.f48,
  };
}

export async function fetchBatchQuotes(
  codes: string[]
): Promise<StockQuote[]> {
  const results = await Promise.allSettled(codes.map(fetchQuote));
  return results
    .filter(
      (r): r is PromiseFulfilledResult<StockQuote | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);
}
