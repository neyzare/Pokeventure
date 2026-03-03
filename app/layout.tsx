import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokeVenture",
  description: "Explore, combats, capture… et deviens une légende.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/logo.svg" />
      </head>
      <body>
        <div
          data-theme="light"
          className="min-h-screen bg-base-100 text-base-content flex flex-col"
        >
          <Nav />
          <div className="container m-auto mt-4">
            <div className="p-4">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
