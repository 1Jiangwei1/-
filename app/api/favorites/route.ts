import { NextResponse } from "next/server";

export async function POST(_request: Request) {

  return NextResponse.json(
    {
      success: false,
      message: "收藏功能已下线。",
    },
    { status: 410 }
  );
}
