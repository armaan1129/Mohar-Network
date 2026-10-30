/** Return value of form server actions, consumed with useActionState. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = {};

/** FormData → plain object, with blank strings dropped so optional fields parse as undefined. */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && value.trim() !== "") out[key] = value.trim();
  }
  return out;
}
