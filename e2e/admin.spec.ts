import { expect, test } from "@playwright/test";
import { authenticator } from "otplib";
import { signInByMagicLink } from "./helpers";

// Needs the local Supabase stack with seed data (CI runs `supabase start`).
test.skip(!process.env.E2E_SUPABASE, "set E2E_SUPABASE=1 with a local Supabase stack running");

test.describe.configure({ mode: "serial" });

test("admin signs in with magic link + TOTP and manages businesses", async ({ page }) => {
  await signInByMagicLink(page, "admin@mohar.test", "/admin");

  // First visit: enrol TOTP from the secret shown on screen, then verify.
  await expect(page).toHaveURL(/\/admin\/mfa/);
  const secret = (await page.locator("code").textContent())!.trim();
  await page.getByLabel("6-digit code").fill(authenticator.generate(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { name: "Network overview" })).toBeVisible();

  // One business per category: Café is held by Demo Café, so it is offered as taken.
  await page.goto("/admin/businesses/new");
  await expect(page.getByRole("option", { name: "Café (taken)" })).toBeDisabled();

  // A new category, then a business in it.
  const category = `E2E Category ${Date.now()}`;
  await page.goto("/admin/categories");
  await page.getByLabel("Name (English)").first().fill(category);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(category)).toBeVisible();

  await page.goto("/admin/businesses/new");
  await page.getByLabel("Business name").fill("E2E Shop");
  await page.getByLabel("Category").selectOption({ label: category });
  await page.getByLabel("Address").fill("E2E Street, Sirhind");
  await page.getByLabel("Phone").fill("98765 43210");
  await page.getByRole("button", { name: "Create business" }).click();
  await expect(page.getByRole("heading", { name: "E2E Shop" })).toBeVisible();
  await expect(page.getByLabel("Phone")).toHaveValue("+919876543210");

  // Suspend keeps the category; the directory hides suspended businesses.
  await page.getByRole("button", { name: "Suspend" }).click();
  await expect(page.getByRole("status")).toContainText("suspended");
});

test("an owner cannot open the admin console", async ({ page }) => {
  await signInByMagicLink(page, "owner.cafe@mohar.test", "/app");
  await expect(page.getByRole("heading", { name: "Demo Café" })).toBeVisible();
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});
