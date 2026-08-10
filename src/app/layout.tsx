import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmaSim",
  description: "Aprende, practica y simula situaciones de capacitación.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
