import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Loan Advisor",
  description: "Get loan recommendations and EMI numbers you can trust, explained in plain language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
