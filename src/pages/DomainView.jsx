import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell,
} from "recharts";
import { api } from "../lib/api.js";
import {
  PageHeader, Section, Kpi, Chip, Empty, Spinner, Table,
} from "../components/Primitives.jsx";
import { DOMAIN_LABELS, formatNumber, formatPct, toneForPct } from "../lib/utils.js";
import { useTheme } from "../hooks/useTheme.jsx";

/**
 * Domain specifications.
 *
 * Each entry declares how to load the signals, the KPI tiles, and the
 * main table for its domain. Adding a new domain is additive — no UI
 * changes elsewhere.
 */
const SPECS = {
  supply_chain: {
    label: "Supply Chain",
    hint: "Stockouts, on-hand, days of cover.",
    loader: () => api.stockouts(null, 2),
    kpis: (rows) => [
      { label: "Products at risk", value: formatNumber(rows.length) },
      {
        label: "Worst stockout (days)",
        value: formatNumber(Math.max(...rows.map((r) => r.stockout_days || 0), 0)),
      },
      {
        label: "Median stockout (days)",
        value: formatNumber(median(rows.map((r) => r.stockout_days || 0))),
      },
    ],
    chart: (rows) =>
      rows.slice(0, 12).map((r) => ({
        name: r.sku, value: r.stockout_days, color: "#ff4d5e",
      })),
    columns: [
      { key: "sku", label: "SKU" },
      { key: "name", label: "Product" },
      { key: "region", label: "Region" },
      {
        key: "stockout_days", label: "Stockout (days)",
        render: (r) => (
          <span className={r.stockout_days > 5 ? "text-signal-red" : "text-signal-amber"}>
            {r.stockout_days}
          </span>
        ),
      },
    ],
  },
  sales: {
    label: "Sales",
    hint: "Outlet performance vs target.",
    loader: () => api.underperformingOutlets("PAN_IN", -5),
    kpis: (rows) => [
      { label: "Outlets underperforming", value: formatNumber(rows.length) },
      {
        label: "Avg gap to target",
        value: formatPct(avg(rows.map((r) => r.sales_vs_target_pct))),
        tone: toneForPct(avg(rows.map((r) => r.sales_vs_target_pct))),
      },
      {
        label: "Worst outlet",
        value: formatPct(Math.min(...rows.map((r) => r.sales_vs_target_pct), 0)),
      },
    ],
    chart: (rows) =>
      rows.slice(0, 12).map((r) => ({
        name: r.code, value: r.sales_vs_target_pct,
        color: r.sales_vs_target_pct < -15 ? "#ff4d5e" : "#ffb547",
      })),
    columns: [
      { key: "code", label: "Outlet" },
      { key: "name", label: "Name" },
      { key: "region", label: "Region" },
      {
        key: "sales_vs_target_pct", label: "vs target",
        render: (r) => (
          <span className={toneForPct(r.sales_vs_target_pct)}>
            {formatPct(r.sales_vs_target_pct)}
          </span>
        ),
      },
    ],
  },
  planning: {
    label: "Planning",
    hint: "Forecast vs actuals gap.",
    loader: async () => {
      const period = new Date().toISOString().slice(0, 7);
      const res = await fetch(
        `/api/warehouse/forecast-vs-actuals?region=R-NORTH&period=${period}`,
        { headers: { Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN || "dev-token"}` } }
      );
      return res.ok ? res.json() : [];
    },
    kpis: (rows) => {
      const gaps = rows.filter((r) => r.gap_pct !== null).map((r) => r.gap_pct);
      return [
        { label: "SKUs with gap data", value: formatNumber(gaps.length) },
        {
          label: "Avg forecast bias",
          value: formatPct(avg(gaps)),
          tone: toneForPct(avg(gaps), { inverted: true }),
        },
        {
          label: "Worst miss (abs)",
          value: formatPct(Math.max(...gaps.map((g) => Math.abs(g)), 0)),
        },
      ];
    },
    chart: (rows) =>
      rows
        .filter((r) => r.gap_pct !== null)
        .slice(0, 12)
        .map((r) => ({
          name: r.sku,
          value: r.gap_pct,
          color: Math.abs(r.gap_pct) > 20 ? "#ff4d5e" : "#4aa7ff",
        })),
    columns: [
      { key: "sku", label: "SKU" },
      { key: "forecast_units", label: "Forecast" },
      { key: "actual_units", label: "Actual" },
      {
        key: "gap_pct", label: "Gap",
        render: (r) => (
          <span className={toneForPct(r.gap_pct, { inverted: true })}>
            {formatPct(r.gap_pct)}
          </span>
        ),
      },
    ],
  },
  production: {
    label: "Production",
    hint: "Line OEE and work orders.",
    loader: () => api.oee("PLT-01"),
    kpis: (rows) => [
      { label: "Lines measured", value: formatNumber(rows.length) },
      {
        label: "Avg OEE",
        value: `${avg(rows.map((r) => r.oee)).toFixed(1)}%`,
      },
      {
        label: "Worst line",
        value: `${Math.min(...rows.map((r) => r.oee), 0).toFixed(1)}%`,
      },
    ],
    chart: (rows) =>
      rows.map((r) => ({
        name: (r.line || "").split("/").pop(),
        value: r.oee,
        color: r.oee < 65 ? "#ff4d5e" : r.oee < 80 ? "#ffb547" : "#2bd07c",
      })),
    columns: [
      { key: "line", label: "Line" },
      {
        key: "oee", label: "OEE",
        render: (r) => (
          <span
            className={
              r.oee < 65 ? "text-signal-red" :
              r.oee < 80 ? "text-signal-amber" : "text-signal-green"
            }
          >
            {r.oee.toFixed(1)}%
          </span>
        ),
      },
    ],
  },
  procurement: {
    label: "Procurement",
    hint: "Open POs and vendor risk.",
    loader: () => api.openPos(),
    kpis: (rows) => [
      { label: "Open POs", value: formatNumber(rows.length) },
      {
        label: "Open value",
        value: `₹${formatNumber(rows.reduce((s, r) => s + (r.amount || 0), 0))}`,
      },
      {
        label: "Vendors involved",
        value: formatNumber(new Set(rows.map((r) => r.vendor_id)).size),
      },
    ],
    chart: (rows) => {
      const byVendor = rows.reduce((acc, r) => {
        acc[r.vendor_id] = (acc[r.vendor_id] || 0) + (r.amount || 0);
        return acc;
      }, {});
      return Object.entries(byVendor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value, color: "#a98bff" }));
    },
    columns: [
      { key: "po_no", label: "PO #" },
      { key: "vendor_id", label: "Vendor" },
      {
        key: "amount", label: "Value",
        render: (r) => `₹${formatNumber(r.amount)}`,
      },
      { key: "status", label: "Status" },
    ],
  },
  logistics: {
    label: "Logistics",
    hint: "Late shipments and lane performance.",
    loader: () => api.lateShipments(),
    kpis: (rows) => [
      { label: "Late shipments", value: formatNumber(rows.length) },
      {
        label: "Carriers involved",
        value: formatNumber(new Set(rows.map((r) => r.carrier)).size),
      },
      {
        label: "Delayed status",
        value: formatNumber(rows.filter((r) => r.status === "delayed").length),
      },
    ],
    chart: (rows) => {
      const byCarrier = rows.reduce((acc, r) => {
        acc[r.carrier] = (acc[r.carrier] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(byCarrier).map(([name, value]) => ({
        name, value, color: "#ffb547",
      }));
    },
    columns: [
      { key: "shipment_no", label: "Shipment" },
      { key: "carrier", label: "Carrier" },
      { key: "origin", label: "Origin" },
      { key: "destination", label: "Destination" },
      { key: "status", label: "Status" },
    ],
  },
  o2c: {
    label: "Order-to-Cash",
    hint: "AR aging and DSO.",
    loader: () => api.arAging(30),
    kpis: (rows) => [
      { label: "Overdue receivables", value: formatNumber(rows.length) },
      {
        label: "Overdue value",
        value: `₹${formatNumber(
          rows.reduce((s, r) => s + (r.receivable?.amount || 0), 0)
        )}`,
      },
      {
        label: "Avg age (days)",
        value: formatNumber(avg(rows.map((r) => r.age_days || 0))),
      },
    ],
    chart: (rows) => {
      const buckets = { "30-60": 0, "60-90": 0, "90+": 0 };
      rows.forEach((r) => {
        const age = r.age_days || 0;
        if (age < 60) buckets["30-60"] += r.receivable?.amount || 0;
        else if (age < 90) buckets["60-90"] += r.receivable?.amount || 0;
        else buckets["90+"] += r.receivable?.amount || 0;
      });
      return Object.entries(buckets).map(([name, value]) => ({
        name, value, color: "#ff4d5e",
      }));
    },
    columns: [
      { key: "rkey", label: "Receivable", render: (r) => r.receivable?._key || "—" },
      {
        key: "amount", label: "Amount",
        render: (r) => `₹${formatNumber(r.receivable?.amount)}`,
      },
      {
        key: "age_days", label: "Age",
        render: (r) => (
          <span className={r.age_days > 60 ? "text-signal-red" : "text-signal-amber"}>
            {r.age_days} days
          </span>
        ),
      },
    ],
  },
  finance: {
    label: "Finance",
    hint: "Budget variance.",
    loader: async () => [],
    kpis: () => [
      { label: "Module", value: "Budget variance" },
      { label: "Cost centers", value: "6" },
    ],
    chart: () => [],
    columns: [
      { key: "account", label: "Account" },
      { key: "budget", label: "Budget" },
      { key: "actual", label: "Actual" },
      { key: "variance_pct", label: "Variance" },
    ],
  },
  bfsi: {
    label: "Banking & Finance",
    hint: "Suspicious transactions.",
    loader: () => api.suspiciousTx(),
    kpis: (rows) => [
      { label: "Flagged transactions", value: formatNumber(rows.length) },
      {
        label: "Total value",
        value: `₹${formatNumber(rows.reduce((s, r) => s + (r.amount || 0), 0))}`,
      },
      {
        label: "Avg risk score",
        value: avg(rows.map((r) => r.risk_score || 0)).toFixed(2),
      },
    ],
    chart: (rows) => {
      const buckets = { "0.7-0.8": 0, "0.8-0.9": 0, "0.9+": 0 };
      rows.forEach((r) => {
        if (r.risk_score < 0.8) buckets["0.7-0.8"]++;
        else if (r.risk_score < 0.9) buckets["0.8-0.9"]++;
        else buckets["0.9+"]++;
      });
      return Object.entries(buckets).map(([name, value]) => ({
        name, value, color: "#ff4d5e",
      }));
    },
    columns: [
      { key: "_key", label: "Txn" },
      { key: "account_no", label: "Account" },
      {
        key: "amount", label: "Amount",
        render: (r) => `₹${formatNumber(r.amount)}`,
      },
      {
        key: "risk_score", label: "Risk",
        render: (r) => (
          <span className={r.risk_score > 0.85 ? "text-signal-red" : "text-signal-amber"}>
            {r.risk_score.toFixed(2)}
          </span>
        ),
      },
    ],
  },
  insurance: {
    label: "Insurance",
    hint: "High-risk claims.",
    loader: () => api.highRiskClaims(),
    kpis: (rows) => [
      { label: "High-risk claims", value: formatNumber(rows.length) },
      {
        label: "Exposure",
        value: `₹${formatNumber(rows.reduce((s, r) => s + (r.amount || 0), 0))}`,
      },
      {
        label: "Avg fraud score",
        value: avg(rows.map((r) => r.fraud_score || 0)).toFixed(2),
      },
    ],
    chart: (rows) => {
      const byLine = rows.reduce((acc, r) => {
        acc[r.product_line] = (acc[r.product_line] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(byLine).map(([name, value]) => ({
        name, value, color: "#a98bff",
      }));
    },
    columns: [
      { key: "claim_no", label: "Claim" },
      { key: "policy_no", label: "Policy" },
      { key: "product_line", label: "Line" },
      {
        key: "amount", label: "Amount",
        render: (r) => `₹${formatNumber(r.amount)}`,
      },
      {
        key: "fraud_score", label: "Fraud",
        render: (r) => (
          <span className={r.fraud_score > 0.7 ? "text-signal-red" : "text-signal-amber"}>
            {r.fraud_score.toFixed(2)}
          </span>
        ),
      },
    ],
  },
  risk: {
    label: "Risk",
    hint: "Enterprise risk register.",
    loader: () => api.riskRegister(4.0),
    kpis: (rows) => [
      { label: "Material risks", value: formatNumber(rows.length) },
      {
        label: "Avg risk score",
        value: avg(rows.map((r) => r.risk_score || 0)).toFixed(2),
      },
      {
        label: "Without controls",
        value: formatNumber(rows.filter((r) => (r.controls || []).length === 0).length),
      },
    ],
    chart: (rows) =>
      rows.slice(0, 10).map((r) => ({
        name: r.name.slice(0, 16),
        value: r.risk_score,
        color: r.risk_score > 3 ? "#ff4d5e" : "#ffb547",
      })),
    columns: [
      { key: "name", label: "Risk" },
      { key: "category", label: "Category" },
      {
        key: "risk_score", label: "Score",
        render: (r) => (
          <span className={r.risk_score > 3 ? "text-signal-red" : "text-signal-amber"}>
            {r.risk_score?.toFixed(2)}
          </span>
        ),
      },
      {
        key: "controls", label: "Controls",
        render: (r) => r.controls?.length || 0,
      },
    ],
  },
  hr: {
    label: "Human Resources",
    hint: "Attrition hotspots.",
    loader: () => api.attritionHotspots(10),
    kpis: (rows) => [
      { label: "Hot departments", value: formatNumber(rows.length) },
      {
        label: "Avg attrition",
        value: `${avg(rows.map((r) => r.rate_pct || 0)).toFixed(1)}%`,
      },
      {
        label: "Worst",
        value: `${Math.max(...rows.map((r) => r.rate_pct || 0), 0).toFixed(1)}%`,
      },
    ],
    chart: (rows) =>
      rows.map((r) => ({
        name: (r.department || "").replace("DEPT-", ""),
        value: r.rate_pct,
        color: r.rate_pct > 20 ? "#ff4d5e" : "#ffb547",
      })),
    columns: [
      {
        key: "department", label: "Department",
        render: (r) => (r.department || "").replace("DEPT-", ""),
      },
      {
        key: "rate_pct", label: "Rate",
        render: (r) => (
          <span className={r.rate_pct > 20 ? "text-signal-red" : "text-signal-amber"}>
            {r.rate_pct.toFixed(1)}%
          </span>
        ),
      },
      { key: "period", label: "Period" },
    ],
  },
};

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default function DomainView() {
  const { domain } = useParams();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const spec = SPECS[domain];

  useEffect(() => {
    if (!spec) return;
    setLoading(true);
    spec
      .loader()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [domain]);

  if (!spec) {
    return (
      <>
        <PageHeader title="Unknown domain" />
        <div className="p-8">
          <Empty title={`No spec for "${domain}"`} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Domain · ${DOMAIN_LABELS[domain] || domain}`}
        title={spec.label}
        subtitle={spec.hint}
      />

      {loading ? (
        <div className="px-8 py-8">
          <Spinner />
        </div>
      ) : error ? (
        <div className="px-8 py-8">
          <div className="card p-4 border-signal-red/40 bg-signal-red/5 text-signal-red text-sm">
            {error}
          </div>
        </div>
      ) : (
        <>
          <Section title="Signals at a glance">
            <div className="grid grid-cols-3 gap-4">
              {spec.kpis(rows).map((k, i) => (
                <Kpi key={i} {...k} />
              ))}
            </div>
          </Section>

          {spec.chart(rows).length > 0 && (
            <Section title="Distribution">
              <div className="card p-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spec.chart(rows)}>
                    <CartesianGrid stroke={isDark ? "#1f2230" : "#e2e8f0"} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#6b7189" : "#64748b"}
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <YAxis
                      stroke={isDark ? "#6b7189" : "#64748b"}
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#0f1117" : "#ffffff",
                        border: `1px solid ${isDark ? "#2a2e40" : "#e2e8f0"}`,
                        borderRadius: 6,
                      }}
                      labelStyle={{ color: isDark ? "#d7dae3" : "#0f172a" }}
                    />
                    <Bar dataKey="value">
                      {spec.chart(rows).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          <Section title="Detail">
            <Table columns={spec.columns} rows={rows} empty="No rows for this domain yet." />
          </Section>
        </>
      )}
    </>
  );
}
