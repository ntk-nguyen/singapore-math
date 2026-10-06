"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GRADES, type Grade } from "@/lib/questions";
import { useProgress } from "./Progress";

const TABS = [
  { href: "/", label: "Learn" },
  { href: "/number-skills", label: "Number skills" },
  { href: "/times-tables", label: "Times tables" },
  { href: "/problem-solving", label: "Problem solving" },
  { href: "/play", label: "Play" },
  { href: "/tests", label: "Practice tests" },
  { href: "/grown-ups", label: "For grown-ups" },
];

export function Header() {
  const { grade, setGrade, stars } = useProgress();
  return (
    <header className="top">
      <div className="topin">
        <Link href="/" className="logo">
          <span className="mini" aria-hidden="true">
            <i style={{ width: 18, background: "var(--bar-a)" }} />
            <i style={{ width: 12, background: "var(--bar-b)" }} />
            <i style={{ width: 8, background: "var(--bar-c)" }} />
          </span>
          Bar Model Academy
        </Link>
        <label className="grade" htmlFor="gradeSel">
          Grade
          <select id="gradeSel" value={grade} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        <div className="stars" title="Stars earned" aria-label={`${stars} stars`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="var(--bar-c)" d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8z" />
          </svg>
          <span data-testid="star-count">{stars}</span>
        </div>
      </div>
    </header>
  );
}

export function Tabs() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
