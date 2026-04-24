import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Network, Cpu } from "lucide-react";
import { api } from "../lib/api.js";
import { PageHeader, Section, Kpi, Chip, Empty, Spinner, Table } from "../components/Primitives.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { DOMAIN_LABELS, timeAgo } from "../lib/utils.js";

export default function Home() {
  const { data: counts, loading: lc } = useFetch(() => api.counts(), []);
  const { data: decisions, loading: ld } = useFetch(() => api.history(null, 8), []);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.ready().then(setHealth).catch(() => setHealth({ arango: false, llm: false }));
  }, []);

  const vertexTotal = counts
    ? Object.values(counts.vertices || {}).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const edgeTotal = counts
    ? Object.values(counts.edges || {}).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const decisionCount = (counts?.vertices?.Decision) || 0;

  return (
    <>
      <PageHeader
        eyebrow="Intelligence Warehouse / Online"
        title={
          <>
            One enterprise. <br />
            <span className="text-ink-400">One decision system.</span>
          </>
        }
        subtitle="Purpose-built agents for supply chain, sales, planning, production, procurement, logistics, finance, BFSI, insurance, risk, and HR — coordinated through shared business knowledge."
        actions={
          <Link to="/ask" className="btn btn-primary">
            Ask a question
            <ArrowRight size={14} />
          </Link>
        }
      />

      <Section
        title="Warehouse health"
        action={
          <div className="flex items-center gap-2 text-xs font-display">
            <Chip tone={health?.arango ? "green" : "red"}>
              <Network size={11} /> Graph {health?.arango ? "online" : "offline"}
            </Chip>
            <Chip tone={health?.llm ? "green" : "amber"}>
              <Cpu size={11} /> Mistral {health?.llm ? "ready" : "warming"}
            </Chip>
          </div>
        }
      >
        <div className="grid grid-cols-4 gap-4">
          <Kpi label="Entities in graph" value={lc ? "…" : vertexTotal.toLocaleString()} />
          <Kpi label="Relationships" value={lc ? "…" : edgeTotal.toLocaleString()} />
          <Kpi label="Decisions recorded" value={lc ? "…" : decisionCount.toLocaleString()} />
          <Kpi label="Active agents" value="13" delta="11 domain + 2 meta" />
        </div>
      </Section>

      <Section
        title="Recent enterprise decisions"
        action={
          <Link to="/decisions" className="text-xs text-accent hover:underline font-display">
            View feed →
          </Link>
        }
      >
        {ld ? (
          <Spinner label="Loading decisions…" />
        ) : decisions && decisions.length > 0 ? (
          <div className="space-y-3">
            {decisions.map((d) => (
              <Link
                key={d._key}
                to="/decisions"
                className="card card-hover p-5 flex gap-5 items-start"
              >
                <div className="mt-1">
                  <Chip tone="accent">
                    <Zap size={11} />
                    {DOMAIN_LABELS[d.agent] || d.agent}
                  </Chip>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-display uppercase tracking-widest text-ink-500 mb-1">
                    {timeAgo(d.created_at)} · confidence {(d.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-ink-100 text-[15px] mb-1.5 font-medium line-clamp-1">
                    {d.question}
                  </div>
                  <div className="text-ink-400 text-sm line-clamp-2">{d.decision}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="No decisions yet"
            hint="Head to Ask to produce your first enterprise decision."
          />
        )}
      </Section>

      <Section title="Warehouse by domain">
        {lc ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              { key: "collection", label: "Collection" },
              { key: "count", label: "Count", render: (r) => r.count.toLocaleString() },
              {
                key: "link",
                label: "",
                render: () => <ArrowRight size={12} className="text-ink-500" />,
              },
            ]}
            rows={Object.entries(counts?.vertices || {})
              .filter(([, v]) => v > 0)
              .sort((a, b) => (b[1] || 0) - (a[1] || 0))
              .slice(0, 12)
              .map(([collection, count]) => ({ collection, count }))}
            empty="Warehouse is empty — seed the demo data from the Ingestion page."
          />
        )}
      </Section>
    </>
  );
}
