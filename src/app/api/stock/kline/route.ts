import { NextRequest, NextResponse } from "next/server";
import { fetchKLine } from "@/lib/stock-api/eastmoney";
import { fetchSinaKLine } from "@/lib/stock-api/sina";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const days = Number(request.nextUrl.searchParams.get("days") ?? "120");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    let klines = await fetchKLine(code, days);
    if (klines.length === 0) {
      klines = await fetchSinaKLine(code, days);
    }
    return NextResponse.json(klines);
  } catch {
    return NextResponse.json({ error: "Failed to fetch kline" }, { status: 500 });
  }
}
