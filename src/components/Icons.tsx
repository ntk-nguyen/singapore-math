/** Small inline icons, drawn here so pages make no third-party font requests. */
type P = { d: string; stroke?: boolean };

function Icon({ d, stroke }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {stroke ? (
        <path d={d} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={d} fill="currentColor" />
      )}
    </svg>
  );
}

export const BarsIcon = () => <Icon d="M3 6h11v4H3zM3 14h18v4H3zM16 6h5v4h-5z" />;
export const NumbersIcon = () => <Icon stroke d="M7 4v6M4 7h6M14 7h6M5 15l4 4M9 15l-4 4M14 15h6M14 19h6" />;
export const FractionIcon = () => <Icon d="M12 2a10 10 0 1 0 10 10H12V2zm2 0v8h8a10 10 0 0 0-8-8z" />;
export const AlgebraIcon = () => <Icon stroke d="M4 6l6 12M10 6 4 18M14 10h6M14 14h6" />;
export const PathIcon = () => <Icon stroke d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6M6 21a2 2 0 1 0 0-.01M18 3a2 2 0 1 0 0 .01" />;
export const PlayIcon = () => <Icon d="M8 5v14l11-7z" />;
export const CheckIcon = () => <Icon stroke d="M5 12.5l4.5 4.5L19 7.5" />;
export const LockIcon = () => (
  <Icon d="M6 10V7a6 6 0 1112 0v3h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1h1zm2 0h8V7a4 4 0 10-8 0v3z" />
);
export const ChevronIcon = () => <Icon stroke d="M9 6l6 6-6 6" />;
export const ArrowIcon = () => <Icon stroke d="M5 12h14M13 6l6 6-6 6" />;
export const BoltIcon = () => <Icon d="M13 2 4 14h7l-1 8 9-12h-7z" />;
export const TargetIcon = () => <Icon stroke d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 12h.01" />;
export const GridIcon = () => <Icon stroke d="M4 4h16v16H4zM4 9.33h16M4 14.66h16M9.33 4v16M14.66 4v16" />;
export const CrownIcon = () => <Icon d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7zm2 13h14v2H5z" />;
