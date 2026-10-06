import type { BarModelSpec } from "@/lib/models";

type SegKind = "a" | "b" | "c" | "q" | "e";

function Seg({ kind, grow, children }: { kind: SegKind; grow: number; children?: React.ReactNode }) {
  return (
    <div className={`seg ${kind}`} style={{ flexGrow: grow }}>
      {children}
    </div>
  );
}

function Row({ label, children, brace, width }: { label: string; children: React.ReactNode; brace?: React.ReactNode; width?: string }) {
  return (
    <div className="mrow">
      <div className="mlabel">{label}</div>
      <div className="bars" style={width ? { width } : undefined}>
        {children}
      </div>
      {brace != null && <div className="brace">{brace}</div>}
    </div>
  );
}

/** Renders a Singapore Math bar model or number bond from a spec. */
export function BarModel({ spec }: { spec: BarModelSpec }) {
  return (
    <div className="model" role="img" aria-label="Bar model">
      <ModelBody spec={spec} />
    </div>
  );
}

function ModelBody({ spec: m }: { spec: BarModelSpec }) {
  switch (m.t) {
    case "bond": {
      const [a, b] = m.p;
      return (
        <div className="bond">
          <svg className="lines" viewBox="0 0 240 192" preserveAspectRatio="none" aria-hidden="true">
            <line x1="120" y1="70" x2="60" y2="125" stroke="var(--muted)" strokeWidth="3" />
            <line x1="120" y1="70" x2="180" y2="125" stroke="var(--muted)" strokeWidth="3" />
          </svg>
          <div className="circ w">{m.w}</div>
          <div className={`circ p1${a == null ? " q" : ""}`}>{a ?? "?"}</div>
          <div className={`circ p2${b == null ? " q" : ""}`}>{b ?? "?"}</div>
        </div>
      );
    }
    case "pw": {
      const whole = m.whole ?? m.parts.reduce((s, p) => s + p, 0);
      return (
        <Row label="Total" brace={m.unk === "whole" ? "?" : whole}>
          {m.parts.map((p, i) =>
            m.unk === i ? (
              <Seg key={i} kind="q" grow={p}>?</Seg>
            ) : (
              <Seg key={i} kind={i ? "b" : "a"} grow={p}>
                {p} {m.labels[i]}
              </Seg>
            ),
          )}
        </Row>
      );
    }
    case "cmp": {
      const unk = m.unk ?? "big";
      const diff = m.b - m.a;
      // With a total given, the bars themselves are unknown: show "?" instead of their values.
      const small = m.total != null || unk === "small" ? "?" : m.a;
      return (
        <>
          <Row label={m.names[0]} brace={unk === "small" ? "?" : undefined}>
            <Seg kind={small === "?" ? "q" : "a"} grow={m.a}>{small}</Seg>
            <div style={{ flexGrow: diff }} />
          </Row>
          <Row label={m.names[1]} brace={unk === "big" ? "?" : undefined}>
            <Seg kind={small === "?" ? "q" : "a"} grow={m.a}>{small}</Seg>
            <Seg kind="c" grow={diff}>{unk === "diff" ? "?" : `${diff} more`}</Seg>
          </Row>
          {m.total != null && <p className="muted small">Both bars together = {m.total}.</p>}
        </>
      );
    }
    case "units":
      return (
        <>
          <Row label={`${m.n} units`} brace={m.total ?? "?"}>
            {Array.from({ length: m.n }, (_, i) => (
              <Seg key={i} kind={i < m.shade ? "b" : "q"} grow={1}>{m.unit ?? ""}</Seg>
            ))}
          </Row>
          <p className="muted small">
            {m.note ?? (m.total ? `Each box is one unit. ${m.n} units = ${m.total}, so 1 unit = ${m.total} ÷ ${m.n}.` : "Each box is one unit. Count the shaded units.")}
          </p>
        </>
      );
    case "ratio": {
      const max = Math.max(m.r, m.b);
      return (
        <>
          <Row label={m.names?.[0] ?? "Red"} width={`${(m.r / max) * 100}%`}>
            {Array.from({ length: m.r }, (_, i) => <Seg key={i} kind="a" grow={1} />)}
          </Row>
          <Row label={m.names?.[1] ?? "Blue"} width={`${(m.b / max) * 100}%`}>
            {Array.from({ length: m.b }, (_, i) => <Seg key={i} kind="b" grow={1} />)}
          </Row>
          <p className="muted small">
            {m.r + m.b} units = {m.total} {m.noun ?? "marbles"}. Find 1 unit first.
          </p>
        </>
      );
    }
    case "eq":
      return (
        <>
          <Row label="Total" brace={m.total}>
            {Array.from({ length: m.n }, (_, i) => (
              <Seg key={i} kind={m.x == null ? "q" : "b"} grow={2}>{m.x ?? "x"}</Seg>
            ))}
            {m.c > 0 && <Seg kind="c" grow={Math.max(1, Math.min(m.n, (m.c / Math.max(1, m.total - m.c)) * m.n * 2))}>{m.c}</Seg>}
          </Row>
          <p className="muted small">
            {m.c > 0
              ? `${m.n} units of x and ${m.c} make ${m.total}. Take away ${m.c}, then share what is left among ${m.n} units.`
              : `${m.n} units of x make ${m.total}. Share ${m.total} among ${m.n} units.`}
          </p>
        </>
      );
    case "fbars":
      return (
        <>
          {m.bars.map((b, i) => (
            <Row key={i} label={b.label ?? `${b.n}/${b.d}`}>
              {Array.from({ length: b.d }, (_, k) => <Seg key={k} kind={k < b.n ? "b" : "e"} grow={1} />)}
            </Row>
          ))}
          {m.note && <p className="muted small">{m.note}</p>}
        </>
      );
  }
}
