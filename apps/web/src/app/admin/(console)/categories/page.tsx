import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { CategoryRow, NewCategoryForm } from "./category-forms";

export const metadata: Metadata = { title: "Categories", robots: { index: false } };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: businesses }] = await Promise.all([
    supabase.from("categories").select("id, name, name_pa").order("name"),
    supabase.from("businesses").select("category_id, name, status").neq("status", "left"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          One active business per category. A suspended business keeps its category.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add a category</CardTitle>
        </CardHeader>
        <CardContent>
          <NewCategoryForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All categories</CardTitle>
          <CardDescription>{categories?.length ?? 0} categories</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {categories?.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              holder={businesses?.find((b) => b.category_id === c.id)?.name}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
