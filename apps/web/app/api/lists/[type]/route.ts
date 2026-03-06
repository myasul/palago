import { NextResponse } from "next/server";

type ListRouteContext = {
  params: {
    type: string;
  };
};

export async function GET(
  _request: Request,
  { params }: ListRouteContext,
) {
  return NextResponse.json({ ok: true, type: params.type });
}

