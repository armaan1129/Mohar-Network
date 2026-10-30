"use client";

import { useActionState, useState } from "react";
import { FieldError, FormError } from "@/components/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { createCity, updateCity } from "../actions";

export function NewCityForm() {
  const [state, action, pending] = useActionState(createCity, initialActionState);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="city-name">City name</Label>
        <Input
          id="city-name"
          name="name"
          required
          aria-invalid={!!err.name}
          aria-describedby="city-name-error"
        />
        <FieldError id="city-name-error" messages={err.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city-name-pa">Name (ਪੰਜਾਬੀ)</Label>
        <Input id="city-name-pa" name="name_pa" lang="pa" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city-code">Serial code (3 letters, permanent)</Label>
        <Input
          id="city-code"
          name="code"
          required
          maxLength={3}
          className="uppercase"
          aria-invalid={!!err.code}
          aria-describedby="city-code-error"
        />
        <FieldError id="city-code-error" messages={err.code} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city-slug">Subdomain</Label>
        <div className="flex items-center gap-2">
          <Input
            id="city-slug"
            name="slug"
            required
            aria-invalid={!!err.slug}
            aria-describedby="city-slug-error"
          />
          <span className="text-sm text-muted-foreground">.themoharnetwork.com</span>
        </div>
        <FieldError id="city-slug-error" messages={err.slug} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city-state">State</Label>
        <Input id="city-state" name="state" defaultValue="Punjab" />
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" name="is_live" className="size-4" />
        Live on the public site
      </label>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormError message={state.error} />
        {state.ok && (
          <p role="status" className="text-sm text-success">
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={pending} className="self-start">
          Add city
        </Button>
      </div>
    </form>
  );
}

type City = {
  id: string;
  code: string;
  name: string;
  name_pa: string | null;
  slug: string;
  state: string;
  is_live: boolean;
};

export function CityRow({ city, partners }: { city: City; partners: number }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    updateCity.bind(null, city.id),
    initialActionState,
  );

  if (editing && !state.ok) {
    return (
      <form action={action} className="grid gap-2 py-3 sm:grid-cols-5 sm:items-center">
        <Input name="name" defaultValue={city.name} aria-label="City name" required />
        <Input
          name="name_pa"
          defaultValue={city.name_pa ?? ""}
          aria-label="Name (Punjabi)"
          lang="pa"
        />
        <Input name="slug" defaultValue={city.slug} aria-label="Subdomain" required />
        <Input name="state" defaultValue={city.state} aria-label="State" required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_live" defaultChecked={city.is_live} className="size-4" />
          Live
        </label>
        <div className="flex gap-2 sm:col-span-5">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="sm:col-span-5">
          <FormError message={state.error ?? Object.values(state.fieldErrors ?? {})[0]?.[0]} />
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 font-medium">
          {city.name}
          {city.name_pa && (
            <span lang="pa" className="text-muted-foreground">
              · {city.name_pa}
            </span>
          )}
          <Badge>{city.code}</Badge>
          {city.is_live ? (
            <Badge tone="success">live</Badge>
          ) : (
            <Badge tone="warning">not live</Badge>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {city.slug}.themoharnetwork.com · {city.state} · {partners} partner
          {partners === 1 ? "" : "s"}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </div>
  );
}
