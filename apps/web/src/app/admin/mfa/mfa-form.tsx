"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

type Setup = { factorId: string; qr?: string; secret?: string };

export function MfaForm() {
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return setError("Could not load your authenticator. Refresh and try again.");
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) return setSetup({ factorId: verified.id });

      // First visit: drop any half-finished enrolment, then enrol a new TOTP factor.
      for (const f of data.all.filter((f) => f.factor_type === "totp" && f.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const enrolled = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Mohar Network admin",
      });
      if (enrolled.error)
        return setError("Could not start authenticator setup. Refresh and try again.");
      setSetup({
        factorId: enrolled.data.id,
        qr: enrolled.data.totp.qr_code,
        secret: enrolled.data.totp.secret,
      });
    })();
  }, []);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!setup) return;
    setBusy(true);
    setError(undefined);
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId: setup.factorId,
      code,
    });
    setBusy(false);
    if (error)
      return setError(
        "That code didn't match. Check the time on your phone and try the newest code.",
      );
    router.replace("/admin");
    router.refresh();
  }

  if (!setup && !error) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={verify} className="flex flex-col gap-4">
      {setup?.qr && (
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL SVG from Supabase */}
          <img
            src={setup.qr}
            alt="QR code to add the Mohar Network to your authenticator app"
            className="size-48"
          />
          <p className="text-center text-xs text-muted-foreground">
            Scan with your authenticator app, or enter this key:{" "}
            <code className="break-all">{setup.secret}</code>
          </p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={busy || !setup || code.length !== 6}>
        {busy ? "Checking…" : "Verify"}
      </Button>
    </form>
  );
}
