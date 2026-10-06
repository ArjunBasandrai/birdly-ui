import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Birdly Bird identification",
  description:
    "Identify bird species of New York state from uploaded photographs.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f8f3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
