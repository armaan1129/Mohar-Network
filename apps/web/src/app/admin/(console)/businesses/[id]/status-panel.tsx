"use client";

import { useActionState } from "react";
import { FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";
import { setBusinessStatus } from "../../actions";

export function StatusPanel({
  businessId,
  status,
}: {
  businessId: string;
  status: "active" | "suspended" | "left";
}) {
  const [state, action, pending] = useActionState(
    setBusinessStatus.bind(null, businessId),
    initialActionState,
  );

  if (status === "left")
    return <p className="text-sm text-muted-foreground">This business has left the network.</p>;

  return (
    <div className="flex flex-col gap-4">
      <form action={action}>
        <input type="hidden" name="status" value={status === "active" ? "suspended" : "active"} />
        <Button type="submit" variant="outline" disabled={pending}>
          {status === "active" ? "Suspend" : "Reactivate"}
        </Button>
      </form>
      <form action={action} className="flex flex-col gap-2 border-t border-border pt-4">
        <input type="hidden" name="status" value="left" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" value="yes" className="size-4" />I understand that
          leaving is permanent.
        </label>
        <Button type="submit" variant="destructive" disabled={pending} className="self-start">
          Mark as left the network
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
