import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ConfettiCanvas } from "@/components/Confetti";
import { Header } from "@/components/Header";
import { LogoMark } from "@/components/Logo";
import { WhoIsPracticing } from "@/components/Profiles";
import { ProgressProvider } from "@/components/Progress";
import { PlanProvider } from "@/components/usePlan";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Fonts are self-hosted by Next.js at build time, so child screens make no third-party requests.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-jakarta" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "MathBridge", template: "%s · MathBridge" },
  description: "Singapore Math for Grades 1–8: bar model lessons, games and practice tests aligned to Common Core.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets data-theme on <html> before React hydrates, so React must accept it.
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ProgressProvider>
          <PlanProvider>
            <ConfettiCanvas />
            <Header />
            <WhoIsPracticing />
            <main className="wrap">{children}</main>
            <footer className="foot">
              <div className="footin">
                <b><LogoMark className="foot-mark" />MathBridge</b>
                <span>Concrete · Pictorial · Abstract. No ads, no trackers. Progress is saved on this device only. Payments run in Stripe test mode.</span>
                <nav className="footlinks" aria-label="More">
                  <Link href="/parents">Parents</Link>
                  <Link href="/pro">Pro plan</Link>
                </nav>
              </div>
            </footer>
          </PlanProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
