import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(
    host ? `${protocol}://${host}` : "http://localhost:3000",
  );

  return {
    metadataBase,
    title: "HablaPE — Orientación clara para actuar informado",
    description:
      "Demo de orientación sobre control de identidad policial y reclamos de consumo en Perú.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "HablaPE — Conoce el procedimiento. Actúa informado.",
      description:
        "Una demo peruana que separa tus hechos, la fuente oficial y el siguiente paso.",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
      type: "website",
      locale: "es_PE",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
