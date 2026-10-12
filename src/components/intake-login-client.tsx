"use client";

import { FormEvent, useState } from "react";

export function IntakeLoginClient() {
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true); setError(null);
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setError(result.error ?? "Unable to sign in."); setWorking(false); return; }
    window.location.assign("/admin/intake");
  }

  return <form className="intake-login-form" onSubmit={submit}>
    <label htmlFor="password">Admin password</label>
    <input id="password" name="password" type="password" required autoComplete="current-password" />
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="start-button" disabled={working}>{working ? "Signing in…" : "Sign in"}</button>
  </form>;
}
