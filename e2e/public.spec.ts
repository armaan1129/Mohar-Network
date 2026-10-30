import { expect, test } from "@playwright/test";

test("home shows the bilingual name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "The Mohar Network" })).toBeVisible();
  await expect(page.getByText("ਮੋਹਰ ਨੈੱਟਵਰਕ")).toBeVisible();
  await expect(page.getByText("مہر نیٹ ورک")).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const headers = res.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});

for (const path of ["/admin", "/admin/businesses", "/app"]) {
  test(`${path} requires sign-in`, async ({ page, baseURL }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Partner sign in" })).toBeVisible();
    const url = new URL(page.url());
    // Same host as requested: a redirect to another host (e.g. localhost) would drop the session cookie.
    expect(url.host).toBe(new URL(baseURL!).host);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe(path);
  });
}
