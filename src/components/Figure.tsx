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
  }
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
      <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Line plot: ${f.counts.map((c, i) => `${c} at ${f.start + i}`).join(", ")}`}>
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
