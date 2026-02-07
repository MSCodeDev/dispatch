import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Dispatch",
  description: "Personal dispatch and task management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
