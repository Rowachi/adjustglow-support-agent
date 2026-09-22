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
  title: "Adjustglow: outsourcad kundservice som blir recensioner",
  description:
    "Adjustglow sköter livechatt, e-post och telefon åt ditt företag, och förvandlar lösta ärenden till recensioner som publiceras direkt på Google och Trustpilot.",
  icons: {
    icon: "/favicon.svg",
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
