import { expect, test } from "@playwright/test";

test("home shows the bilingual name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sirhind Mohar" })).toBeVisible();
  await expect(page.getByText("ਸਰਹਿੰਦ ਮੋਹਰ")).toBeVisible();
  await expect(page.getByText("سرہند مہر")).toBeVisible();
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
  test(`${path} requires sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/%2F/g, "%2F")}`),
    );
    await expect(page.getByRole("heading", { name: "Partner sign in" })).toBeVisible();
  });
}
