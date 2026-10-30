import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sirhind Mohar", template: "%s · Sirhind Mohar" },
  description:
    "Earn ₹100 Sirhind Mohar notes at partner businesses in Sirhind and spend them at any partner.",
  metadataBase: new URL(process.env.APP_BASE_URL ?? "https://sirhindmohar.in"),
};

export const viewport: Viewport = {
  themeColor: "#7a2e1d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
