import { NextResponse } from "next/server";
import { fetchKLine } from "@/lib/stock-api/eastmoney";
import { analyzeStockDetail } from "@/modules/signal-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();
  const name = searchParams.get("name")?.trim() || code || "Unknown stock";

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const klines = await fetchKLine(code, 120);
  if (klines.length === 0) {
    return NextResponse.json({ error: "kline_not_found" }, { status: 404 });
  }

  return NextResponse.json(analyzeStockDetail(code, name, klines));
}
