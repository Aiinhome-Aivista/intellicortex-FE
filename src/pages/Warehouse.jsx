import { useState } from "react";
import { PageHeader, Section, Chip, Spinner } from "../components/Primitives.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../lib/api.js";

export default function Warehouse() {
  const { data: schema, loading } = useFetch(() => api.schema(), []);
  const { data: counts } = useFetch(() => api.counts(), []);
  const [selected, setSelected] = useState(null);

  if (loading || !schema) {
    return (
      <>
        <PageHeader title="Intelligence Warehouse" />
        <div className="p-8">
          <Spinner />
        </div>
      </>
    );
  }

  const vertexCounts = counts?.vertices || {};
  const edgeCounts = counts?.edges || {};
  const incomingEdges = (collection) =>
    schema.edge_definitions.filter((d) =>
      d.to_vertex_collections.includes(collection)
    );
  const outgoingEdges = (collection) =>
    schema.edge_definitions.filter((d) =>
      d.from_vertex_collections.includes(collection)
    );

  return (
    <>
      <PageHeader
        eyebrow="Schema · ontology"
        title="The business as a graph"
        subtitle={`${schema.vertex_collections.length} entity types linked by ${schema.edge_collections.length} named relationships.`}
      />

      <div className="px-8 py-6 grid grid-cols-3 gap-6">
        <Section title="Entity types" className="col-span-1 !px-0 !py-0">
          <div className="space-y-1 max-h-[75vh] overflow-y-auto pr-2">
            {schema.vertex_collections.map((v) => (
              <button
                key={v}
                onClick={() => setSelected(v)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected === v
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-ink-100 hover:bg-ink-800/60 border border-transparent"
                }`}
              >
                <span className="font-display text-[13px]">{v}</span>
                <span className="text-[11px] text-ink-500 mono">
                  {vertexCounts[v]?.toLocaleString() || 0}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <div className="col-span-2 space-y-6">
          {selected ? (
            <EntityDetail
              name={selected}
              incoming={incomingEdges(selected)}
              outgoing={outgoingEdges(selected)}
            />
          ) : (
            <div className="card p-10 text-center">
              <div className="font-serif text-xl text-ink-400 mb-2">
                Pick an entity type
              </div>
              <div className="text-sm text-ink-500">
                Select an entity on the left to see its relationships.
              </div>
            </div>
          )}

          <Section title="Edge collections" className="!px-0 !py-0">
            <div className="grid grid-cols-3 gap-2">
              {schema.edge_collections.map((e) => (
                <div
                  key={e}
                  className="card p-3 flex items-center justify-between"
                >
                  <span className="font-display text-xs text-ink-100">{e}</span>
                  <span className="text-[11px] text-ink-500 mono">
                    {edgeCounts[e]?.toLocaleString() || 0}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function EntityDetail({ name, incoming, outgoing }) {
  return (
    <div className="card p-6">
      <h3 className="font-serif text-3xl font-light text-ink-100 tracking-tightest mb-1">
        {name}
      </h3>
      <div className="kpi-label mb-6">Entity type</div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="kpi-label mb-3">Outgoing edges</div>
          {outgoing.length === 0 ? (
            <div className="text-sm text-ink-500">No outgoing relationships defined.</div>
          ) : (
            <ul className="space-y-2">
              {outgoing.map((e, i) => (
                <li key={i} className="text-sm">
                  <Chip tone="accent" className="mr-2">{e.edge_collection}</Chip>
                  <span className="text-ink-400">→</span>{" "}
                  <span className="text-ink-100 font-display text-xs">
                    {e.to_vertex_collections.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="kpi-label mb-3">Incoming edges</div>
          {incoming.length === 0 ? (
            <div className="text-sm text-ink-500">No incoming relationships defined.</div>
          ) : (
            <ul className="space-y-2">
              {incoming.map((e, i) => (
                <li key={i} className="text-sm">
                  <span className="text-ink-100 font-display text-xs">
                    {e.from_vertex_collections.join(", ")}
                  </span>{" "}
                  <span className="text-ink-400">→</span>{" "}
                  <Chip tone="ink-700" className="ml-1">{e.edge_collection}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
