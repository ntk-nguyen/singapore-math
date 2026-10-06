"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GRADES, type Grade } from "@/lib/questions";
import { CrownIcon } from "./Icons";
import { Logo } from "./Logo";
import { useProgress } from "./Progress";
import { usePlan } from "./usePlan";

/** Learn is the home page; the topic pages it links to count as part of it. */
const LEARN = ["/lessons", "/number-skills", "/fractions", "/problem-solving"];
const TABS = [
  { href: "/", label: "Learn" },
  { href: "/play", label: "Play" },
  { href: "/times-tables", label: "Times tables" },
  { href: "/tests", label: "Practice tests" },
  { href: "/grown-ups", label: "For grown-ups" },
  { href: "/pro", label: "Upgrade to Pro", pro: true },
];

export function Header() {
  const { grade, setGrade, stars } = useProgress();
  const [plan] = usePlan();
  const pro = !!plan?.pro;
  return (
    <header className="top">
      <div className="topin">
        <Link href="/" className="logo" aria-label="MathBridge home">
          <Logo />
        </Link>
        <Tabs pro={pro} />
        <div className="meta">
          <label className="grade" htmlFor="gradeSel">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8z" />
            </svg>
            <span className="sr-only">Grade</span>
            <select id="gradeSel" value={grade} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
              {GRADES.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </label>
          <div className="stars" title="Stars earned" aria-label={`${stars} stars`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="var(--amber)" d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8z" />
            </svg>
            <span data-testid="star-count">{stars}</span>
          </div>
          {pro ? (
            <Link className="gopro on" href="/grown-ups" title="Pro plan is active">
              <CrownIcon />
              <span className="gopro-label">Pro</span>
            </Link>
          ) : (
            <Link className="gopro" href="/pro" aria-label="Go Pro">
              <CrownIcon />
              <span className="gopro-label">Go Pro</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Tabs({ pro }: { pro: boolean }) {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  // On phones the tabs scroll sideways, so bring the current one into view.
  useEffect(() => {
    const el = nav.current;
    const cur = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && cur && el.scrollWidth > el.clientWidth) el.scrollLeft = cur.offsetLeft - (el.clientWidth - cur.offsetWidth) / 2;
  }, [path]);
  const active = (href: string) => (href === "/" ? path === "/" || LEARN.some((p) => path.startsWith(p)) : path.startsWith(href));
  return (
    <nav ref={nav} className="tabs" aria-label="Sections">
      {TABS.filter((t) => !(t.pro && pro)).map((t) => (
        <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined} className={t.pro ? "upsell" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
