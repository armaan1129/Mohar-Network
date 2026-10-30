import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { CityRow, NewCityForm } from "./city-forms";

export const metadata: Metadata = { title: "Cities", robots: { index: false } };

export default async function CitiesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: cities }, { data: businesses }] = await Promise.all([
    supabase.from("cities").select("id, code, name, name_pa, slug, state, is_live").order("name"),
    supabase.from("businesses").select("city_id").neq("status", "left"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Cities</h1>
        <p className="text-sm text-muted-foreground">
          Each city is its own partner network at its own subdomain. The 3-letter code is printed in
          every note serial (e.g. SIR-A000001) and can never change.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add a city</CardTitle>
        </CardHeader>
        <CardContent>
          <NewCityForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All cities</CardTitle>
          <CardDescription>{cities?.length ?? 0} cities</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {cities?.map((c) => (
            <CityRow
              key={c.id}
              city={c}
              partners={businesses?.filter((b) => b.city_id === c.id).length ?? 0}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
