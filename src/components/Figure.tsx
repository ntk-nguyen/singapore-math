import type { Figure } from "@/lib/figures";

const single = (noun: string) => (noun === "children" ? "child" : noun.replace(/s$/, ""));

/** A graph, table or program that a question is about. */
export function FigureView({ figure }: { figure: Figure }) {
  switch (figure.t) {
    case "bar":
      return <BarGraph f={figure} />;
    case "pict":
      return (
        <figure className="figure">
          <figcaption>{figure.title}</figcaption>
          <div className="pict">
            {figure.labels.map((l, i) => (
              <div key={l} className="pict-row">
                <span className="pict-label">{l}</span>
                <span className="pict-dots" aria-label={`${figure.counts[i]} dots`}>{"●".repeat(figure.counts[i])}</span>
              </div>
            ))}
          </div>
          <p className="muted small">Each ● = {figure.key} {figure.key === 1 ? single(figure.noun) : figure.noun}</p>
        </figure>
      );
    case "dots":
      return <LinePlot f={figure} />;
    case "table":
      return (
        <figure className="figure">
          <table className="ftable">
            <thead>
              <tr>{figure.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {figure.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => (j === 0 && figure.head[0] === "" ? <th key={j}>{c}</th> : <td key={j}>{c}</td>))}</tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    case "line":
      return <NumberLine f={figure} />;
    case "code":
      return (
        <figure className="figure">
          <pre className="code">{figure.lines.join("\n")}</pre>
        </figure>
      );
    case "pics":
      return <Pictures f={figure} />;
    case "frame":
      return <TenFrames f={figure} />;
    case "shape":
      return <ShapeView f={figure} />;
  }
}

/** Big pictures to count, in groups of five so they are easy to keep track of. Crossed-out ones are taken away. */
function Pictures({ f }: { f: Extract<Figure, { t: "pics" }> }) {
  return (
    <figure className="figure pics">
      {f.rows.map((r, i) => {
        const gone = r.gone ?? 0, keep = r.icons.length - gone;
        const fives = Array.from({ length: Math.ceil(r.icons.length / 5) }, (_, k) => r.icons.slice(5 * k, 5 * k + 5));
        return (
          <div key={i} className="pics-row" aria-label={`${r.label ? `${r.label}: ` : ""}${r.icons.length} pictures${gone ? `, ${gone} crossed out` : ""}`}>
            {r.label && <span className="pics-label">{r.label}</span>}
            <span className="pics-icons" aria-hidden="true">
              {fives.map((five, k) => (
                <span key={k} className="pics-five">
                  {five.map((icon, j) => <span key={j} className={5 * k + j >= keep ? "pic gone" : "pic"}>{icon}</span>)}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </figure>
  );
}

/** One or two ten frames: 2 rows of 5 boxes, filled left to right, top row first. */
function TenFrames({ f }: { f: Extract<Figure, { t: "frame" }> }) {
  return (
    <figure className="figure frames" aria-label={`${f.frames === 1 ? "A ten frame" : "Two ten frames"} with ${f.filled} dots`}>
      {Array.from({ length: f.frames }, (_, k) => (
        <div key={k} className="tenframe" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => <span key={i} className={10 * k + i < f.filled ? "cell on" : "cell"} />)}
        </div>
      ))}
    </figure>
  );
}

const SHAPE_FILL: Record<string, string> = { red: "#ef5350", blue: "#42a5f5", green: "#66bb6a", yellow: "#ffca28", purple: "#ab47bc", orange: "#ffa726" };

/** Corner points of a regular polygon with `n` sides, flat side down, centred at (60, 60). */
function polygon(n: number, r: number): string {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n;
    return `${(60 + r * Math.cos(a)).toFixed(1)},${(60 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/** A flat shape, big, in a bright color, sometimes turned so a child learns a turned square is still a square. */
function ShapeView({ f }: { f: Extract<Figure, { t: "shape" }> }) {
  const props = { fill: SHAPE_FILL[f.color], className: "shape-fill" };
  const body = {
    circle: <circle cx={60} cy={60} r={46} {...props} />,
    square: <rect x={18} y={18} width={84} height={84} rx={3} {...props} />,
    rectangle: <rect x={8} y={32} width={104} height={56} rx={3} {...props} />,
    triangle: <polygon points={polygon(3, 52)} transform="translate(0 8)" {...props} />,
    pentagon: <polygon points={polygon(5, 50)} {...props} />,
    hexagon: <polygon points={polygon(6, 50)} {...props} />,
  }[f.shape];
  return (
    <figure className="figure shape">
      <svg viewBox="0 0 120 120" role="img" aria-label={`A ${f.color} shape`}>
        <g transform={`rotate(${f.turn} 60 60)`}>{body}</g>
      </svg>
    </figure>
  );
}

function BarGraph({ f }: { f: Extract<Figure, { t: "bar" }> }) {
  const min = f.min ?? 0;
  const max = Math.max(min + f.step, Math.ceil(Math.max(...f.values) / f.step) * f.step);
  const W = 360, H = 220, L = 40, R = 12, T = 12, B = 32;
  const y = (v: number) => T + (H - T - B) * (1 - (v - min) / (max - min));
  const slot = (W - L - R) / f.values.length, bw = Math.min(56, slot * 0.6);
  const ticks: number[] = [];
  for (let v = min; v <= max; v += f.step) ticks.push(v);
  return (
    <figure className="figure">
      <figcaption>{f.title}</figcaption>
      <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar graph: ${f.labels.map((l, i) => `${l} ${f.values[i]}`).join(", ")}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text className="tick" x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {f.values.map((v, i) => (
          <g key={i}>
            <rect className="gbar" x={L + slot * i + (slot - bw) / 2} y={y(v)} width={bw} height={y(min) - y(v)} rx={3} />
            <text className="tick" x={L + slot * i + slot / 2} y={H - B + 18} textAnchor="middle">{f.labels[i]}</text>
          </g>
        ))}
        <line className="axis" x1={L} x2={L} y1={T} y2={y(min)} />
        <line className="axis" x1={L} x2={W - R} y1={y(min)} y2={y(min)} />
      </svg>
    </figure>
  );
}

function LinePlot({ f }: { f: Extract<Figure, { t: "dots" }> }) {
  const W = 360, R = 7, gap = 17, top = Math.max(...f.counts) * gap + 8, H = top + 40, L = 24;
  const step = (W - 2 * L) / (f.counts.length - 1);
  return (
    <figure className="figure">
      <figcaption>{f.title}</figcaption>
      <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Dot plot: ${f.counts.map((c, i) => `${c} at ${f.start + i}`).join(", ")}`}>
        <line className="axis" x1={L - 12} x2={W - L + 12} y1={top} y2={top} />
        {f.counts.map((c, i) => (
          <g key={i}>
            <line className="axis" x1={L + step * i} x2={L + step * i} y1={top - 4} y2={top + 4} />
            <text className="tick" x={L + step * i} y={top + 20} textAnchor="middle">{f.start + i}</text>
            {Array.from({ length: c }, (_, k) => (
              <circle key={k} className="gdot" cx={L + step * i} cy={top - 4 - R - k * gap} r={R} />
            ))}
          </g>
        ))}
        <text className="tick" x={W / 2} y={H - 2} textAnchor="middle">{f.unit}</text>
      </svg>
    </figure>
  );
}

function NumberLine({ f }: { f: Extract<Figure, { t: "line" }> }) {
  const W = 360, H = 84, L = 22, y = 48;
  const step = (W - 2 * L) / (f.ticks.length - 1), x = (i: number) => L + step * i;
  return (
    <figure className="figure numline">
      <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Number line from ${f.ticks[0]} to ${f.ticks[f.ticks.length - 1]} with an arrow at one tick`}>
        <line className="axis" x1={L - 10} x2={W - L + 10} y1={y} y2={y} />
        {f.ticks.map((t, i) => (
          <g key={i}>
            <line className="axis" x1={x(i)} x2={x(i)} y1={y - (t ? 8 : 5)} y2={y + (t ? 8 : 5)} />
            {t && <text className="tick" x={x(i)} y={y + 26} textAnchor="middle">{t}</text>}
          </g>
        ))}
        <path className="arrow" d={`M ${x(f.arrow)} ${y - 10} l -8 -14 h 16 z`} />
        <text className="tick" x={x(f.arrow)} y={12} textAnchor="middle">?</text>
      </svg>
    </figure>
  );
}
