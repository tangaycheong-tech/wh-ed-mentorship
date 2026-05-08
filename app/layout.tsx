import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WH ED Mentorship Program",
  description: "Woodlands Hospital Emergency Department NC Mentorship Program",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}