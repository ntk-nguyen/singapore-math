/** The MathBridge mark from the Stitch design: three growing bars bridged by a dotted arc. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 62 28" aria-hidden="true">
      <path d="M3 15.5Q20 1.5 46 4" fill="none" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 3.4" />
      <rect x="0" y="16" width="14" height="11" rx="3" fill="#3b82f6" />
      <rect x="16" y="12" width="18" height="15" rx="3.5" fill="#4f46e5" />
      <rect x="36" y="6" width="25" height="21" rx="4.5" fill="#f59e0b" />
      <circle cx="48" cy="4" r="3.4" fill="#10b981" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="brand">
      <LogoMark className="brand-mark" />
      <span className="brand-text">
        <span className="brand-name">Math<b>Bridge</b></span>
        <span className="brand-tag">Singapore method</span>
      </span>
    </span>
  );
}
