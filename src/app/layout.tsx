import type { Metadata, Viewport } from "next";
import { Baloo_2, DM_Mono, Nunito } from "next/font/google";
import { ConfettiCanvas } from "@/components/Confetti";
import { Header, Tabs } from "@/components/Header";
import { ProgressProvider } from "@/components/Progress";
import "./globals.css";

// Fonts are self-hosted by Next.js at build time, so child screens make no third-party requests.
const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "Bar Model Academy",
  description: "Singapore Math for Grades 1–8: bar model lessons, games and practice tests aligned to Common Core.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${dmMono.variable}`}>
      <body>
        <ProgressProvider>
          <ConfettiCanvas />
          <Header />
          <main className="wrap">
            <Tabs />
            {children}
          </main>
          <footer className="foot">
            No ads, no trackers. Progress is saved on this device only. Payments run in Stripe test mode.
          </footer>
        </ProgressProvider>
      </body>
    </html>
  );
}
