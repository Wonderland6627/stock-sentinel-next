import { NextRequest, NextResponse } from "next/server";
import { fetchQuote } from "@/lib/stock-api/eastmoney";
import { fetchSinaQuote } from "@/lib/stock-api/sina";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    const quote = await fetchQuote(code);
    if (quote) return NextResponse.json(quote);

    const fallback = await fetchSinaQuote(code);
    if (fallback) return NextResponse.json(fallback);

    return NextResponse.json({ error: "No data found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
