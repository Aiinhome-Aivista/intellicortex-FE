import { useState } from "react";
import { UploadCloud, Database, Zap, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";
import { PageHeader, Section, Chip, Spinner } from "../components/Primitives.jsx";

const VERTICALS = [
  { key: "all", label: "Everything" },
  { key: "retail", label: "Retail / FMCG" },
  { key: "supply_chain", label: "Supply Chain" },
  { key: "logistics", label: "Logistics" },
  { key: "planning", label: "Planning" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "procurement", label: "Procurement" },
  { key: "o2c", label: "Order-to-Cash" },
  { key: "finance", label: "Finance" },
  { key: "bfsi", label: "BFSI" },
  { key: "insurance", label: "Insurance" },
  { key: "risk", label: "Risk" },
  { key: "hr", label: "HR" },
];

export default function Ingestion() {
  const [running, setRunning] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const seed = async (vertical) => {
    setRunning(vertical);
    setResult(null);
    setError(null);
    try {
      const r = await api.seed(vertical);
      setResult({ vertical, data: r });
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  };

  const reset = async () => {
    if (!confirm("Wipe all graph collections? This only works in development mode.")) return;
    setRunning("__reset");
    try {
      const r = await api.reset();
      setResult({ vertical: "reset", data: r });
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Data ingestion"
        title="Connect. Capture. Decide."
        subtitle="Seed the demo dataset, or upload your own CSVs to populate the Intelligence Warehouse. Every entity and relationship is idempotent — re-running a load is safe."
      />

      <Section
        title="Quick seed"
        action={
          <button
            className="btn btn-ghost text-signal-red hover:text-signal-red hover:border-signal-red/40"
            onClick={reset}
            disabled={running !== null}
          >
            <RotateCcw size={13} /> Reset graph
          </button>
        }
      >
        <div className="grid grid-cols-3 gap-3">
          {VERTICALS.map((v) => (
            <button
              key={v.key}
              onClick={() => seed(v.key)}
              disabled={running !== null}
              className="card card-hover p-4 text-left disabled:opacity-50 disabled:cursor-wait"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-[13px] text-slate-900 dark:text-ink-100">{v.label}</span>
                {running === v.key ? (
                  <Spinner label="" />
                ) : (
                  <Zap size={13} className="text-accent opacity-60" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-ink-500 font-display uppercase tracking-wider">
                {v.key === "all" ? "All domains" : "Vertical"}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {result && (
        <Section title="Last run">
          <div className="card p-5 border-signal-green/30 bg-signal-green/5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-signal-green" />
              <span className="font-display text-sm text-signal-green uppercase tracking-wider">
                {result.vertical === "reset" ? "Graph reset" : `Seed complete · ${result.vertical}`}
              </span>
            </div>
            <pre className="mono text-[11px] leading-relaxed text-slate-600 dark:text-ink-300 overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </Section>
      )}

      {error && (
        <Section title="Error">
          <div className="card p-5 border-signal-red/40 bg-signal-red/5 flex items-start gap-3">
            <AlertCircle size={16} className="text-signal-red mt-0.5 shrink-0" />
            <div>
              <div className="font-display text-sm text-signal-red uppercase tracking-wider mb-1">
                Ingestion failed
              </div>
              <div className="text-sm text-slate-600 dark:text-ink-300">{error}</div>
            </div>
          </div>
        </Section>
      )}

      <Section title="Upload CSV">
        <CsvUpload />
      </Section>

      <Section title="Upload edges (relationships)">
        <EdgeUpload />
      </Section>
    </>
  );
}

function CsvUpload() {
  const [file, setFile] = useState(null);
  const [collection, setCollection] = useState("Product");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("collection", collection);
      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN || "dev-token"}` },
        body: fd,
      });
      const json = await res.json();
      setStatus(res.ok ? { ok: true, ...json } : { ok: false, ...json });
    } catch (e) {
      setStatus({ ok: false, error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="kpi-label block mb-2">CSV file</label>
          <div className="border border-dashed border-slate-200 dark:border-ink-700 rounded-lg p-5 text-center hover:border-accent/40 transition-colors">
            <UploadCloud size={24} className="mx-auto text-slate-400 dark:text-ink-500 mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 dark:text-ink-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-display file:uppercase file:tracking-wider file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
            />
            {file && (
              <div className="mt-3 text-xs text-slate-500 dark:text-ink-400 mono">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="kpi-label block mb-2">Target collection</label>
          <select
            className="input"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            {[
              "Product", "Outlet", "Customer", "Vendor", "Employee",
              "Promotion", "InventoryNode", "Shipment", "Plant",
              "PurchaseOrder", "SalesOrder", "Invoice", "Policy", "KPI",
              "Risk", "Claim", "InsurancePolicy", "Loan", "Account",
            ].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 dark:text-ink-500 mt-2 leading-relaxed">
            First column should be <span className="mono text-accent">key</span> or
            an auto-detected id column (sku, code, id).
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400 dark:text-ink-500">
          All other columns become document fields.
        </div>
        <button className="btn btn-primary" onClick={upload} disabled={!file || busy}>
          <UploadCloud size={14} /> {busy ? "Uploading…" : "Ingest"}
        </button>
      </div>
      {status && (
        <div
          className={`text-sm p-3 rounded border ${
            status.ok
              ? "border-signal-green/30 bg-signal-green/5 text-signal-green"
              : "border-signal-red/30 bg-signal-red/5 text-signal-red"
          }`}
        >
          {status.ok
            ? `Ingested ${status.ingested} rows into ${status.collection}.`
            : `Failed: ${status.error}`}
        </div>
      )}
    </div>
  );
}

function EdgeUpload() {
  const [file, setFile] = useState(null);
  const [edge, setEdge] = useState("supplies");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("edge_collection", edge);
      const res = await fetch("/api/ingest/edges", {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN || "dev-token"}` },
        body: fd,
      });
      const json = await res.json();
      setStatus(res.ok ? { ok: true, ...json } : { ok: false, ...json });
    } catch (e) {
      setStatus({ ok: false, error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="kpi-label block mb-2">Edges CSV</label>
          <div className="border border-dashed border-slate-200 dark:border-ink-700 rounded-lg p-5 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 dark:text-ink-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-display file:uppercase file:tracking-wider file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
            />
            {file && (
              <div className="mt-3 text-xs text-slate-500 dark:text-ink-400 mono">{file.name}</div>
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-ink-500 mt-2 leading-relaxed">
            Required columns: <span className="mono text-accent">from</span>,
            <span className="mono text-accent"> to</span>. Values must be full graph ids
            like <span className="mono">Product/SKU-1001</span>.
          </div>
        </div>
        <div>
          <label className="kpi-label block mb-2">Edge type</label>
          <select
            className="input"
            value={edge}
            onChange={(e) => setEdge(e.target.value)}
          >
            {[
              "belongs_to", "located_in", "supplies", "serves", "stocked_at",
              "sold_at", "targets", "fulfilled_by", "forecast_for", "produced_on",
              "carried_by", "bills", "pays", "holds_account", "owes_on",
              "covers", "claims_on", "flagged_as", "mitigates", "governed_by",
              "employed_in",
            ].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Chip tone="ink-700">
          <Database size={11} /> Idempotent — safe to re-run
        </Chip>
        <button className="btn btn-primary" onClick={upload} disabled={!file || busy}>
          <UploadCloud size={14} /> {busy ? "Uploading…" : "Ingest edges"}
        </button>
      </div>
      {status && (
        <div
          className={`text-sm p-3 rounded border ${
            status.ok
              ? "border-signal-green/30 bg-signal-green/5 text-signal-green"
              : "border-signal-red/30 bg-signal-red/5 text-signal-red"
          }`}
        >
          {status.ok
            ? `Ingested ${status.ingested} edges into ${status.edge_collection}.`
            : `Failed: ${status.error}`}
        </div>
      )}
    </div>
  );
}
