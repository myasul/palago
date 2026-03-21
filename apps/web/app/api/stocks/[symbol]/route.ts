import { NextResponse } from "next/server";

type StockRouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: StockRouteContext,
) {
  const { symbol } = await params;

  return NextResponse.json({ ok: true, symbol });
}
