"use client";

import { useActionState, useState } from "react";
import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState, type ActionState } from "@/lib/action-state";
import type { FormOptions } from "./form-options";

type Business = {
  name: string;
  city_id: string;
  category_id: string;
  scope: "city" | "national";
  address: string;
  gstin: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: string | null;
  logo_url: string | null;
  issuance_cap_per_quarter: number | null;
};

type Props = {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  options: FormOptions;
  business?: Business;
  submitLabel: string;
};

export function BusinessForm({ action, options, business, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [cityId, setCityId] = useState(business?.city_id ?? "");
  const err = state.fieldErrors ?? {};
  // One business per category per city: a category held in the chosen city is unavailable.
  const taken = (categoryId: string) =>
    categoryId !== business?.category_id && options.held.includes(`${cityId}:${categoryId}`);

  const field = (
    name: keyof Business,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={business?.[name] ?? ""}
        aria-invalid={!!err[name]}
        aria-describedby={`${name}-error`}
        {...props}
      />
      <FieldError id={`${name}-error`} messages={err[name]} />
    </div>
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {field("name", "Business name", { required: true })}
      <div className="flex flex-col gap-2">
        <Label htmlFor="city_id">City</Label>
        <Select
          id="city_id"
          name={business ? undefined : "city_id"}
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          disabled={!!business}
          required
          aria-invalid={!!err.city_id}
          aria-describedby="city_id-error"
        >
          <option value="" disabled>
            Choose…
          </option>
          {options.cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
        {/* A business never changes city; send the fixed value when editing. */}
        {business && <input type="hidden" name="city_id" value={business.city_id} />}
        <FieldError id="city_id-error" messages={err.city_id} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category_id">Category</Label>
        <Select
          id="category_id"
          name="category_id"
          defaultValue={business?.category_id ?? ""}
          required
          aria-invalid={!!err.category_id}
          aria-describedby="category_id-error"
        >
          <option value="" disabled>
            Choose…
          </option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id} disabled={taken(c.id)}>
              {c.name}
              {taken(c.id) ? " (taken)" : ""}
            </option>
          ))}
        </Select>
        <FieldError id="category_id-error" messages={err.category_id} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Accepts notes from</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="scope"
            value="city"
            defaultChecked={(business?.scope ?? "city") === "city"}
          />
          Its own city only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="scope"
            value="national"
            defaultChecked={business?.scope === "national"}
          />
          National: also other national partners&apos; notes
        </label>
        <FieldError id="scope-error" messages={err.scope} />
      </fieldset>
      <div className="sm:col-span-2">{field("address", "Address", { required: true })}</div>
      {field("phone", "Phone", { inputMode: "tel", autoComplete: "off" })}
      {field("hours", "Opening hours", { placeholder: "10 am – 8 pm, closed Tuesday" })}
      {field("lat", "Latitude", { inputMode: "decimal", placeholder: "30.6436" })}
      {field("lng", "Longitude", { inputMode: "decimal", placeholder: "76.3847" })}
      {field("gstin", "GSTIN (optional)")}
      {field("issuance_cap_per_quarter", "Issuance cap per quarter (notes, blank = none)", {
        inputMode: "numeric",
      })}
      <div className="sm:col-span-2">
        {field("logo_url", "Logo URL (https, optional)", { type: "url" })}
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormError message={state.error} />
        {state.ok && (
          <p role="status" className="text-sm text-success">
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
