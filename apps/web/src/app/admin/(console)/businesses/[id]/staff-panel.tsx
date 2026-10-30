"use client";

import { useActionState } from "react";
import { FieldError, FormError } from "@/components/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { inviteStaff, removeStaff } from "../../actions";

type Person = { user_id: string; role: "owner" | "cashier"; email: string; confirmed: boolean };

export function StaffPanel({ businessId, people }: { businessId: string; people: Person[] }) {
  const [state, action, pending] = useActionState(
    inviteStaff.bind(null, businessId),
    initialActionState,
  );

  return (
    <div className="flex flex-col gap-5">
      <ul className="divide-y divide-border">
        {people.map((p) => (
          <StaffRow key={p.user_id} businessId={businessId} person={p} />
        ))}
        {!people.length && (
          <li className="py-2 text-sm text-muted-foreground">
            No staff yet. Invite the owner first.
          </li>
        )}
      </ul>
      <form
        action={action}
        className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="invite-email">Invite by email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            aria-describedby="invite-email-error"
          />
          <FieldError id="invite-email-error" messages={state.fieldErrors?.email} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select id="invite-role" name="role" defaultValue="owner">
            <option value="owner">Owner</option>
            <option value="cashier">Cashier</option>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Invite"}
        </Button>
      </form>
      <FormError message={state.error} />
      {state.ok && (
        <p role="status" className="text-sm text-success">
          {state.message}
        </p>
      )}
    </div>
  );
}

function StaffRow({ businessId, person }: { businessId: string; person: Person }) {
  const [state, action, pending] = useActionState(
    removeStaff.bind(null, businessId, person.user_id),
    initialActionState,
  );
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="flex items-center gap-2 text-sm">
        {person.email}
        <Badge>{person.role}</Badge>
        {!person.confirmed && <Badge tone="warning">invited</Badge>}
      </span>
      <form action={action}>
        <Button size="sm" variant="ghost" disabled={pending}>
          Remove
        </Button>
      </form>
      <FormError message={state.error} />
    </li>
  );
}
