import { NextResponse } from "next/server";

type StockRouteContext = {
  params: {
    symbol: string;
  };
};

export async function GET(
  _request: Request,
  { params }: StockRouteContext,
) {
  return NextResponse.json({ ok: true, symbol: params.symbol });
}

