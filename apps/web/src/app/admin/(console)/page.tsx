import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [businesses, categories, audit] = await Promise.all([
    supabase.from("businesses").select("status"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase
      .from("audit_log")
      .select("id, at, action, table_name")
      .order("at", { ascending: false })
      .limit(8),
  ]);

  const byStatus = (s: string) => businesses.data?.filter((b) => b.status === s).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Network overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active businesses" value={byStatus("active")} href="/admin/businesses" />
        <Stat label="Suspended" value={byStatus("suspended")} href="/admin/businesses" />
        <Stat label="Categories" value={categories.count ?? 0} href="/admin/categories" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent admin activity</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.data?.length ? (
            <ul className="divide-y divide-border text-sm">
              {audit.data.map((row) => (
                <li key={row.id} className="flex justify-between gap-4 py-2">
                  <span>
                    {row.action} · {row.table_name}
                  </span>
                  <time className="text-muted-foreground" dateTime={row.at}>
                    {new Date(row.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-colors hover:bg-muted">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold">{value}</p>
      </Card>
    </Link>
  );
}
