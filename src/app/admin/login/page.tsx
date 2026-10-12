import Link from "next/link";
import { IntakeLoginClient } from "@/components/intake-login-client";
import { intakeAuthIsConfigured } from "@/lib/admin/intake-auth";

export default function IntakeLoginPage() {
  const configured = intakeAuthIsConfigured();
  return <main className="intake-login-page">
    <Link className="back-link" href="/">← Football Links</Link>
    <p className="eyebrow">Editorial workspace</p>
    <h1>Player intake access</h1>
    {configured ? <IntakeLoginClient /> : <section className="intake-guide"><h2>Local mode</h2><p>Set <code>INTAKE_ADMIN_PASSWORD</code> in your deployment environment before making this workspace public. Local development remains available without a password.</p></section>}
  </main>;
}
