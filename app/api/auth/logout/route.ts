import { NextResponse } from "next/server";
import { authCookieNames } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of Object.values(authCookieNames)) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
