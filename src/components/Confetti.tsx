"use client";

import { useEffect, useRef } from "react";

const EVENT = "bma-confetti";

/** Fire a burst of confetti from anywhere in the app. */
export function confetti() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

interface Piece { x: number; y: number; vx: number; vy: number; s: number; c: string; life: number }

export function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let pieces: Piece[] = [];
    let frame = 0;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.life--;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s * 0.6);
      }
      pieces = pieces.filter((p) => p.life > 0);
      frame = pieces.length ? requestAnimationFrame(tick) : 0;
    };

    const burst = () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      const style = getComputedStyle(document.documentElement);
      const cols = ["--bar-a", "--bar-b", "--bar-c", "--accent"].map((c) => style.getPropertyValue(c));
      for (let i = 0; i < 120; i++) {
        pieces.push({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - 0.5) * 12, vy: Math.random() * -10 - 2, s: Math.random() * 8 + 4, c: cols[i % 4], life: 90 });
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener(EVENT, burst);
    return () => {
      window.removeEventListener(EVENT, burst);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className="fx" aria-hidden="true" />;
}
