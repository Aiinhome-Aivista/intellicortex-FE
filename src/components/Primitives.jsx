import { cn } from "../lib/utils.js";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="px-8 pt-10 pb-6 border-b border-ink-800">
      <div className="flex items-start justify-between gap-6">
        <div>
          {eyebrow && (
            <div className="font-display text-[11px] uppercase tracking-[0.22em] text-accent mb-3">
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif text-[44px] leading-[1.05] tracking-tightest font-light text-ink-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[15px] text-ink-400 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="pt-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Section({ title, action, children, className }) {
  return (
    <section className={cn("px-8 py-8", className)}>
      <div className="section-head">
        <h2 className="font-display text-sm uppercase tracking-[0.18em] text-ink-100">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Kpi({ label, value, delta, tone = "text-ink-100" }) {
  return (
    <div className="card p-5">
      <div className="kpi-label">{label}</div>
      <div className={cn("kpi-value mt-2", tone)}>{value}</div>
      {delta !== undefined && delta !== null && (
        <div
          className={cn(
            "text-xs mt-1.5 font-display",
            typeof delta === "number" && delta < 0 ? "text-signal-red" : "text-signal-green"
          )}
        >
          {typeof delta === "number"
            ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`
            : delta}
        </div>
      )}
    </div>
  );
}

export function Chip({ children, tone = "ink-700", className }) {
  return (
    <span
      className={cn(
        "chip",
        tone === "accent" && "border-accent/30 bg-accent/10 text-accent",
        tone === "red" && "border-signal-red/30 bg-signal-red/10 text-signal-red",
        tone === "amber" && "border-signal-amber/30 bg-signal-amber/10 text-signal-amber",
        tone === "green" && "border-signal-green/30 bg-signal-green/10 text-signal-green",
        tone === "blue" && "border-signal-blue/30 bg-signal-blue/10 text-signal-blue",
        tone === "violet" && "border-signal-violet/30 bg-signal-violet/10 text-signal-violet",
        tone === "ink-700" && "border-ink-700 bg-ink-800/60 text-ink-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ title = "No data", hint }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-ink-400 font-display text-sm">{title}</div>
      {hint && <div className="text-ink-500 text-xs mt-2">{hint}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-2 text-ink-400 text-sm font-display">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-accent opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>
      {label}
    </div>
  );
}

export function Table({ columns, rows, empty }) {
  if (!rows || rows.length === 0) return <Empty title={empty || "No rows"} />;
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-800/40 border-b border-ink-700">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left font-display text-[10px] uppercase tracking-[0.15em] text-ink-400 px-4 py-2.5"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-ink-800 last:border-0 hover:bg-ink-800/30 transition-colors"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2.5 text-ink-100">
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
