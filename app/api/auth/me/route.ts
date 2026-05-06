import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieNames } from "@/lib/auth";
import { normalizeAppRole } from "@/lib/access-control";

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({
    email: cookieStore.get(authCookieNames.email)?.value ?? "",
    role: normalizeAppRole(cookieStore.get(authCookieNames.role)?.value),
  });
}
