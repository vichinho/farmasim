import type { Metadata } from "next";
import "./globals.css";

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "FarmaSim",
  description: "Aprende, practica y simula situaciones de capacitación.",
  openGraph: {
    description: "Entrenamiento interactivo con casos ficticios, decisiones y feedback.",
    images: [
      {
        alt: "FarmaSim — Aprende. Practica. Simula.",
        height: 909,
        url: "/og.png",
        width: 1731,
      },
    ],
    title: "FarmaSim — Aprende. Practica. Simula.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description: "Entrenamiento interactivo con casos ficticios, decisiones y feedback.",
    images: ["/og.png"],
    title: "FarmaSim — Aprende. Practica. Simula.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
