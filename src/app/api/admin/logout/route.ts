import { NextResponse } from "next/server";
import { intakeCookie } from "@/lib/admin/intake-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(intakeCookie.name, "", { ...intakeCookie.options, maxAge: 0 });
  return response;
}
