"use client";

import { useActionState, useState } from "react";
import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { createCategory, deleteCategory, updateCategory } from "../actions";

export function NewCategoryForm() {
  const [state, action, pending] = useActionState(createCategory, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="new-name">Name (English)</Label>
        <Input
          id="new-name"
          name="name"
          required
          aria-describedby="new-name-error"
          aria-invalid={!!state.fieldErrors?.name}
        />
        <FieldError id="new-name-error" messages={state.fieldErrors?.name} />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="new-name-pa">Name (ਪੰਜਾਬੀ)</Label>
        <Input id="new-name-pa" name="name_pa" lang="pa" />
      </div>
      <Button type="submit" disabled={pending}>
        Add
      </Button>
      <div className="sm:hidden">
        <FormError message={state.error} />
      </div>
      {state.error && (
        <div className="hidden sm:block">
          <FormError message={state.error} />
        </div>
      )}
    </form>
  );
}

type Category = { id: string; name: string; name_pa: string | null };

export function CategoryRow({ category, holder }: { category: Category; holder?: string }) {
  const [editing, setEditing] = useState(false);
  const [saveState, save, saving] = useActionState(
    updateCategory.bind(null, category.id),
    initialActionState,
  );
  const [deleteState, remove, deleting] = useActionState(
    deleteCategory.bind(null, category.id),
    initialActionState,
  );

  if (editing && !saveState.ok) {
    return (
      <form action={save} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
        <Input name="name" defaultValue={category.name} aria-label="Name (English)" required />
        <Input
          name="name_pa"
          defaultValue={category.name_pa ?? ""}
          aria-label="Name (Punjabi)"
          lang="pa"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <FormError message={saveState.error ?? saveState.fieldErrors?.name?.[0]} />
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">
          {category.name}{" "}
          {category.name_pa && (
            <span lang="pa" className="text-muted-foreground">
              · {category.name_pa}
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{holder ? `Held by ${holder}` : "Open"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
        {!holder && (
          <form action={remove}>
            <Button size="sm" variant="ghost" disabled={deleting}>
              Delete
            </Button>
          </form>
        )}
      </div>
      <FormError message={deleteState.error} />
    </div>
  );
}
