"use client";

import { useActionState } from "react";
import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState, type ActionState } from "@/lib/action-state";

type Business = {
  name: string;
  category_id: string;
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
  categories: { id: string; name: string; taken: boolean }[];
  business?: Business;
  submitLabel: string;
};

export function BusinessForm({ action, categories, business, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const err = state.fieldErrors ?? {};

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
          {categories.map((c) => (
            <option key={c.id} value={c.id} disabled={c.taken && c.id !== business?.category_id}>
              {c.name}
              {c.taken && c.id !== business?.category_id ? " (taken)" : ""}
            </option>
          ))}
        </Select>
        <FieldError id="category_id-error" messages={err.category_id} />
      </div>
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
