import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { statusTone } from "./status-tone";

export const metadata: Metadata = { title: "Businesses", robots: { index: false } };

export default async function BusinessesPage() {
  const { supabase } = await requireAdmin();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, status, issuance_cap_per_quarter, joined_at, categories(name)")
    .order("status")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Businesses</h1>
        <Button asChild>
          <Link href="/admin/businesses/new">Add business</Link>
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Business
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Category
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Cap / quarter
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {businesses?.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/businesses/${b.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {b.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{b.categories?.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                </td>
                <td className="px-4 py-3">{b.issuance_cap_per_quarter ?? "—"}</td>
                <td className="px-4 py-3">{b.joined_at}</td>
              </tr>
            ))}
            {!businesses?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No businesses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
