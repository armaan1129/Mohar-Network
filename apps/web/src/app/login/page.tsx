import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewer, safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Partner sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  if (await getViewer()) redirect(safeNext(next));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Partner sign in</CardTitle>
          <CardDescription>
            For Sirhind Mohar partner businesses and the network admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error === "link" && (
            <p role="alert" className="text-sm text-destructive">
              That sign-in link is invalid or has expired. Request a new one.
            </p>
          )}
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
