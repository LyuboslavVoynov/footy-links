import { NextResponse } from "next/server";
import { createIntakeSession, intakeAuthIsConfigured, intakeCookie, passwordMatches } from "@/lib/admin/intake-auth";

export async function POST(request: Request) {
  if (!intakeAuthIsConfigured()) return NextResponse.json({ error: "Set INTAKE_ADMIN_PASSWORD before enabling sign-in." }, { status: 503 });
  const body = await request.json() as { password?: string };
  if (!passwordMatches(body.password ?? "")) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(intakeCookie.name, createIntakeSession(), intakeCookie.options);
  return response;
}
