import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { TopContext } from "@/components/TopContext";
import { AutoBreadcrumbs } from "@/components/AutoBreadcrumbs";

export const metadata: Metadata = {
  title: "Health & Wellness Marketplace",
  description: "Match patients with practitioners."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="container py-6">
            <TopContext />
            <AutoBreadcrumbs />
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
