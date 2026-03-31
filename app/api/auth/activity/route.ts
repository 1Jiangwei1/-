import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { touchUserActivity } from "@/lib/auth/activity";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  await touchUserActivity(user.id);

  return NextResponse.json({ success: true });
}
