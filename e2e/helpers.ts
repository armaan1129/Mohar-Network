import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const LINK_RE = /https?:\/\/\S+\/verify\?\S+/;

type MailpitSearch = { messages?: { ID: string; Created: string }[] };

async function latestLink(email: string, since: number): Promise<string | null> {
  const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
  const { messages = [] } = (await res.json()) as MailpitSearch;
  const fresh = messages.find((m) => Date.parse(m.Created) >= since);
  if (!fresh) return null;
  const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${fresh.ID}`)).json()) as {
    Text: string;
  };
  return LINK_RE.exec(msg.Text)?.[0] ?? null;
}

/** Requests a magic link through the UI and follows it from the local Mailpit inbox. */
export async function signInByMagicLink(page: Page, email: string, next = "/app") {
  const since = Date.now() - 1000;
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("sign-in link is on its way");

  let link: string | null = null;
  await expect
    .poll(async () => (link = await latestLink(email, since)), { timeout: 15_000 })
    .not.toBeNull();
  await page.goto(link!);
}
