/** Turns a PostgREST / Postgres error into a message an admin can act on. */
export function describeDbError(error: {
  code?: string;
  message?: string;
  details?: string | null;
}): string {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  if (error.code === "23505") {
    if (text.includes("businesses_one_per_category")) {
      return "This category already has an active or suspended business. Only one business per category is allowed.";
    }
    if (text.includes("categories_name_key")) return "A category with this name already exists.";
    if (text.includes("business_users_one_business_per_user")) {
      return "This person is already linked to another business. A login can belong to one business only.";
    }
    if (text.includes("business_users_pkey"))
      return "This person is already on this business's staff.";
    return "That would create a duplicate.";
  }
  if (error.code === "23503") return "This is still in use, so it cannot be removed.";
  if (error.code === "42501")
    return "You don't have permission to do that. Admin actions need a session verified with your authenticator app.";
  if (text.includes("MOHAR_BUSINESS_LEFT"))
    return "A business that has left cannot be reactivated. Create a new business instead.";
  if (error.code === "23514") return "Some values are not allowed. Check the form and try again.";
  return "Something went wrong. Please try again.";
}
