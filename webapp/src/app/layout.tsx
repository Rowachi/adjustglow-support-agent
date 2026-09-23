import type { Metadata } from "next";
import { MotionProvider } from "@/components/MotionProvider";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://adjustglow.com"),
  title: "Adjustglow: outsourcad kundservice som blir recensioner",
  description:
    "Adjustglow sköter livechatt, e-post och telefon åt ditt företag, ber varje kund om ett omdöme och gör det till ett tryck för kunden att dela det på Google och Trustpilot.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  // Google Search Console ownership proof for the https://adjustglow.com/
  // URL-prefix property. Must stay in place: Google re-checks it periodically
  // and drops verification if it disappears.
  verification: {
    google: "Hm1PVXfS14A5Y7GCi3dwiEd9xUriQGoSlhMU9HjieG4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>
        <div className="grain" aria-hidden="true" />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
