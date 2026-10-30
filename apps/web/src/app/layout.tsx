import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "The Mohar Network", template: "%s · Mohar Network" },
  description:
    "Earn ₹100 Mohar notes at partner businesses in your city and spend them at any partner.",
  metadataBase: new URL(process.env.APP_BASE_URL ?? "https://themoharnetwork.com"),
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
