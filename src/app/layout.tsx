import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { MapProvider } from "@/contexts/MapContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Favicon />
      </head>
      <body className="overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MapProvider>{children}</MapProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function Favicon() {
  return (
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📍</text></svg>"
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "sfdata.app",
    description: "San Francisco. Visualized.",
    openGraph: {
      title: "sfdata.app",
      description: "San Francisco. Visualized.",
    },
  };
}
