import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "football-links-intake";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function configuredPassword() {
  return process.env.INTAKE_ADMIN_PASSWORD;
}

function signature(expiresAt: string) {
  const password = configuredPassword();
  if (!password) return "";
  return createHmac("sha256", password).update(`football-links:intake:${expiresAt}`).digest("base64url");
}

export function intakeAuthIsConfigured() {
  return Boolean(configuredPassword());
}

export function createIntakeSession() {
  const expiresAt = String(Date.now() + SESSION_DURATION_MS);
  return `${expiresAt}.${signature(expiresAt)}`;
}

export function passwordMatches(candidate: string) {
  const password = configuredPassword();
  if (!password) return false;
  const candidateBuffer = Buffer.from(candidate);
  const passwordBuffer = Buffer.from(password);
  return candidateBuffer.length === passwordBuffer.length && timingSafeEqual(candidateBuffer, passwordBuffer);
}

export async function hasIntakeAccess() {
  // Local development stays frictionless; a deployment must configure the password.
  if (!intakeAuthIsConfigured()) return process.env.NODE_ENV !== "production";
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [expiresAt, suppliedSignature] = value.split(".");
  if (!expiresAt || !suppliedSignature || Number(expiresAt) < Date.now()) return false;
  const expected = signature(expiresAt);
  const supplied = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);
  return supplied.length === expectedBuffer.length && timingSafeEqual(supplied, expectedBuffer);
}

export const intakeCookie = {
  name: COOKIE_NAME,
  options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DURATION_MS / 1000 },
};
