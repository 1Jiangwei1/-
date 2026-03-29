import { cookies } from "next/headers";

const COOKIE_NAME = "xj_session_uid";

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, userId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function getSessionUserId() {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
