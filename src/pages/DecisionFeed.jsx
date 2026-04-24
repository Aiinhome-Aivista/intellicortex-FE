import { useState } from "react";
import { api } from "../lib/api.js";
import { PageHeader, Section, Chip, Empty, Spinner } from "../components/Primitives.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { DOMAIN_LABELS, timeAgo } from "../lib/utils.js";

const AGENTS = [
  "enterprise", "supply_chain", "sales", "planning", "production",
  "procurement", "logistics", "o2c", "finance", "bfsi", "insurance",
  "risk", "hr", "root_cause",
];

export default function DecisionFeed() {
  const [filter, setFilter] = useState(null);
  const { data, loading } = useFetch(() => api.history(filter, 50), [filter]);

  return (
    <>
      <PageHeader
        eyebrow="Decision history"
        title="Everything the system has decided"
        subtitle="Every enterprise decision is persisted as a graph node with links to the signals that caused it and the actions it recommends."
      />

      <Section
        title="Filter"
        action={
          filter && (
            <button
              className="text-xs text-accent hover:underline font-display"
              onClick={() => setFilter(null)}
            >
              Clear
            </button>
          )
        }
      >
        <div className="flex flex-wrap gap-2">
          {AGENTS.map((a) => (
            <button
              key={a}
              onClick={() => setFilter(filter === a ? null : a)}
              className={`text-[11px] font-display uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                filter === a
                  ? "border-accent text-accent bg-accent/10"
                  : "border-ink-700 text-ink-400 hover:text-ink-100 hover:border-ink-500"
              }`}
            >
              {DOMAIN_LABELS[a] || a}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Decisions">
        {loading ? (
          <Spinner />
        ) : !data || data.length === 0 ? (
          <Empty title="No decisions recorded" hint="Ask a question to produce your first." />
        ) : (
          <div className="space-y-3">
            {data.map((d) => (
              <article key={d._key} className="card p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <Chip tone="accent">{DOMAIN_LABELS[d.agent] || d.agent}</Chip>
                  <div className="text-[11px] font-display text-ink-500 uppercase tracking-wider">
                    {timeAgo(d.created_at)} ·{" "}
                    {Math.round((d.confidence || 0) * 100)}% confidence
                  </div>
                </div>
                <div className="text-ink-400 text-xs font-display uppercase mb-1.5">
                  Q:
                </div>
                <div className="text-ink-100 text-[15px] font-medium mb-3">
                  {d.question}
                </div>
                <div className="text-ink-400 text-xs font-display uppercase mb-1.5">
                  Decision:
                </div>
                <div className="text-ink-100 text-sm leading-relaxed border-l-2 border-accent/40 pl-3">
                  {d.decision}
                </div>
                {d.rationale && (
                  <details className="mt-3">
                    <summary className="text-[11px] font-display uppercase tracking-wider text-ink-500 cursor-pointer hover:text-ink-300">
                      Rationale
                    </summary>
                    <div className="text-sm text-ink-400 mt-2 leading-relaxed">
                      {d.rationale}
                    </div>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
