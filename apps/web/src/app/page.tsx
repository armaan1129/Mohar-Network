import Link from "next/link";

// Placeholder home. The full bilingual public site and partner directory arrive in milestone 4.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Sirhind Mohar</h1>
        <p lang="pa" className="text-2xl text-foreground">
          ਸਰਹਿੰਦ ਮੋਹਰ
        </p>
        <p lang="ur" dir="rtl" className="text-2xl text-foreground">
          سرہند مہر
        </p>
      </div>
      <p className="text-lg text-muted-foreground">
        Earn ₹100 Mohar notes when you shop at a partner business, and spend them at any partner.
      </p>
      <Link href="/login" className="text-sm font-medium text-primary underline underline-offset-4">
        Partner sign in
      </Link>
    </main>
  );
}
