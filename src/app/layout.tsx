import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ConfettiCanvas } from "@/components/Confetti";
import { Header } from "@/components/Header";
import { ProgressProvider } from "@/components/Progress";
import "./globals.css";

// Fonts are self-hosted by Next.js at build time, so child screens make no third-party requests.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-jakarta" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bar Model Academy",
  description: "Singapore Math for Grades 1–8: bar model lessons, games and practice tests aligned to Common Core.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body>
        <ProgressProvider>
          <ConfettiCanvas />
          <Header />
          <main className="wrap">{children}</main>
          <footer className="foot">
            <div className="footin">
              <b>Bar Model Academy</b>
              <span>No ads, no trackers. Progress is saved on this device only. Payments run in Stripe test mode.</span>
            </div>
          </footer>
        </ProgressProvider>
      </body>
    </html>
  );
}
