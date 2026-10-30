import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { createBusiness } from "../../actions";
import { BusinessForm } from "../business-form";
import { categoryOptions } from "../categories";

export const metadata: Metadata = { title: "Add business", robots: { index: false } };

export default async function NewBusinessPage() {
  const { supabase } = await requireAdmin();
  const categories = await categoryOptions(supabase);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a business</CardTitle>
      </CardHeader>
      <CardContent>
        <BusinessForm
          action={createBusiness}
          categories={categories}
          submitLabel="Create business"
        />
      </CardContent>
    </Card>
  );
}
