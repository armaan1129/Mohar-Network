"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formToObject, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth";
import { describeDbError } from "@/lib/db-errors";
import { serverEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import {
  businessRow,
  businessSchema,
  businessStatusSchema,
  categorySchema,
  citySchema,
  staffInviteSchema,
} from "@/lib/validation/admin";

// Every action re-checks admin + MFA: server actions are public endpoints.
// Writes use the admin's own session, so RLS applies and the audit log records who did it.

const idSchema = z.uuid();

// ----------------------------------------------------------------- cities

export async function createCity(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = citySchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase
    .from("cities")
    .insert({ ...parsed.data, name_pa: parsed.data.name_pa ?? null });
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/cities");
  return { ok: true, message: `Added ${parsed.data.name} (${parsed.data.code}).` };
}

/** Code is not editable here: it is printed on every note of that city. */
export async function updateCity(
  id: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = citySchema.omit({ code: true }).safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase
    .from("cities")
    .update({ ...parsed.data, name_pa: parsed.data.name_pa ?? null })
    .eq("id", idSchema.parse(id));
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/cities");
  return { ok: true, message: "Saved." };
}

// ----------------------------------------------------------------- categories

export async function createCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = categorySchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name, name_pa: parsed.data.name_pa ?? null });
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/categories");
  return { ok: true, message: `Added “${parsed.data.name}”.` };
}

export async function updateCategory(
  id: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = categorySchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name, name_pa: parsed.data.name_pa ?? null })
    .eq("id", idSchema.parse(id));
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/categories");
  return { ok: true, message: "Saved." };
}

export async function deleteCategory(id: string, _prev: ActionState): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", idSchema.parse(id));
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "This category has businesses (including past ones), so it can't be deleted."
          : describeDbError(error),
    };
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

// ----------------------------------------------------------------- businesses

export async function createBusiness(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = businessSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...businessRow(parsed.data), city_id: parsed.data.city_id })
    .select("id")
    .single();
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/businesses");
  redirect(`/admin/businesses/${data.id}`);
}

export async function updateBusiness(
  id: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = businessSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const { error } = await supabase
    .from("businesses")
    .update(businessRow(parsed.data))
    .eq("id", idSchema.parse(id));
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
  return { ok: true, message: "Saved." };
}

export async function setBusinessStatus(
  id: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const status = businessStatusSchema.safeParse(form.get("status"));
  if (!status.success) return { error: "Unknown status." };
  if (status.data === "left" && form.get("confirm") !== "yes") {
    return { error: "Tick the box to confirm. Leaving the network is permanent." };
  }

  const { error } = await supabase
    .from("businesses")
    .update({ status: status.data })
    .eq("id", idSchema.parse(id));
  if (error) return { error: describeDbError(error) };
  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
  return { ok: true, message: `Status set to ${status.data}.` };
}

// ----------------------------------------------------------------- staff

/**
 * Invites a person by email (or finds their existing login) and links them to the business.
 * Only the Auth admin call uses the service role; the link itself is written as the admin.
 */
export async function inviteStaff(
  businessId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = staffInviteSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { email, role } = parsed.data;

  const service = createServiceClient();
  const redirectTo = `${serverEnv().APP_BASE_URL}/auth/callback?next=/app`;
  const invited = await service.auth.admin.inviteUserByEmail(email, { redirectTo });

  let userId = invited.data.user?.id;
  if (!userId) {
    // Already has a login: look it up without sending anything.
    const existing = await service.auth.admin.generateLink({ type: "magiclink", email });
    userId = existing.data.user?.id;
  }
  if (!userId) return { error: "Could not invite this email. Check the address and try again." };

  const { error } = await supabase
    .from("business_users")
    .insert({ business_id: idSchema.parse(businessId), user_id: userId, role });
  if (error) return { error: describeDbError(error) };

  revalidatePath(`/admin/businesses/${businessId}`);
  return {
    ok: true,
    message: invited.data.user
      ? `Invitation sent to ${email}.`
      : `${email} already had a login and is now linked.`,
  };
}

export async function removeStaff(
  businessId: string,
  userId: string,
  _prev: ActionState,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("business_users")
    .delete()
    .eq("business_id", idSchema.parse(businessId))
    .eq("user_id", idSchema.parse(userId));
  if (error) return { error: describeDbError(error) };
  revalidatePath(`/admin/businesses/${businessId}`);
  return { ok: true };
}
