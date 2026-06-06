import {
  KLineData,
  StockQuote,
  toEastMoneySecId,
  ScreeningParams,
  ScreeningResult,
  ScreeningResponse,
} from "./types";

const KLINE_URL = "https://push2his.eastmoney.com/api/qt/stock/kline/get";
const QUOTE_URL = "https://push2.eastmoney.com/api/qt/stock/get";
const CLIST_URL = "https://push2.eastmoney.com/api/qt/clist/get";

// ─── K线 & 行情（已有接口，保持不变）─────────────────────

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

// ─── 市场筛选 ──────────────────────────────────────────

/** 市场类型 → 东方财富 fs 参数 */
const MARKET_FS: Record<string, string> = {
  all: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
  sh: "m:1+t:2,m:1+t:23",
  sz: "m:0+t:6,m:0+t:80",
  cyb: "m:0+t:80",
  kcb: "m:1+t:23",
};

/** 排序字段 → 东方财富 fid */
const SORT_FIELD_MAP: Record<string, string> = {
  price: "f2",
  changePercent: "f3",
  marketCap: "f20",
  pe: "f9",
  turnoverRate: "f8",
  amplitude: "f7",
  volume: "f5",
  turnover: "f6",
};

/** 东方财富纯数字代码 → 带 sh/sz 前缀的代码 */
function normalizeCode(rawCode: string): string {
  if (rawCode.startsWith("6")) return `sh${rawCode}`;
  return `sz${rawCode}`;
}

/** 服务端二次筛选 */
function applyServerFilter(
  items: ScreeningResult[],
  params: ScreeningParams
): ScreeningResult[] {
  return items.filter((item) => {
    if (params.priceMin != null && item.price < params.priceMin) return false;
    if (params.priceMax != null && item.price > params.priceMax) return false;
    if (
      params.changePercentMin != null &&
      item.changePercent < params.changePercentMin
    )
      return false;
    if (
      params.changePercentMax != null &&
      item.changePercent > params.changePercentMax
    )
      return false;
    if (params.marketCapMin != null && item.marketCap < params.marketCapMin)
      return false;
    if (params.marketCapMax != null && item.marketCap > params.marketCapMax)
      return false;
    if (params.peMin != null && (item.pe === null || item.pe < params.peMin))
      return false;
    if (params.peMax != null && (item.pe === null || item.pe > params.peMax))
      return false;
    if (
      params.turnoverRateMin != null &&
      item.turnoverRate < params.turnoverRateMin
    )
      return false;
    if (
      params.turnoverRateMax != null &&
      item.turnoverRate > params.turnoverRateMax
    )
      return false;
    if (
      params.sector &&
      (!item.sector || !item.sector.includes(params.sector))
    )
      return false;
    return true;
  });
}

export async function fetchMarketScreening(
  params: ScreeningParams
): Promise<ScreeningResponse> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const market = params.market || "all";
  const sortOrder = params.sortOrder || "desc";

  // 为了二次筛选后仍有足够数据，请求更大批次
  const fetchSize = 200;

  // 支持多选：逗号分隔的市场代码拼接 fs 参数
  const marketKeys = market === "all" ? ["all"] : market.split(",").filter(Boolean);
  const fsValue = marketKeys
    .map((key) => MARKET_FS[key] || "")
    .filter(Boolean)
    .join(",") || MARKET_FS.all;

  const fid = SORT_FIELD_MAP[params.sortField || "marketCap"] || "f20";
  const po = sortOrder === "asc" ? "1" : "0";

  const urlParams = new URLSearchParams({
    pn: "1",
    pz: String(fetchSize),
    po,
    np: "1",
    fltt: "2",
    ut: "bd1d9ddb04089700cf9c27f6f7426281",
    fs: fsValue,
    fields:
      "f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f14,f15,f16,f17,f18,f20,f21,f23,f100,f115",
    _: String(Date.now()),
  });

  try {
    const res = await fetch(`${CLIST_URL}?${urlParams}`, {
      headers: {
        Referer: "https://quote.eastmoney.com/",
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 60 },
    });

    const json = await res.json();
    if (!json.data?.diff) {
      return { data: [], total: 0, page, pageSize };
    }

    const rawItems: ScreeningResult[] = json.data.diff.map(
      (d: Record<string, number | string>) => {
        const rawCode = String(d.f12);
        const price = Number(d.f2);
        // f2 为 "-" 时表示停牌，价格无效
        const isValidPrice = !isNaN(price) && price > 0;

        return {
          code: normalizeCode(rawCode),
          name: String(d.f14 ?? ""),
          price: isValidPrice ? price : 0,
          changePercent: Number(d.f3) || 0,
          marketCap: Number(d.f20) / 1e8, // 转换为亿元
          pe: d.f9 != null && d.f9 !== "-" ? Number(d.f9) : null,
          turnoverRate: Number(d.f8) || 0,
          amplitude: Number(d.f7) || 0,
          volume: Number(d.f5) || 0,
          high: Number(d.f15) || 0,
          low: Number(d.f16) || 0,
          open: Number(d.f17) || 0,
          sector: d.f100 ? String(d.f100) : undefined,
        };
      }
    );

    // 过滤 ST / 退市股票
    const validItems = rawItems.filter(
      (item) => !item.name.includes("ST") && !item.name.includes("退")
    );

    // 服务端二次筛选
    const filtered = applyServerFilter(validItems, params);
    const total = filtered.length;

    // 分页截取
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total, page, pageSize };
  } catch {
    return { data: [], total: 0, page, pageSize };
  }
}
