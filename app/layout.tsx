import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Birdly — Bird identification",
  description: "Identify a bird species from a selected area of a photograph.",
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
