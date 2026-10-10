"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GRADES, type Grade } from "@/lib/questions";
import { CrownIcon, FlameIcon, StarIcon } from "./Icons";
import { Logo } from "./Logo";
import { useProgress } from "./Progress";
import { ThemeToggle } from "./ThemeToggle";
import { usePlan } from "./usePlan";

/** Learn is the home page; the topic pages it links to count as part of it. */
const LEARN = ["/lessons", "/number-skills", "/fractions", "/problem-solving"];
const TABS = [
  { href: "/", label: "Learn" },
  { href: "/play", label: "Play" },
  { href: "/times-tables", label: "Times tables" },
  { href: "/tests", label: "Practice tests" },
  { href: "/parents", label: "Parents" },
  { href: "/pro", label: "Upgrade to Pro", pro: true },
];

export function Header() {
  const { grade, setGrade, xp, streak, ready } = useProgress();
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
          {ready && (
            <div className="chip-stat streak" title={streak ? `${streak} days in a row` : "Practice today to start a streak"} aria-label={`${streak} day streak`}>
              <FlameIcon />
              <b>{streak}</b>
              <span className="cs-unit">{streak === 1 ? "day" : "days"}</span>
            </div>
          )}
          <div className="chip-stat xp" title="XP earned" aria-label={`${xp} XP`}>
            <StarIcon />
            <b data-testid="xp-count">{xp.toLocaleString("en-US")}</b>
            <span className="cs-unit">XP</span>
          </div>
          {pro ? (
            <Link className="gopro on" href="/parents" title="Pro plan is active">
              <CrownIcon />
              <span className="gopro-label">Pro</span>
            </Link>
          ) : (
            <Link className="gopro" href="/pro" aria-label="Go Pro">
              <CrownIcon />
              <span className="gopro-label">Go Pro</span>
            </Link>
          )}
          <ThemeToggle />
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
