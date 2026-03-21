import { NextResponse } from "next/server";

type ListRouteContext = {
  params: Promise<{
    type: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ListRouteContext,
) {
  const { type } = await params;

  return NextResponse.json({ ok: true, type });
}
