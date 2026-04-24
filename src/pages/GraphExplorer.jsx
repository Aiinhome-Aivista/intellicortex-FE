import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Search, GitBranch } from "lucide-react";
import { api } from "../lib/api.js";
import { PageHeader, Chip, Empty, Spinner } from "../components/Primitives.jsx";

const TYPE_COLOR = {
  Product: "#4aa7ff",
  Outlet: "#2bd07c",
  Region: "#a98bff",
  InventoryNode: "#ffb547",
  KPI: "#e8ff4a",
  Decision: "#e8ff4a",
  Shipment: "#ff4d5e",
  Vendor: "#a98bff",
  Customer: "#4aa7ff",
  Plant: "#ffb547",
  ProductionLine: "#ffb547",
  Policy: "#6b7189",
  Risk: "#ff4d5e",
  Promotion: "#2bd07c",
  default: "#6b7189",
};

export default function GraphExplorer() {
  const [entityId, setEntityId] = useState("");
  const [depth, setDepth] = useState(3);
  const [walk, setWalk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);

  const run = async () => {
    if (!entityId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.trace(entityId.trim(), depth);
      setWalk(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!walk || !svgRef.current) return;
    renderForce(svgRef.current, entityId, walk);
  }, [walk, entityId]);

  return (
    <>
      <PageHeader
        eyebrow="Graph explorer"
        title="Trace causation across domains"
        subtitle="Give us any entity — an outlet, a SKU, a vendor, a customer — and we walk the graph across functional boundaries to find what's connected."
      />

      <div className="px-8 py-6 space-y-6">
        <div className="card p-5">
          <label className="kpi-label mb-2 block">Starting entity</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <input
                className="input pl-9 mono"
                placeholder="e.g. Outlet/OUT-2003 or Product/SKU-1010"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
              />
            </div>
            <select
              className="input w-28"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            >
              <option value={1}>depth 1</option>
              <option value={2}>depth 2</option>
              <option value={3}>depth 3</option>
              <option value={4}>depth 4</option>
            </select>
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              <GitBranch size={14} /> Trace
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Outlet/OUT-2003",
              "Product/SKU-1010",
              "Plant/PLT-02",
              "Vendor/VND-105",
              "Customer/CUST-3005",
              "Risk/RSK-005",
            ].map((ex) => (
              <button
                key={ex}
                className="text-xs text-ink-400 hover:text-ink-100 px-3 py-1.5 rounded-full border border-ink-700 hover:border-ink-500 transition-colors mono"
                onClick={() => setEntityId(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card p-4 border-signal-red/40 bg-signal-red/5 text-signal-red text-sm">
            {error}
          </div>
        )}

        {loading && <Spinner label="Walking graph…" />}

        {walk && walk.length === 0 && (
          <Empty title="No neighbours found" hint="Try a different entity or increase depth." />
        )}

        {walk && walk.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 card p-2 h-[560px] overflow-hidden">
              <svg ref={svgRef} className="w-full h-full" />
            </div>
            <div className="card p-5 overflow-y-auto h-[560px]">
              <div className="kpi-label mb-3">Touched {walk.length} nodes</div>
              <ul className="space-y-2">
                {walk.slice(0, 80).map((n, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded border border-ink-800 hover:border-ink-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-display text-[10px] uppercase tracking-wider"
                        style={{ color: TYPE_COLOR[n.node_type] || TYPE_COLOR.default }}
                      >
                        {n.node_type} · d{n.depth}
                      </span>
                      <Chip tone="ink-700">{n.edge_type}</Chip>
                    </div>
                    <div className="text-sm text-ink-100 truncate">{n.name || n.node_id}</div>
                    <div className="mono text-[11px] text-ink-500 truncate">{n.node_id}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function renderForce(svgEl, rootId, walk) {
  const width = svgEl.clientWidth;
  const height = svgEl.clientHeight;
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  // Build nodes + links from walk (walk is a flat list of node touches)
  const nodeMap = new Map();
  nodeMap.set(rootId, { id: rootId, type: rootId.split("/")[0], name: rootId, depth: 0 });
  const links = [];
  for (const step of walk) {
    const nid = step.node_id;
    if (!nodeMap.has(nid)) {
      nodeMap.set(nid, {
        id: nid,
        type: step.node_type,
        name: step.name || nid,
        depth: step.depth,
      });
    }
    links.push({
      source: rootId,
      target: nid,
      label: step.edge_type,
      depth: step.depth,
    });
  }
  const nodes = Array.from(nodeMap.values());

  const g = svg.append("g");
  const zoom = d3.zoom().scaleExtent([0.2, 3]).on("zoom", (e) => g.attr("transform", e.transform));
  svg.call(zoom);

  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(100).strength(0.4))
    .force("charge", d3.forceManyBody().strength(-280))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(32));

  const link = g.append("g")
    .attr("stroke", "#2a2e40")
    .attr("stroke-opacity", 0.8)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", 1);

  const node = g.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("cursor", "pointer")
    .call(d3.drag()
      .on("start", (e, d) => {
        if (!e.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => {
        if (!e.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      }));

  node.append("circle")
    .attr("r", (d) => (d.id === rootId ? 14 : 8))
    .attr("fill", (d) => TYPE_COLOR[d.type] || TYPE_COLOR.default)
    .attr("fill-opacity", 0.2)
    .attr("stroke", (d) => TYPE_COLOR[d.type] || TYPE_COLOR.default)
    .attr("stroke-width", (d) => (d.id === rootId ? 2 : 1.3));

  node.append("text")
    .text((d) => (d.name || d.id).slice(0, 18))
    .attr("dy", (d) => (d.id === rootId ? -20 : -14))
    .attr("text-anchor", "middle")
    .attr("font-family", "JetBrains Mono, monospace")
    .attr("font-size", 10)
    .attr("fill", "#d7dae3");

  node.append("title").text((d) => `${d.id}\n${d.name || ""}`);

  sim.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
}
