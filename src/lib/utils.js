export function cn(...args) {
  return args.filter(Boolean).join(" ");
}

export function formatNumber(n, opts = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: opts.decimals ?? 1,
  });
}

export function formatPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const secs = (Date.now() - d.getTime()) / 1000;
  if (secs < 60) return `${Math.round(secs)}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

export function toneForPct(n, { inverted = false } = {}) {
  if (n == null) return "text-ink-400";
  const bad = inverted ? n > 0 : n < 0;
  const threshold = 5;
  if (Math.abs(n) < threshold) return "text-ink-400";
  return bad ? "text-signal-red" : "text-signal-green";
}

export const DOMAIN_LABELS = {
  supply_chain: "Supply Chain",
  sales: "Sales",
  planning: "Planning",
  finance: "Finance",
  bfsi: "Banking & Finance",
  insurance: "Insurance",
  risk: "Risk",
  hr: "Human Resources",
  production: "Production",
  o2c: "Order-to-Cash",
  procurement: "Procurement",
  logistics: "Logistics",
  root_cause: "Root-Cause",
  enterprise: "Enterprise",
};

export const DOMAIN_COLORS = {
  supply_chain: "signal-blue",
  sales: "signal-green",
  planning: "signal-violet",
  finance: "accent",
  bfsi: "signal-amber",
  insurance: "signal-violet",
  risk: "signal-red",
  hr: "signal-blue",
  production: "signal-amber",
  o2c: "signal-green",
  procurement: "signal-blue",
  logistics: "signal-violet",
  root_cause: "accent",
  enterprise: "accent",
};
