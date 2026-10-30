import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Counter", robots: { index: false } };

// Business app shell. Issue, Redeem and Stock arrive in milestones 2–3.
export default async function CounterHome() {
  const viewer = await requireMember();
  const m = viewer.membership;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mohar Network</h1>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted-foreground underline underline-offset-4">
            Sign out
          </button>
        </form>
      </header>

      {m ? (
        <Card>
          <CardHeader>
            <CardTitle>{m.businesses?.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Signed in as {viewer.user.email}
              <Badge>{m.role}</Badge>
              {m.businesses?.status !== "active" && (
                <Badge tone="danger">{m.businesses?.status}</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Issuing and redeeming notes will appear here once the counter app is released.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No business linked</CardTitle>
            <CardDescription>
              {viewer.isNetworkAdmin
                ? "You are the network admin. Go to /admin to manage the network."
                : "Your account isn't linked to a partner business yet. Ask the network admin to add you."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
