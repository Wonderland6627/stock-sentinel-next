import { NextRequest, NextResponse } from "next/server";
import { fetchMarketScreening } from "@/lib/stock-api/eastmoney";
import type { ScreeningParams } from "@/lib/stock-api/types";

/** Safely parse a string to a number, returning undefined for NaN / empty */
function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const market = sp.get("market") ?? undefined;
  const priceMin = toNumber(sp.get("priceMin"));
  const priceMax = toNumber(sp.get("priceMax"));
  const changePercentMin = toNumber(sp.get("changePercentMin"));
  const changePercentMax = toNumber(sp.get("changePercentMax"));
  const marketCapMin = toNumber(sp.get("marketCapMin"));
  const marketCapMax = toNumber(sp.get("marketCapMax"));
  const peMin = toNumber(sp.get("peMin"));
  const peMax = toNumber(sp.get("peMax"));
  const turnoverRateMin = toNumber(sp.get("turnoverRateMin"));
  const turnoverRateMax = toNumber(sp.get("turnoverRateMax"));
  const sector = sp.get("sector") ?? undefined;
  const sortField = sp.get("sortField") ?? undefined;
  const sortOrder = sp.get("sortOrder") ?? undefined;
  const page = toNumber(sp.get("page"));
  const pageSize = toNumber(sp.get("pageSize"));

  // Validate sortOrder
  if (
    sortOrder !== undefined &&
    sortOrder !== "asc" &&
    sortOrder !== "desc"
  ) {
    return NextResponse.json(
      { error: "sortOrder must be 'asc' or 'desc'" },
      { status: 400 }
    );
  }

  // Validate market (supports comma-separated multi-select, e.g. "sh,kcb")
  const validMarkets = ["all", "sh", "sz", "cyb", "kcb"];
  if (market !== undefined) {
    const parts = market.split(",").filter(Boolean);
    const invalid = parts.filter((m) => !validMarkets.includes(m));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `market values must be from: ${validMarkets.join(", ")}` },
        { status: 400 }
      );
    }
  }

  // Validate numeric ranges
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    return NextResponse.json(
      { error: "priceMin cannot be greater than priceMax" },
      { status: 400 }
    );
  }
  if (
    changePercentMin !== undefined &&
    changePercentMax !== undefined &&
    changePercentMin > changePercentMax
  ) {
    return NextResponse.json(
      { error: "changePercentMin cannot be greater than changePercentMax" },
      { status: 400 }
    );
  }
  if (
    marketCapMin !== undefined &&
    marketCapMax !== undefined &&
    marketCapMin > marketCapMax
  ) {
    return NextResponse.json(
      { error: "marketCapMin cannot be greater than marketCapMax" },
      { status: 400 }
    );
  }
  if (peMin !== undefined && peMax !== undefined && peMin > peMax) {
    return NextResponse.json(
      { error: "peMin cannot be greater than peMax" },
      { status: 400 }
    );
  }
  if (
    turnoverRateMin !== undefined &&
    turnoverRateMax !== undefined &&
    turnoverRateMin > turnoverRateMax
  ) {
    return NextResponse.json(
      { error: "turnoverRateMin cannot be greater than turnoverRateMax" },
      { status: 400 }
    );
  }

  // Validate page / pageSize are positive
  if (page !== undefined && page < 1) {
    return NextResponse.json(
      { error: "page must be >= 1" },
      { status: 400 }
    );
  }
  if (pageSize !== undefined && (pageSize < 1 || pageSize > 100)) {
    return NextResponse.json(
      { error: "pageSize must be between 1 and 100" },
      { status: 400 }
    );
  }

  const params: ScreeningParams = {
    market: market as ScreeningParams["market"],
    priceMin,
    priceMax,
    changePercentMin,
    changePercentMax,
    marketCapMin,
    marketCapMax,
    peMin,
    peMax,
    turnoverRateMin,
    turnoverRateMax,
    sector,
    sortField,
    sortOrder: sortOrder as ScreeningParams["sortOrder"],
    page: page ?? 1,
    pageSize: pageSize ?? 20,
  };

  try {
    const result = await fetchMarketScreening(params);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch screening data" },
      { status: 500 }
    );
  }
}
