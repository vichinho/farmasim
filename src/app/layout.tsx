import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./responsive-audit.css";
import "./simulation-desktop.css";
import "./simulation-motion.css";
import "./simulation-theme.css";

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "FarmaVerse",
  title: "FarmaVerse",
  description: "Aprende, practica y simula situaciones de capacitación.",
  openGraph: {
    description: "Entrenamiento interactivo con casos ficticios, decisiones y feedback.",
    images: [
      {
        alt: "FarmaVerse — Aprende. Practica. Simula.",
        height: 630,
        url: "/og.png",
        width: 1200,
      },
    ],
    title: "FarmaVerse — Aprende. Practica. Simula.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description: "Entrenamiento interactivo con casos ficticios, decisiones y feedback.",
    images: ["/og.png"],
    title: "FarmaVerse — Aprende. Practica. Simula.",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
