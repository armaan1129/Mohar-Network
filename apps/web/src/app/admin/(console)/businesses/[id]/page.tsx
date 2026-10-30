import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { updateBusiness } from "../../actions";
import { BusinessForm } from "../business-form";
import { categoryOptions } from "../categories";
import { StatusPanel } from "./status-panel";
import { StaffPanel } from "./staff-panel";
import { statusTone } from "../status-tone";

export const metadata: Metadata = { title: "Business", robots: { index: false } };

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: business }, categories, { data: staff }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).maybeSingle(),
    categoryOptions(supabase),
    supabase
      .from("business_users")
      .select("user_id, role, created_at")
      .eq("business_id", id)
      .order("role"),
  ]);
  if (!business) notFound();

  // Staff emails live in auth.users; read them with the service role (admin already verified).
  const service = createServiceClient();
  const people = await Promise.all(
    (staff ?? []).map(async (s) => {
      const { data } = await service.auth.admin.getUserById(s.user_id);
      return {
        ...s,
        email: data.user?.email ?? "(unknown)",
        confirmed: !!data.user?.last_sign_in_at,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/businesses"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Businesses
        </Link>
        <h1 className="text-2xl font-semibold">{business.name}</h1>
        <Badge tone={statusTone[business.status]}>{business.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessForm
            action={updateBusiness.bind(null, business.id)}
            categories={categories}
            business={business}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Owners can see statements and manage cashiers. Cashiers issue and redeem only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffPanel businessId={business.id} people={people} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Suspended businesses cannot issue notes; notes they already issued stay valid. Leaving
            is permanent and frees the category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPanel businessId={business.id} status={business.status} />
        </CardContent>
      </Card>
    </div>
  );
}
