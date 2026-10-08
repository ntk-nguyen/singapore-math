"use client";

import { useLayoutEffect, useState } from "react";
import { THEME_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

function current(): Theme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Light and dark mode. Follows the device until the child picks one, then remembers it. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useLayoutEffect(() => {
    // Re-apply the saved choice (React drops the attribute on the dev-mode remount), then read the theme in use.
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    } catch {
      /* storage unavailable: follow the device */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current());
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => setTheme(current());
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);

  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* the choice lasts for this visit only */
    }
    setTheme(next);
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="themebtn"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {dark ? (
          <path
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1.5v2M12 20.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
          />
        ) : (
          <path fill="currentColor" d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5z" />
        )}
      </svg>
    </button>
  );
}
