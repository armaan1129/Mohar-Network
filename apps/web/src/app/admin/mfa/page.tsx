import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";
import { MfaForm } from "./mfa-form";

export const metadata: Metadata = { title: "Verify admin", robots: { index: false } };

export default async function AdminMfaPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (!viewer.isNetworkAdmin) notFound();
  if (viewer.aal === "aal2") redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authenticator check</CardTitle>
          <CardDescription>
            Admin access needs a 6-digit code from an authenticator app (Google Authenticator,
            1Password, Authy…).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaForm />
        </CardContent>
      </Card>
    </main>
  );
}
