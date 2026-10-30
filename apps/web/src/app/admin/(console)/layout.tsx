import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/categories", label: "Categories" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold text-primary">
            Mohar Admin
          </Link>
          <nav aria-label="Admin" className="flex flex-wrap gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form
            action="/auth/signout"
            method="post"
            className="ml-auto flex items-center gap-3 text-sm"
          >
            <span className="hidden text-muted-foreground sm:inline">{viewer.user.email}</span>
            <button className="underline underline-offset-4">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
