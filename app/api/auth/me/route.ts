import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  const member = await getCurrentMember();
  return NextResponse.json({
    email: member?.email ?? "",
    role: member?.role ?? "staff",
  });
}
